import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, MapPin, Calendar as CalIcon, Clock, ShieldCheck, Star, User, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  providerService, 
  bookingService, 
  getRecommendedProviders, 
  checkAvailability,
  pricingService
} from '@/services';
import { SERVICE_CONFIG, formatCurrency, formatDate, cn } from '../../utils';
import { HYBRID_PRICING } from '../../utils/pricing';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import WizardProgress from '../../components/ui/WizardProgress';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../components/ui/Layout';

const DEBUG = import.meta.env.DEV;

const STORAGE_KEY = "rivo_booking_draft";

const STEPS = [
  { id: 1, label: "Service", key: "service" },
  { id: 2, label: "Care Level", key: "careLevel" },
  { id: 3, label: "Plan", key: "plan" },
  { id: 4, label: "Patient", key: "patient" },
  { id: 5, label: "Address", key: "address" },
  { id: 6, label: "Slot", key: "slot" },
  { id: 7, label: "Provider", key: "provider" }
];

const SERVICES = [
  { id: "nurse", label: "Nurse", icon: "💉" },
  { id: "physiotherapist", label: "Physiotherapist", icon: "🦴" },
  { id: "doctor", label: "Doctor", icon: "🧑‍⚕️" },
  { id: "caretaker", label: "Caretaker", icon: "🙌" },
  { id: "procedure", label: "Procedures", icon: "💊" },
  { id: "package", label: "Packages", icon: "🎁" },
];

export default function BookingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. SINGLE SOURCE OF TRUTH
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({
    service: null,
    careLevel: null,
    plan: null,
    patient: null,
    address: null,
    slot: null,
    provider: null,
    pricing: null,
    durationHours: 1,
    notes: ''
  });

  // Clear any stale draft on mount
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateBooking = (key, value) => {
    setBooking(prev => ({ ...prev, [key]: value }));
  };

  // 2. FIX STEP 2 CLICK (FORCE UPDATE)
  const handleCareLevelSelect = (levelId) => {
    console.log("👉 CLICKED CARE LEVEL:", levelId);
    setBooking(prev => ({
      ...prev,
      careLevel: levelId
    }));
  };

  // 5. FIX STEP 3 (PLAN NOT WORKING)
  const handlePlanSelect = (plan) => {
    console.log("👉 CLICKED PLAN:", plan.id);
    setBooking(prev => ({
      ...prev,
      plan: plan.id,
      durationHours: plan.durationHours || 1,
      pricing: plan.price || 500
    }));
  };

  // 3. VALIDATION ENGINE
  const isStepValid = (s) => {
    switch (s) {
      case 1: return !!booking.service;
      case 2: return !!booking.careLevel;
      case 3: return !!booking.plan;
      case 4: return !!booking.patient?.name && !!booking.patient?.age && !!booking.patient?.gender;
      case 5: return !!booking.address?.fullAddress && !!booking.address?.pincode;
      case 6: return !!booking.slot?.date && !!booking.slot?.time;
      case 7: return true; // allow fallback (temporary failsafe)
      default: return false;
    }
  };

  // 4. SAFE NAVIGATION
  const handleNext = () => {
    if (!isStepValid(step)) {
      console.error("❌ Step validation failed", step, booking);
      toast.error("Please complete all required fields.");
      return;
    }
    if (step < 7) {
      setStep(prev => prev + 1);
    } else {
      handleConfirm();
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // 7. STEP GUARD (ANTI-BREAK LOGIC)
  useEffect(() => {
    if (step > 1 && !booking.service) setStep(1);
    if (step > 2 && !booking.careLevel) setStep(2);
    if (step > 3 && !booking.plan) setStep(3);
    if (step > 4 && !booking.patient) setStep(4);
    if (step > 5 && !booking.address) setStep(5);
    if (step > 6 && !booking.slot) setStep(6);
  }, [step, booking]);

  // DEBUG LOGS (dev only)
  useEffect(() => {
    if (DEBUG) {
      console.log("CURRENT STEP:", step);
      console.log("BOOKING STATE:", booking);
    }
  }, [step, booking]);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [year, month, day] = booking.slot.date.split('-');
      const [hours, minutes] = booking.slot.time.split(':');
      const scheduledAt = new Date(year, month - 1, day, hours, minutes);

      const payload = {
        providerId: booking.provider._id,
        service: booking.service,
        address: booking.address.fullAddress,
        pincode: booking.address.pincode,
        scheduledAt,
        durationHours: booking.durationHours || 1,
        notes: JSON.stringify({
          careLevel: booking.careLevel,
          plan: booking.plan,
          patient: booking.patient,
          address: booking.address,
          pricing: booking.pricing,
          timestamp: Date.now(),
          flowVersion: "v2"
        })
      };

      // 7. CAPTURE BOOKING ID
      const res = await bookingService.create(payload);
      const bookingId = res?.data?._id || res?.data?.booking?._id;
      if (bookingId) localStorage.setItem("lastBookingId", bookingId);

      // 3. CLEAN STATE AFTER SUCCESS
      localStorage.removeItem(STORAGE_KEY);
      setBooking({
        service: null, careLevel: null, plan: null,
        patient: null, address: null, slot: null,
        provider: null, pricing: null, durationHours: 1, notes: ''
      });
      setStep(1);
      setIsSuccess(true);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("This slot is no longer available. Please select another time.");
        setStep(6);
        return;
      }
      if (DEBUG) console.error(err);
      toast.error(err.response?.data?.message || err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Renderers ──────────────────────────────────────────────

  const renderService = () => (
    <div className="space-y-4 animate-fade-in relative z-10 pointer-events-auto">
      <Section title="Select Service" subtitle="Step 1" />
      <div className="grid grid-cols-2 gap-3">
        {SERVICES.map(s => (
          <div 
            key={s.id} 
            onClick={() => updateBooking("service", s.id)}
            className={cn(
              "cursor-pointer border-2 rounded-[2.5rem] p-8 transition-all text-center",
              booking.service === s.id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600" : "border-slate-100 bg-white hover:border-blue-200"
            )}
          >
            <div className="text-5xl mb-4">{s.icon}</div>
            <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCareLevel = () => {
    const config = HYBRID_PRICING[booking.service] || {};
    const levels = config.levels || config.bundles || config.conditions || [
      { id: 'standard', label: 'Standard Care', desc: 'General professional assistance' }
    ];

    return (
      <div className="space-y-4 animate-fade-in relative z-10 pointer-events-auto" key={booking.careLevel}>
        <Section title="Care Level" subtitle="Step 2" />
        <div className="space-y-3">
          {levels.map(l => (
            <div 
              key={l.id} 
              onClick={() => handleCareLevelSelect(l.id)}
              className={cn(
                "p-5 cursor-pointer transition-all border-2 rounded-2xl",
                booking.careLevel === l.id ? "border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-600" : "border-slate-100 bg-white"
              )}
            >
              <p className="font-black text-slate-900 text-lg">{l.label}</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlan = () => {
    const config = HYBRID_PRICING[booking.service] || {};
    const plans = config.packs || config.shifts || config.actions || [
      { id: 'single_visit', label: 'Single Visit', durationHours: 1, price: 500 }
    ];

    return (
      <div className="space-y-4 animate-fade-in relative z-10 pointer-events-auto" key={booking.plan}>
        <Section title="Select Plan" subtitle="Step 3" />
        <div className="space-y-3">
          {plans.map(p => (
            <div 
              key={p.id} 
              onClick={() => handlePlanSelect(p)}
              className={cn(
                "p-6 cursor-pointer transition-all border-2 rounded-2xl flex justify-between items-center",
                booking.plan === p.id ? "border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-600" : "border-slate-100 bg-white"
              )}
            >
              <div className="flex flex-col">
                <p className="font-black text-slate-900 text-lg">{p.label}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{p.durationHours || 1} HOUR SESSION</p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-600 text-2xl">₹{p.price || 500}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPatient = () => (
    <div className="space-y-6 animate-fade-in relative z-10 pointer-events-auto">
      <Section title="Patient Info" subtitle="Step 4" />
      <Card className="space-y-5 rounded-3xl p-6">
        <Input label="Patient Name" value={booking.patient?.name || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Age" type="number" value={booking.patient?.age || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, age: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gender</label>
            <select className="input-base !rounded-xl" value={booking.patient?.gender || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-6 animate-fade-in relative z-10 pointer-events-auto">
      <Section title="Location" subtitle="Step 5" />
      <Card className="space-y-5 rounded-3xl p-6">
        <Input label="Pincode" maxLength="6" value={booking.address?.pincode || ''} onChange={(e) => updateBooking("address", { ...booking.address, pincode: e.target.value.replace(/\D/g, '') })} />
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Address</label>
          <textarea className="input-base !rounded-xl min-h-[120px]" placeholder="Full address details..." value={booking.address?.fullAddress || ''} onChange={(e) => updateBooking("address", { ...booking.address, fullAddress: e.target.value })} />
        </div>
      </Card>
    </div>
  );

  const renderSlot = () => {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0];
    });
    const slots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    return (
      <div className="space-y-8 animate-fade-in relative z-10 pointer-events-auto">
        <Section title="Timing" subtitle="Step 6" />
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {dates.map(d => (
            <div key={d} onClick={() => updateBooking("slot", { ...booking.slot, date: d })} className={cn("shrink-0 w-20 h-24 flex flex-col items-center justify-center rounded-[2rem] border-2 cursor-pointer transition-all", booking.slot?.date === d ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white border-slate-50")}>
              <span className="text-[10px] font-black uppercase opacity-60">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-2xl font-black mt-1">{new Date(d).getDate()}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {slots.map(t => (
            <button key={t} onClick={() => updateBooking("slot", { ...booking.slot, time: t })} className={cn("py-4 rounded-2xl font-black border-2 transition-all text-lg", booking.slot?.time === t ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-white border-slate-50")}>{t}</button>
          ))}
        </div>
      </div>
    );
  };

  const [providers, setProviders] = useState([]);
  const [fetchingProviders, setFetchingProviders] = useState(false);

  useEffect(() => {
    if (booking.slot?.date && booking.slot?.time && booking.service) {
      console.log("🔍 FETCHING PROVIDERS FOR:", { service: booking.service, pincode: booking.address?.pincode, slot: booking.slot });
      setFetchingProviders(true);
      providerService.getAll({ service: booking.service, pincode: booking.address?.pincode })
        .then(res => {
          const list = res.data.providers || [];
          setProviders(list);
          // 5. AUTO-SELECT FIRST PROVIDER
          if (list.length > 0 && !booking.provider) {
            updateBooking("provider", list[0]);
          }
        })
        .finally(() => setFetchingProviders(false));
    }
  }, [booking.slot, booking.service, booking.address?.pincode]);

  const renderProvider = () => {
    console.log("STEP 7 DATA", { booking, providers });
    
    return (
      <div className="space-y-6 animate-fade-in relative z-10 pointer-events-auto">
        <Section title="Expert" subtitle="Step 7" />
        
        {fetchingProviders ? (
          <p className="text-center py-20 font-black text-slate-400">Searching Experts...</p>
        ) : (
          <div className="space-y-4">
            {/* 2. HANDLE EMPTY PROVIDERS */}
            {providers?.length === 0 ? (
              <div className="text-center p-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="font-bold text-slate-500 mb-4">No experts available for the selected slot in your area.</p>
                <button
                  onClick={() => setStep(6)}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Change Time Slot
                </button>
              </div>
            ) : (
              providers.map(p => (
                <div key={p._id} onClick={() => updateBooking("provider", p)} className={cn("p-5 cursor-pointer flex items-center gap-5 border-2 rounded-3xl transition-all", booking.provider?._id === p._id ? "border-blue-600 bg-blue-50 shadow-xl ring-2 ring-blue-600" : "border-slate-50 bg-white")}>
                  <Avatar name={p.user.name} src={p.user.avatar} size="lg" className="ring-4 ring-white shadow-md" />
                  <div className="flex-1">
                    <p className="font-black text-slate-900 text-lg">{p.user.name}</p>
                    <div className="flex gap-3 items-center mt-1">
                       <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.experience} YRS EXP</span>
                       <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⭐ {p.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 text-xl">₹{p.pricePerHour}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <PageWrapper maxWidth="600px">
        <Card className="text-center py-24 mt-10 rounded-[5rem] shadow-2xl border-none">
          <div className="w-28 h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce"><CheckCircle size={56} /></div>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Booking Successful!</h2>
          <p className="text-slate-500 font-bold max-w-xs mx-auto mb-10">Your booking request is submitted. Provider will be confirmed shortly.</p>
          <Button onClick={() => navigate('/dashboard/patient/bookings')} className="!rounded-[2rem] !px-12 !py-5 text-xl font-black shadow-2xl">View My Bookings</Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper maxWidth="750px">

      <Card className="overflow-hidden border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-[4rem] mt-6 bg-white">
        <div className="bg-slate-950 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            {step > 1 ? (
              <button onClick={handleBack} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-95"><ChevronLeft size={28} /></button>
            ) : <div className="w-12" />}
            <div className="text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Step {step} of 7</p>
              <h2 className="text-2xl font-black text-white tracking-tight">{STEPS[step - 1].label}</h2>
            </div>
            <div className="w-12" />
          </div>
          <div className="flex gap-2 justify-center relative z-10">
            {STEPS.map(s => <div key={s.id} className={cn("h-1.5 rounded-full transition-all duration-700", s.id === step ? "w-14 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : s.id < step ? "w-4 bg-emerald-500" : "w-4 bg-slate-800")} />)}
          </div>
        </div>

        <div className="p-10 md:p-16 min-h-[550px] relative">
          {step === 1 && renderService()}
          {step === 2 && renderCareLevel()}
          {step === 3 && renderPlan()}
          {step === 4 && renderPatient()}
          {step === 5 && renderAddress()}
          {step === 6 && renderSlot()}
          {step === 7 && renderProvider()}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end">
           <Button 
             onClick={() => {
               if (!loading) handleNext();
             }} 
             disabled={!isStepValid(step) || loading}
             loading={loading}
             className={cn(
               "w-full md:w-auto !px-20 !py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all active:scale-95",
               isStepValid(step) && !loading ? "bg-blue-600 text-white shadow-blue-900/30" : "bg-slate-200 text-slate-400 cursor-not-allowed"
             )}
           >
             {step === 7 ? (loading ? "Booking..." : "Confirm Booking") : "Continue"} <ChevronRight size={32} className="ml-2" />
           </Button>
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </PageWrapper>
  );
}
