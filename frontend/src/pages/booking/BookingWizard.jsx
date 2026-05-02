import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, ShieldCheck, Zap, Navigation, User, Plus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { providerService, bookingService, pricingService } from '@/services';
import { cn } from '../../utils';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const SERVICE_IMG = {
  nurse: '/images/service-nursing.png',
  nursing: '/images/service-nursing.png',
  physiotherapist: '/images/service-physio.png',
  physiotherapy: '/images/service-physio.png',
  doctor: '/images/service-doctor.png',
  caretaker: '/images/service-eldercare.png',
  eldercare: '/images/service-eldercare.png',
};
const getServiceImg = (s) => SERVICE_IMG[(s.slug || s.name || '').toLowerCase()] || null;

const haversine = (c1, c2) => {
  const R = 6371;
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLon = (c2.lng - c1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(c1.lat*Math.PI/180)*Math.cos(c2.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const fmtDist = (km) => km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;

const STEPS = ['Service · Patient · Address', 'Plan · Schedule', 'Expert · Confirm'];

export default function BookingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Data
  const [services, setServices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [providers, setProviders] = useState([]);
  const [fetchingServices, setFetchingServices] = useState(true);
  const [fetchingPlans, setFetchingPlans] = useState(false);
  const [fetchingProviders, setFetchingProviders] = useState(false);

  // Booking state
  const [sel, setSel] = useState({
    service: null,
    plan: null,
    slot: { date: '', time: '' },
    provider: null,
  });

  // Patient — pre-fill from profile
  const [patient, setPatient] = useState({
    name: user?.name || '',
    age: '',
    gender: user?.gender || '',
    useProfile: true,
  });

  // Address — pre-fill from profile
  const [address, setAddress] = useState({
    fullAddress: user?.address || '',
    pincode: user?.pincode || '',
    coords: user?.coords ? { lat: user.coords.lat, lng: user.coords.lng } : null,
    useProfile: !!(user?.address),
  });

  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    pricingService.getServices()
      .then(r => setServices(r.data || []))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setFetchingServices(false));
  }, []);

  useEffect(() => {
    if (!sel.service?._id) return;
    setFetchingPlans(true);
    pricingService.getPlansByService(sel.service._id)
      .then(r => setPlans(r.data || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setFetchingPlans(false));
  }, [sel.service?._id]);

  useEffect(() => {
    if (step !== 2 || !sel.service?._id) return;
    setFetchingProviders(true);
    providerService.getAll({ service: sel.service._id, pincode: address.pincode })
      .then(r => {
        let list = r.data?.providers || [];
        // Re-rank using real GPS if available
        if (address.coords) {
          list = list.map(p => {
            const pCoords = p.location?.coordinates;
            let dist = p.distance ?? 99;
            if (pCoords) dist = haversine(address.coords, { lat: pCoords[1], lng: pCoords[0] });
            return { ...p, distance: parseFloat(dist.toFixed(2)) };
          });
          list.sort((a, b) => a.distance - b.distance || b.matchScore - a.matchScore);
        }
        setProviders(list);
        if (list.length && !sel.provider) setSel(s => ({ ...s, provider: list[0] }));
      })
      .catch(() => setProviders([]))
      .finally(() => setFetchingProviders(false));
  }, [step, sel.service?._id, address.pincode]);

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const d = await r.json();
          setAddress(a => ({
            ...a,
            coords: { lat, lng },
            pincode: d.address?.postcode || a.pincode,
            fullAddress: d.display_name || a.fullAddress,
          }));
          toast.success('Location captured!');
        } catch { setAddress(a => ({ ...a, coords: { lat, lng } })); }
        finally { setGeoLoading(false); }
      },
      () => { setGeoLoading(false); toast.error('Location denied'); }
    );
  };

  const isValid = () => {
    if (step === 0) return !!(sel.service && patient.name && patient.gender && address.fullAddress && address.pincode);
    if (step === 1) return !!(sel.plan && sel.slot.date && sel.slot.time);
    if (step === 2) return !!sel.provider;
    return false;
  };

  const handleNext = () => {
    if (!isValid()) return toast.error('Please complete all required fields.');
    if (step < 2) setStep(s => s + 1);
    else handleConfirm();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const [yr, mo, da] = sel.slot.date.split('-');
      const [hr, min] = sel.slot.time.split(':');
      await bookingService.create({
        providerId: sel.provider._id,
        service: sel.service._id,
        address: address.fullAddress,
        pincode: address.pincode,
        scheduledAt: new Date(yr, mo-1, da, hr, min),
        durationHours: sel.plan.durationHours || 1,
        notes: JSON.stringify({ planId: sel.plan._id, patient, flowVersion: 'v4_3step' }),
      });
      setIsSuccess(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  // ── Renderers ────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-5 animate-fade-in">
      {/* Service */}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service</p>
        {fetchingServices ? <div className="h-20 flex items-center justify-center text-slate-300 text-sm animate-pulse">Loading…</div> : (
          <div className="grid grid-cols-2 gap-2">
            {services.map(s => {
              const img = getServiceImg(s);
              const sel_ = sel.service?._id === s._id;
              return (
                <button key={s._id} onClick={() => setSel(p => ({ ...p, service: s, plan: null }))}
                  className={cn('flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.97] hover:shadow-sm',
                    sel_ ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200')}>
                  <div className={cn('w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center', sel_ ? 'bg-blue-100' : 'bg-slate-100')}>
                    {img ? <img src={img} alt={s.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : <span className="text-xl">🏥</span>}
                  </div>
                  <span className={cn('text-sm font-bold truncate', sel_ ? 'text-blue-700' : 'text-slate-800')}>{s.name}</span>
                  {sel_ && <CheckCircle size={14} className="text-blue-500 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Patient */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</p>
          {user && (
            <button onClick={() => {
              if (!patient.useProfile) {
                setPatient({ name: user.name, age: '', gender: user.gender || '', useProfile: true });
              } else {
                setPatient(p => ({ ...p, useProfile: false }));
              }
            }} className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
              {patient.useProfile ? <><Plus size={10}/> Add Different</> : <><User size={10}/> Use My Profile</>}
            </button>
          )}
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5">
          {patient.useProfile && user ? (
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <User size={16} className="text-blue-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.gender || 'Gender not set'} · Patient</p>
              </div>
              <CheckCircle size={14} className="text-blue-500 ml-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <input className="col-span-3 input-base text-sm py-2" placeholder="Patient name *" value={patient.name}
                onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} />
              <input className="input-base text-sm py-2" placeholder="Age" type="number" value={patient.age}
                onChange={e => setPatient(p => ({ ...p, age: e.target.value }))} />
              <select className="col-span-2 input-base text-sm py-2" value={patient.gender}
                onChange={e => setPatient(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Gender *</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Address */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p>
          <button onClick={detectLocation} disabled={geoLoading}
            className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
            <Navigation size={10} className={geoLoading ? 'animate-spin' : ''} />
            {geoLoading ? 'Detecting…' : 'Use GPS'}
          </button>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2">
          {address.coords && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <MapPin size={10} /> GPS captured — provider distances will be precise
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-2 input-base text-sm py-2" placeholder="Full address *" value={address.fullAddress}
              onChange={e => setAddress(a => ({ ...a, fullAddress: e.target.value }))} />
            <input className="input-base text-sm py-2" placeholder="Pincode *" maxLength={6} value={address.pincode}
              onChange={e => setAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g,'') }))} />
          </div>
        </div>
      </section>
    </div>
  );

  const renderStep1 = () => {
    const dates = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d.toISOString().split('T')[0];});
    const times = ['08:00','10:00','12:00','14:00','16:00','18:00'];
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Plans */}
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Plan</p>
          {fetchingPlans ? <div className="h-16 flex items-center justify-center text-slate-300 text-sm animate-pulse">Loading plans…</div> : plans.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-slate-400 text-sm">No plans available.</div>
          ) : (
            <div className="space-y-1.5">
              {plans.map(p => {
                const isSel = sel.plan?._id === p._id;
                return (
                  <button key={p._id} onClick={() => setSel(s => ({ ...s, plan: p }))}
                    className={cn('w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left',
                      isSel ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200')}>
                    <div>
                      <p className={cn('text-sm font-bold', isSel ? 'text-blue-700' : 'text-slate-800')}>{p.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.planType==='subscription' ? `${p.sessionsPerWeek} sessions/week` : `${p.totalSessions} total sessions`}
                        {p.durationHours ? ` · ${p.durationHours}h` : ''}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={cn('font-black text-base', isSel ? 'text-blue-600' : 'text-slate-800')}>₹{p.price}</p>
                      <p className="text-[9px] text-slate-400">starting from</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Date */}
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dates.map(d => {
              const isSel = sel.slot.date === d;
              return (
                <button key={d} onClick={() => setSel(s=>({...s,slot:{...s.slot,date:d}}))}
                  className={cn('flex-shrink-0 w-14 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all active:scale-95',
                    isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200')}>
                  <span className="text-[9px] font-black uppercase opacity-70">{new Date(d).toLocaleDateString('en-US',{weekday:'short'})}</span>
                  <span className="text-lg font-black">{new Date(d).getDate()}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time */}
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Time</p>
          <div className="grid grid-cols-3 gap-2">
            {times.map(t => {
              const isSel = sel.slot.time === t;
              return (
                <button key={t} onClick={() => setSel(s=>({...s,slot:{...s.slot,time:t}}))}
                  className={cn('py-2.5 text-sm font-bold rounded-xl border-2 transition-all active:scale-95',
                    isSel ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-200')}>
                  {t}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in">
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Choose Expert</p>
        {fetchingProviders ? (
          <div className="h-20 flex items-center justify-center text-slate-300 text-sm animate-pulse">Finding experts…</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-sm text-slate-400 font-semibold">No experts found.</p>
            <button onClick={() => setStep(1)} className="mt-2 text-xs font-bold text-blue-600">← Change Schedule</button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Smart match banner */}
            {providers.every(p => p.tier !== 'EXACT') && providers.some(p => p.tier === 'NEARBY') && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Zap size={11} className="text-amber-600 flex-shrink-0" />
                <p className="text-[10px] font-bold text-amber-800">Smart Match — Showing nearby experts for your area</p>
              </div>
            )}
            {providers.map((p, idx) => {
              const isSel = sel.provider?._id === p._id;
              // Badges
              const badges = [];
              if (idx === 0) badges.push({ label: 'Best Match', color: 'bg-blue-600' });
              const sortedByDist = [...providers].sort((a,b)=>a.distance-b.distance);
              if (p._id === sortedByDist[0]?._id) badges.push({ label: 'Nearest', color: 'bg-emerald-600' });
              if (p.isOnline) badges.push({ label: 'Available', color: 'bg-green-500' });
              const tierColor = p.tier==='EXACT' ? 'bg-emerald-500' : p.tier==='NEARBY' ? 'bg-blue-500' : 'bg-slate-400';

              return (
                <button key={p._id} onClick={() => setSel(s=>({...s,provider:p}))}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.98] relative overflow-hidden',
                    isSel ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-100 bg-white hover:border-blue-200')}>
                  {/* Tier ribbon */}
                  <span className={cn('absolute top-0 right-0 text-[8px] font-black uppercase px-2 py-0.5 text-white rounded-bl-xl', tierColor)}>
                    {p.tier}
                  </span>
                  <Avatar name={p.user?.name} src={p.user?.avatar} size="md" className="flex-shrink-0 ring-2 ring-white shadow" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={cn('text-sm font-bold truncate', isSel ? 'text-blue-700' : 'text-slate-800')}>{p.user?.name}</p>
                      {badges.map(b => (
                        <span key={b.label} className={cn('text-[8px] font-black px-1.5 py-0.5 rounded-full text-white', b.color)}>{b.label}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.experience} yrs</span>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⭐ {p.rating?.toFixed(1)||'N/A'}</span>
                      {p.distance !== undefined && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">📍 {fmtDist(p.distance)}</span>
                      )}
                    </div>
                  </div>
                  <ShieldCheck size={18} className={cn('flex-shrink-0', isSel ? 'text-blue-500' : 'text-slate-200')} />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirm summary */}
      {sel.provider && sel.plan && (
        <section className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1.5 text-xs">
          <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2">Booking Summary</p>
          {[
            ['Service', sel.service?.name],
            ['Plan', `${sel.plan?.name} — ₹${sel.plan?.price}`],
            ['Patient', patient.useProfile ? user?.name : patient.name],
            ['Date & Time', sel.slot.date && sel.slot.time ? `${sel.slot.date} at ${sel.slot.time}` : '—'],
            ['Expert', sel.provider?.user?.name],
            ['Address', address.fullAddress ? address.fullAddress.slice(0,60)+'…' : '—'],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-slate-400 font-medium">{k}</span>
              <span className="text-slate-700 font-semibold text-right">{v}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );

  // ── Success ──────────────────────────────────────────────────
  if (isSuccess) return (
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

  // ── Shell ────────────────────────────────────────────────────
  const progress = (step / 2) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-6 px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setStep(s=>Math.max(0,s-1))} disabled={step===0}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all disabled:opacity-30 active:scale-90">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <div className="text-center">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] opacity-80">Step {step+1} of 3</p>
              <h2 className="text-sm font-black text-white">{STEPS[step]}</h2>
            </div>
            <div className="w-8" />
          </div>
          {/* Progress */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className={cn('h-1 rounded-full transition-all duration-500',
                i===step ? 'w-8 bg-blue-400' : i<step ? 'w-4 bg-emerald-400' : 'w-4 bg-white/20')} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 min-h-[400px]">
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <button onClick={handleNext} disabled={!isValid()||loading}
            className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]',
              isValid()&&!loading ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
            {loading ? 'Confirming…' : step===2 ? 'Confirm Booking' : 'Continue'}
            {!loading && <ChevronRight size={15} />}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .animate-fade-in{animation:fadeIn 0.25s ease forwards}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
}
