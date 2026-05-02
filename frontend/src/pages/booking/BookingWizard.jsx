import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, MapPin, Calendar as CalIcon, Clock, ShieldCheck, Star, User, Zap, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
  providerService, 
  bookingService, 
  pricingService
} from '@/services';
import { formatCurrency, formatDate, cn } from '../../utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../components/ui/Layout';

const DEBUG = import.meta.env.DEV;
const STORAGE_KEY = "rivo_booking_draft";

const STEPS = [
  { id: 1, label: "Service", key: "service" },
  { id: 2, label: "Offering", key: "plan" },
  { id: 3, label: "Patient", key: "patient" },
  { id: 4, label: "Location", key: "address" },
  { id: 5, label: "Schedule", key: "slot" },
  { id: 6, label: "Expert", key: "provider" }
];

export default function BookingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(true);
  const [fetchingPlans, setFetchingPlans] = useState(false);

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({
    service: null, // This will be the Service object
    plan: null,    // This will be the Plan object
    patient: null,
    address: null,
    slot: null,
    provider: null,
    durationHours: 1,
    notes: ''
  });

  // Fetch initial services
  useEffect(() => {
    pricingService.getServices()
      .then(res => setServices(res.data || []))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setFetchingServices(false));
  }, []);

  // Fetch plans when service changes
  useEffect(() => {
    if (booking.service?._id) {
      setFetchingPlans(true);
      pricingService.getPlansByService(booking.service._id)
        .then(res => setPlans(res.data || []))
        .catch(() => toast.error("Failed to load offerings"))
        .finally(() => setFetchingPlans(false));
    }
  }, [booking.service?._id]);

  const updateBooking = (key, value) => {
    setBooking(prev => ({ ...prev, [key]: value }));
  };

  const isStepValid = (s) => {
    switch (s) {
      case 1: return !!booking.service;
      case 2: return !!booking.plan;
      case 3: return !!booking.patient?.name && !!booking.patient?.age && !!booking.patient?.gender;
      case 4: return !!booking.address?.fullAddress && !!booking.address?.pincode;
      case 5: return !!booking.slot?.date && !!booking.slot?.time;
      case 6: return !!booking.provider;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid(step)) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (step < 6) setStep(prev => prev + 1);
    else handleConfirm();
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [year, month, day] = booking.slot.date.split('-');
      const [hours, minutes] = booking.slot.time.split(':');
      const scheduledAt = new Date(year, month - 1, day, hours, minutes);

      const payload = {
        providerId: booking.provider._id,
        service: booking.service._id,
        address: booking.address.fullAddress,
        pincode: booking.address.pincode,
        scheduledAt,
        durationHours: booking.plan.durationHours || 1,
        notes: JSON.stringify({
          planId: booking.plan._id,
          patient: booking.patient,
          flowVersion: "v3_unified"
        })
      };

      const res = await bookingService.create(payload);
      setIsSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Renderers ---

  const renderService = () => (
    <div className="space-y-6 animate-fade-in relative z-10">
      <Section title="Expert Care Categories" subtitle="What do you need help with today?" />
      {fetchingServices ? (
        <div className="py-20 text-center"><p className="font-black text-slate-300 animate-pulse">Syncing Catalog...</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {services.map(s => (
            <div 
              key={s._id} 
              onClick={() => {
                updateBooking("service", s);
                updateBooking("plan", null); // Reset plan
              }}
              className={cn(
                "cursor-pointer border-2 rounded-[2.5rem] p-8 transition-all text-center relative overflow-hidden group",
                booking.service?._id === s._id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600" : "border-slate-100 bg-white hover:border-blue-200"
              )}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{s.icon || '🏥'}</div>
              <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlan = () => (
    <div className="space-y-6 animate-fade-in relative z-10">
      <Section title="Select Your Offering" subtitle={`Available for ${booking.service?.name}`} />
      {fetchingPlans ? (
        <div className="py-20 text-center"><p className="font-black text-slate-300 animate-pulse">Loading Rates...</p></div>
      ) : plans.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-bold">No public plans available for this service yet.</div>
      ) : (
        <div className="space-y-4">
          {plans.map(p => (
            <div 
              key={p._id} 
              onClick={() => updateBooking("plan", p)}
              className={cn(
                "p-8 cursor-pointer transition-all border-2 rounded-[2.5rem] flex justify-between items-center",
                booking.plan?._id === p._id ? "border-blue-600 bg-blue-50 shadow-2xl ring-2 ring-blue-600" : "border-slate-100 bg-white"
              )}
            >
              <div>
                <p className="font-black text-slate-900 text-xl">{p.name}</p>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
                  {p.planType === 'subscription' ? `${p.sessionsPerWeek} Sessions / Week` : `${p.totalSessions} Total Sessions`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-600 text-3xl">₹{p.price}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Starting from</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPatient = () => (
    <div className="space-y-6 animate-fade-in relative z-10">
      <Section title="Patient Details" subtitle="Who is receiving care?" />
      <Card className="space-y-5 rounded-[2.5rem] p-8">
        <Input label="Patient Name" value={booking.patient?.name || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Age" type="number" value={booking.patient?.age || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, age: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gender</label>
            <select className="input-base !rounded-2xl" value={booking.patient?.gender || ''} onChange={(e) => updateBooking("patient", { ...booking.patient, gender: e.target.value })}>
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
    <div className="space-y-6 animate-fade-in relative z-10">
      <Section title="Service Address" subtitle="Where should we send the expert?" />
      <Card className="space-y-5 rounded-[2.5rem] p-8">
        <Input label="Pincode" maxLength="6" value={booking.address?.pincode || ''} onChange={(e) => updateBooking("address", { ...booking.address, pincode: e.target.value.replace(/\D/g, '') })} />
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Address</label>
          <textarea className="input-base !rounded-[2rem] min-h-[140px] p-6" placeholder="Street, House No, Landmark..." value={booking.address?.fullAddress || ''} onChange={(e) => updateBooking("address", { ...booking.address, fullAddress: e.target.value })} />
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
      <div className="space-y-8 animate-fade-in relative z-10">
        <Section title="Pick a Slot" subtitle="Choose your preferred timing" />
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {dates.map(d => (
            <div key={d} onClick={() => updateBooking("slot", { ...booking.slot, date: d })} className={cn("shrink-0 w-24 h-28 flex flex-col items-center justify-center rounded-[2.5rem] border-2 cursor-pointer transition-all", booking.slot?.date === d ? "bg-blue-600 text-white border-blue-600 shadow-2xl scale-105" : "bg-white border-slate-100")}>
              <span className="text-[10px] font-black uppercase opacity-60">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-3xl font-black mt-1">{new Date(d).getDate()}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {slots.map(t => (
            <button key={t} onClick={() => updateBooking("slot", { ...booking.slot, time: t })} className={cn("py-6 rounded-[2rem] font-black border-2 transition-all text-xl", booking.slot?.time === t ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white border-slate-100")}>{t}</button>
          ))}
        </div>
      </div>
    );
  };

  const [providers, setProviders] = useState([]);
  const [fetchingProviders, setFetchingProviders] = useState(false);

  useEffect(() => {
    if (booking.slot?.date && booking.slot?.time && booking.service?._id) {
      setFetchingProviders(true);
      providerService.getAll({ service: booking.service._id, pincode: booking.address?.pincode })
        .then(res => {
          const list = res.data.providers || [];
          setProviders(list);
          if (list.length > 0 && !booking.provider) updateBooking("provider", list[0]);
        })
        .finally(() => setFetchingProviders(false));
    }
  }, [booking.slot, booking.service?._id, booking.address?.pincode]);

  const renderProvider = () => (
    <div className="space-y-6 animate-fade-in relative z-10">
      <Section title="Choose Your Expert" subtitle={`Top rated ${booking.service?.name}s in your area`} />
      {fetchingProviders ? (
        <div className="py-20 text-center"><p className="font-black text-slate-300 animate-pulse">Assigning Experts...</p></div>
      ) : providers.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <p className="font-bold text-slate-500 mb-6">No experts found in this pincode for this slot.</p>
          <Button onClick={() => setStep(5)} className="bg-slate-900 text-white">Change Schedule</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map(p => (
            <div key={p._id} onClick={() => updateBooking("provider", p)} className={cn("p-6 cursor-pointer flex items-center gap-6 border-2 rounded-[2.5rem] transition-all", booking.provider?._id === p._id ? "border-blue-600 bg-blue-50 shadow-2xl ring-2 ring-blue-600" : "border-slate-50 bg-white")}>
              <Avatar name={p.user.name} src={p.user.avatar} size="lg" className="ring-4 ring-white shadow-lg" />
              <div className="flex-1">
                <p className="font-black text-slate-900 text-xl">{p.user.name}</p>
                <div className="flex gap-3 items-center mt-2">
                   <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">{p.experience} Years Exp</span>
                   <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase">⭐ {p.rating.toFixed(1)}</span>
                </div>
              </div>
              <ShieldCheck className={cn("transition-colors", booking.provider?._id === p._id ? "text-blue-600" : "text-slate-200")} size={32} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isSuccess) {
    return (
      <PageWrapper maxWidth="600px">
        <Card className="text-center py-24 mt-10 rounded-[5rem] shadow-2xl border-none">
          <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner animate-bounce"><CheckCircle size={64} /></div>
          <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Booking Successful!</h2>
          <p className="text-slate-500 font-bold max-w-xs mx-auto mb-12 text-lg">Your care expert has been requested. We'll notify you once confirmed.</p>
          <Button onClick={() => navigate('/dashboard/patient/bookings')} className="!rounded-[2.5rem] !px-16 !py-6 text-2xl font-black shadow-2xl bg-blue-600 text-white">Go to Bookings</Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper maxWidth="800px">
      <Card className="overflow-hidden border-none shadow-[0_50px_120px_-20px_rgba(0,0,0,0.2)] rounded-[5rem] mt-10 bg-white">
        <div className="bg-slate-950 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            {step > 1 ? (
              <button onClick={handleBack} className="p-4 rounded-3xl bg-white/5 hover:bg-white/10 transition-all active:scale-90"><ChevronLeft size={32} /></button>
            ) : <div className="w-16" />}
            <div className="text-center">
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] mb-3 opacity-80">Phase {step} of 6</p>
              <h2 className="text-3xl font-black text-white tracking-tight">{STEPS[step - 1].label}</h2>
            </div>
            <div className="w-16" />
          </div>
          <div className="flex gap-3 justify-center relative z-10">
            {STEPS.map(s => <div key={s.id} className={cn("h-2 rounded-full transition-all duration-700", s.id === step ? "w-20 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]" : s.id < step ? "w-6 bg-emerald-500" : "w-6 bg-slate-800")} />)}
          </div>
        </div>

        <div className="p-12 md:p-20 min-h-[600px]">
          {step === 1 && renderService()}
          {step === 2 && renderPlan()}
          {step === 3 && renderPatient()}
          {step === 4 && renderAddress()}
          {step === 5 && renderSlot()}
          {step === 6 && renderProvider()}
        </div>

        <div className="p-12 bg-slate-50/50 border-t border-slate-100 flex justify-end">
           <Button 
             onClick={handleNext} 
             disabled={!isStepValid(step) || loading}
             loading={loading}
             className={cn(
               "w-full md:w-auto !px-24 !py-8 rounded-[3rem] font-black text-3xl shadow-2xl transition-all active:scale-95",
               isStepValid(step) && !loading ? "bg-blue-600 text-white shadow-blue-900/40" : "bg-slate-200 text-slate-400 cursor-not-allowed"
             )}
           >
             {step === 6 ? (loading ? "Confirming..." : "Finalize Booking") : "Proceed"} <ChevronRight size={40} className="ml-3" />
           </Button>
        </div>
      </Card>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </PageWrapper>
  );
}
