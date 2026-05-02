import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, ShieldCheck, Zap, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { providerService, bookingService, pricingService } from '@/services';
import { cn } from '../../utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';

// Service image map: key → /public/images/<file>
const SERVICE_IMG = {
  nurse:            '/images/service-nursing.png',
  nursing:          '/images/service-nursing.png',
  physiotherapist:  '/images/service-physio.png',
  physiotherapy:    '/images/service-physio.png',
  doctor:           '/images/service-doctor.png',
  caretaker:        '/images/service-eldercare.png',
  eldercare:        '/images/service-eldercare.png',
};

const getServiceImg = (s) => {
  const key = (s.slug || s.name || '').toLowerCase();
  return SERVICE_IMG[key] || s.icon || null;
};

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Offering' },
  { id: 3, label: 'Patient' },
  { id: 4, label: 'Location' },
  { id: 5, label: 'Schedule' },
  { id: 6, label: 'Expert' },
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
    service: null,
    plan: null,
    patient: null,
    address: null,
    slot: null,
    provider: null,
    durationHours: 1,
    notes: '',
  });

  useEffect(() => {
    pricingService.getServices()
      .then(res => setServices(res.data || []))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setFetchingServices(false));
  }, []);

  useEffect(() => {
    if (booking.service?._id) {
      setFetchingPlans(true);
      pricingService.getPlansByService(booking.service._id)
        .then(res => setPlans(res.data || []))
        .catch(() => toast.error('Failed to load offerings'))
        .finally(() => setFetchingPlans(false));
    }
  }, [booking.service?._id]);

  const update = (key, value) => setBooking(prev => ({ ...prev, [key]: value }));

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
    if (!isStepValid(step)) { toast.error('Please complete all required fields.'); return; }
    if (step < 6) setStep(p => p + 1);
    else handleConfirm();
  };

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [year, month, day] = booking.slot.date.split('-');
      const [hours, minutes] = booking.slot.time.split(':');
      const scheduledAt = new Date(year, month - 1, day, hours, minutes);
      await bookingService.create({
        providerId: booking.provider._id,
        service: booking.service._id,
        address: booking.address.fullAddress,
        pincode: booking.address.pincode,
        scheduledAt,
        durationHours: booking.plan.durationHours || 1,
        notes: JSON.stringify({ planId: booking.plan._id, patient: booking.patient, flowVersion: 'v3_unified' }),
      });
      setIsSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Service Selection ────────────────────────────────
  const renderService = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">What care do you need?</h3>
        <p className="text-xs text-slate-400 mt-0.5">Choose a service to get started</p>
      </div>
      {fetchingServices ? (
        <div className="py-10 text-center text-sm text-slate-300 font-semibold animate-pulse">Loading services...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {services.map(s => {
            const img = getServiceImg(s);
            const isSelected = booking.service?._id === s._id;
            return (
              <button
                key={s._id}
                onClick={() => { update('service', s); update('plan', null); }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.97] hover:shadow-md group',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                    : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                )}
                style={{ minHeight: '72px' }}
              >
                {/* Icon / Image */}
                <div className={cn(
                  'w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105',
                  isSelected ? 'bg-blue-100' : 'bg-slate-100'
                )}>
                  {img && !img.startsWith('/') ? (
                    <span className="text-2xl leading-none">{img}</span>
                  ) : img ? (
                    <img src={img} alt={s.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                  ) : (
                    <span className="text-2xl">🏥</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-bold leading-tight truncate',
                    isSelected ? 'text-blue-700' : 'text-slate-800'
                  )}>
                    {s.name}
                  </p>
                  {s.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.description}</p>
                  )}
                </div>

                {/* Check */}
                {isSelected && <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Step 2: Plan / Offering ──────────────────────────────────
  const renderPlan = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">Choose a plan</h3>
        <p className="text-xs text-slate-400 mt-0.5">{booking.service?.name} offerings</p>
      </div>
      {fetchingPlans ? (
        <div className="py-10 text-center text-sm text-slate-300 font-semibold animate-pulse">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm font-semibold">No plans available for this service yet.</div>
      ) : (
        <div className="space-y-2">
          {plans.map(p => {
            const isSelected = booking.plan?._id === p._id;
            return (
              <button
                key={p._id}
                onClick={() => update('plan', p)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] hover:shadow-sm',
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'
                )}
              >
                <div>
                  <p className={cn('font-bold text-sm', isSelected ? 'text-blue-700' : 'text-slate-800')}>{p.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {p.planType === 'subscription' ? `${p.sessionsPerWeek} sessions/week` : `${p.totalSessions} total sessions`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={cn('font-black text-lg', isSelected ? 'text-blue-600' : 'text-slate-800')}>₹{p.price}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">starting from</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Step 3: Patient ──────────────────────────────────────────
  const renderPatient = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">Patient details</h3>
        <p className="text-xs text-slate-400 mt-0.5">Who is receiving care?</p>
      </div>
      <div className="space-y-3 bg-white rounded-2xl border border-slate-100 p-4">
        <Input label="Patient Name" value={booking.patient?.name || ''} onChange={e => update('patient', { ...booking.patient, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Age" type="number" value={booking.patient?.age || ''} onChange={e => update('patient', { ...booking.patient, age: e.target.value })} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
            <select className="input-base text-sm" value={booking.patient?.gender || ''} onChange={e => update('patient', { ...booking.patient, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Address ──────────────────────────────────────────
  const renderAddress = () => (
    <div className="space-y-3 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">Service address</h3>
        <p className="text-xs text-slate-400 mt-0.5">Where should we send the expert?</p>
      </div>
      <div className="space-y-3 bg-white rounded-2xl border border-slate-100 p-4">
        <Input label="Pincode" maxLength="6" value={booking.address?.pincode || ''} onChange={e => update('address', { ...booking.address, pincode: e.target.value.replace(/\D/g, '') })} />
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Address</label>
          <textarea
            className="input-base text-sm min-h-[96px] resize-none"
            placeholder="Street, House No, Landmark..."
            value={booking.address?.fullAddress || ''}
            onChange={e => update('address', { ...booking.address, fullAddress: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // ── Step 5: Schedule ─────────────────────────────────────────
  const renderSlot = () => {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0];
    });
    const slots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="mb-2">
          <h3 className="text-base font-bold text-slate-800">Pick a slot</h3>
          <p className="text-xs text-slate-400 mt-0.5">Choose your preferred day and time</p>
        </div>
        {/* Date row */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map(d => {
            const isSelected = booking.slot?.date === d;
            return (
              <button
                key={d}
                onClick={() => update('slot', { ...booking.slot, date: d })}
                className={cn(
                  'flex-shrink-0 w-[60px] flex flex-col items-center py-3 rounded-2xl border-2 text-center transition-all active:scale-95',
                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200'
                )}
              >
                <span className="text-[9px] font-black uppercase opacity-70">{new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-xl font-black leading-tight">{new Date(d).getDate()}</span>
              </button>
            );
          })}
        </div>
        {/* Time grid */}
        <div className="grid grid-cols-3 gap-2">
          {slots.map(t => {
            const isSelected = booking.slot?.time === t;
            return (
              <button
                key={t}
                onClick={() => update('slot', { ...booking.slot, time: t })}
                className={cn(
                  'py-3 text-sm font-bold rounded-2xl border-2 transition-all active:scale-95',
                  isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200'
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Step 6: Provider ─────────────────────────────────────────
  const [providers, setProviders] = useState([]);
  const [fetchingProviders, setFetchingProviders] = useState(false);

  useEffect(() => {
    if (booking.slot?.date && booking.slot?.time && booking.service?._id) {
      setFetchingProviders(true);
      providerService.getAll({ service: booking.service._id, pincode: booking.address?.pincode })
        .then(res => {
          const list = res.data.providers || [];
          setProviders(list);
          if (list.length > 0 && !booking.provider) update('provider', list[0]);
        })
        .catch(() => setProviders([]))
        .finally(() => setFetchingProviders(false));
    }
  }, [booking.slot, booking.service?._id, booking.address?.pincode]);

  const renderProvider = () => {
    const totalExact = providers.filter(p => p.tier === 'EXACT').length;
    const totalNearby = providers.filter(p => p.tier === 'NEARBY').length;

    return (
      <div className="space-y-3 animate-fade-in">
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-800">Choose your expert</h3>
          <p className="text-xs text-slate-400 mt-0.5">Top-rated {booking.service?.name}s near you</p>
        </div>

        {fetchingProviders ? (
          <div className="py-10 text-center text-sm text-slate-300 font-semibold animate-pulse">Finding experts...</div>
        ) : providers.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="font-semibold text-slate-500 text-sm mb-4">No experts found in this area.</p>
            <Button onClick={() => setStep(5)} size="sm" variant="outline">Change Schedule</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {totalExact === 0 && totalNearby > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-1">
                <Zap size={12} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-amber-800">
                  Smart Match — Showing nearby experts for pincode {booking.address?.pincode}
                </p>
              </div>
            )}
            {providers.map(p => {
              const isSelected = booking.provider?._id === p._id;
              const tierColor = p.tier === 'EXACT' ? 'bg-emerald-500' : p.tier === 'NEARBY' ? 'bg-blue-500' : 'bg-slate-400';
              return (
                <button
                  key={p._id}
                  onClick={() => update('provider', p)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] relative overflow-hidden group hover:shadow-sm',
                    isSelected ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'
                  )}
                  style={{ minHeight: '72px' }}
                >
                  {/* Tier badge */}
                  <span className={cn('absolute top-0 right-0 text-[8px] font-black uppercase px-2 py-0.5 text-white rounded-bl-xl tracking-wider', tierColor)}>
                    {p.tier}
                  </span>

                  <Avatar name={p.user?.name} src={p.user?.avatar} size="md" className="flex-shrink-0 ring-2 ring-white shadow" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={cn('text-sm font-bold truncate', isSelected ? 'text-blue-700' : 'text-slate-800')}>{p.user?.name}</p>
                      {p.tier === 'EXACT' && <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.experience} yrs</span>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⭐ {p.rating?.toFixed(1) || 'N/A'}</span>
                      {p.distance !== undefined && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">📍 {p.distance} km</span>
                      )}
                    </div>
                  </div>

                  <ShieldCheck size={20} className={cn('flex-shrink-0 transition-colors', isSelected ? 'text-blue-500' : 'text-slate-200 group-hover:text-slate-300')} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Success ──────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-slate-500 mb-8">Your care expert has been requested. We'll notify you once confirmed.</p>
          <Button onClick={() => navigate('/dashboard/patient/bookings')} className="w-full bg-blue-600 text-white rounded-2xl">
            Go to Bookings
          </Button>
        </div>
      </div>
    );
  }

  // ── Main Wizard Shell ────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-6 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setStep(p => Math.max(1, p - 1))}
              disabled={step === 1}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-90 disabled:opacity-30"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>

            <div className="text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] opacity-80">Step {step} of {STEPS.length}</p>
              <h2 className="text-lg font-black text-white tracking-tight">{STEPS[step - 1].label}</h2>
            </div>

            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Slim progress bar */}
          <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-3">
            {STEPS.map(s => (
              <div
                key={s.id}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  s.id === step ? 'w-8 bg-blue-400' : s.id < step ? 'w-4 bg-emerald-400' : 'w-4 bg-white/20'
                )}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 min-h-[420px]">
          {step === 1 && renderService()}
          {step === 2 && renderPlan()}
          {step === 3 && renderPatient()}
          {step === 4 && renderAddress()}
          {step === 5 && renderSlot()}
          {step === 6 && renderProvider()}
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
          <button
            onClick={handleNext}
            disabled={!isStepValid(step) || loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]',
              isStepValid(step) && !loading
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {loading ? 'Confirming...' : step === 6 ? 'Finalize Booking' : 'Continue'}
            {!loading && <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  );
}
