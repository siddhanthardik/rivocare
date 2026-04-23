import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Search, MapPin, Calendar as CalIcon, Clock, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { providerService, bookingService } from '../../services';
import { SERVICE_CONFIG, formatCurrency, formatDate } from '../../utils';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import StarRating from '../../components/ui/StarRating';
import WizardProgress from '../../components/ui/WizardProgress';
import WhatsAppButton from '../../components/ui/WhatsAppButton';

const STEPS = [
  'Select Service',
  'Location',
  'Choose Provider',
  'Schedule',
  'Confirm',
];

export default function BookingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Booking State
  const [service, setService] = useState(null);
  const [address, setAddress] = useState(user?.address || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [areaMsg, setAreaMsg] = useState('');

  // Derived state
  const isServiceValid = !!service;
  const isLocationValid = address.length > 5 && /^\d{6}$/.test(pincode) && pincodeStatus === 'valid';
  const isProviderValid = !!selectedProvider;
  const isScheduleValid = !!date && !!time;

  useEffect(() => {
    if (pincode?.length === 6) {
      setCheckingPincode(true);
      setPincodeStatus(null);
      bookingService.checkPincode(pincode)
        .then(res => {
          if (res.data.isServiceable) {
            setPincodeStatus('valid');
            const data = res.data.data;
            setAreaMsg(`Available in ${data.areaName ? data.areaName + ', ' : ''}${data.city} ✅`);
            
            // Auto suggest city if address doesn't have it
            setAddress(prev => {
              if (prev && prev.includes(data.city)) return prev;
              return prev ? `${prev}, ${data.city}, ${data.state}` : `${data.city}, ${data.state}`;
            });
          } else {
            setPincodeStatus('invalid');
            setAreaMsg('We are not available in your area yet');
          }
        })
        .catch(() => {
           setPincodeStatus('invalid');
           setAreaMsg('We are not available in your area yet');
        })
        .finally(() => setCheckingPincode(false));
    } else {
      setPincodeStatus(null);
      setAreaMsg('');
    }
  }, [pincode]);

  // Fetch providers when Step 2 completes
  useEffect(() => {
    if (step === 2) {
      setLoading(true);
      providerService.getAll({ service, pincode })
        .then((res) => setProviders(res.data.data.providers))
        .catch(() => toast.error('Failed to find providers'))
        .finally(() => setLoading(false));
    }
  }, [step, service, pincode]);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Create scheduledAt Date object
      const [year, month, day] = date.split('-');
      const [hours, minutes] = time.split(':');
      const scheduledAt = new Date(year, month - 1, day, hours, minutes);

      const payload = {
        providerId: selectedProvider._id,
        service,
        address,
        pincode,
        scheduledAt,
        durationHours: duration,
        notes,
      };

      const res = await bookingService.create(payload);
      setBookingResult(res.data.data.booking);
      setStep(5); // Success step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 0: Service ──────────────────────────────────────────────
  const renderServiceSelection = () => (
    <div className="space-y-6 animate-fade-in relative">
      <h2 className="text-xl font-bold text-slate-800">What service do you need?</h2>

      {/* Trust Badges */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
        <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Trusted by 100+ families</span>
        <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-500" /> Verified professionals</span>
        <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-500 fill-amber-500" /> ⭐ 4.8 Rating</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(SERVICE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => { setService(key); handleNext(); }}
            className={`p-5 rounded-xl border-2 text-left transition-all group ${service === key ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">{config.icon}</div>
              {service === key && <CheckCircle size={20} className="text-primary-600 animate-fade-in" />}
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{config.label}</h3>
            <p className="text-xs text-slate-500">
              {key === 'nurse' ? 'Skilled nursing & medical care' : key === 'physiotherapist' ? 'Mobility & physical rehab' : key === 'doctor' ? 'Clinical consultation' : 'Daily living assistance'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Step 1: Location ─────────────────────────────────────────────
  const renderLocation = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Where do you need the service?</h2>
      <div className="space-y-4 max-w-md">
        <Input
          label="Pincode"
          icon={MapPin}
          placeholder="e.g. 400001"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          hint={checkingPincode ? "Checking availability..." : areaMsg || "Must be exactly 6 digits"}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Full Address</label>
          <textarea
            className="input-base min-h-[100px] resize-none"
            placeholder="House no, Building, Street area..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <Button onClick={handleNext} disabled={!isLocationValid} className="hidden md:flex w-full">
          Find Providers <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );

  // ─── Step 2: Providers ────────────────────────────────────────────
  const renderProviders = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Available Providers</h2>
      <p className="text-sm text-slate-500 -mt-4">Showing verified professionals for {pincode}</p>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="animate-spin text-primary-600">⌛</div></div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-600 mb-4">No providers available in this area right now.</p>
          <Button variant="outline" onClick={handleBack}>Change Location</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p._id}
              onClick={() => { setSelectedProvider(p); handleNext(); }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedProvider?._id === p._id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={p.user.name} src={p.user.avatar} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{p.user.name}</h3>
                    {p.isVerified && <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" title="Verified Provider" />}
                    {p.rating >= 4.8 && p.totalRatings >= 3 && (
                      <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                        <Star size={9} className="fill-amber-500 text-amber-500" /> Top Rated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={Math.round(p.rating)} size="sm" />
                    <span className="text-xs text-slate-500">{p.rating.toFixed(1)} ({p.totalRatings})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>{p.experience} yrs exp</span>
                    <span>•</span>
                    <span className="text-primary-600 font-semibold">{formatCurrency(p.pricePerHour)} / hr</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Step 3: Schedule ─────────────────────────────────────────────
  const renderSchedule = () => {
    // Generates next 14 days
    const dates = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    // 9 AM to 6 PM slots
    const slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <h2 className="text-xl font-bold text-slate-800">Select Date & Time</h2>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Available Dates</label>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {dates.map((d) => {
              const dateObj = new Date(d);
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = dateObj.getDate();
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`flex shrink-0 flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-colors ${date === d ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <span className="text-xs font-medium uppercase">{dayName}</span>
                  <span className="text-xl font-bold">{dayNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Time Slots</label>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {slots.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`py-2 rounded-lg text-sm border-2 transition-colors ${time === t ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Duration (Hours)</label>
          <div className="flex items-center gap-4">
            <input type="range" min="1" max="8" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full md:w-1/2" />
            <span className="font-semibold text-primary-700">{duration} Hour{duration > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={handleNext} disabled={!isScheduleValid} className="hidden md:flex w-full md:w-auto">
            Review Booking <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  // ─── Step 4: Confirm ──────────────────────────────────────────────
  const renderConfirm = () => {
    if (!selectedProvider) return null;
    const total = selectedProvider.pricePerHour * duration;

    return (
      <div className="space-y-6 animate-fade-in max-w-xl">
        <h2 className="text-xl font-bold text-slate-800">Confirm Booking</h2>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <p className="text-sm text-slate-500">Service</p>
              <p className="font-semibold text-slate-800 flex items-center gap-2">
                {SERVICE_CONFIG[service].icon} {SERVICE_CONFIG[service].label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Provider</p>
              <p className="font-semibold text-slate-800">{selectedProvider.user.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><CalIcon size={14} /> Date</p>
              <p className="font-medium text-slate-800">{formatDate(date)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><Clock size={14} /> Time</p>
              <p className="font-medium text-slate-800">{time} ({duration} hr{duration>1?'s':''})</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><MapPin size={14} /> Location</p>
              <p className="font-medium text-slate-800 text-sm">{address}, {pincode}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Patient Notes (Optional)</label>
          <textarea
            className="input-base"
            placeholder="Any specific instructions for the provider..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
          <span className="font-medium text-primary-800">Total Amount</span>
          <span className="text-2xl font-bold text-primary-700">{formatCurrency(total)}</span>
        </div>

        <Button onClick={handleConfirm} loading={loading} size="lg" className="hidden md:flex w-full">
          Confirm Booking
        </Button>
      </div>
    );
  };

  // ─── Step 5: Success ──────────────────────────────────────────────
  const renderSuccess = () => (
    <div className="text-center py-8 animate-slide-up max-w-md mx-auto">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Requested!</h2>
      <p className="text-slate-500 mb-8">
        Your request has been sent to {selectedProvider?.user.name}. View booking details in your dashboard.
      </p>

      <div className="space-y-3">
        <Button onClick={() => navigate('/dashboard/patient/bookings')} className="w-full">
          View My Bookings
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard/patient')} className="w-full">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Conversion Banner */}
      {step < 5 && (
        <div className="mb-6 flex justify-center animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
            <span className="animate-pulse">⚡</span> Average booking takes less than 60 seconds
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="page-title">Book a Service</h1>
        <p className="text-slate-500 mt-1">Request home healthcare in a few simple steps.</p>
      </div>

      <div className="card p-6 md:p-8 relative">
        {step < 5 && (
          <div className="flex items-start gap-4 mb-10">
            {step > 0 && (
              <button onClick={handleBack} className="p-2 -ml-2 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 mt-3 md:mt-2 hidden md:block">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex-1 overflow-hidden pt-2">
              <WizardProgress steps={STEPS} current={step} />
            </div>
          </div>
        )}

        {step === 0 && renderServiceSelection()}
        {step === 1 && renderLocation()}
        {step === 2 && renderProviders()}
        {step === 3 && renderSchedule()}
        {step === 4 && renderConfirm()}
        {step === 5 && renderSuccess()}

        {/* Sticky Mobile Footer for Next Button (if not step 0, 2, 5 and not loading) */}
        {step > 0 && step < 5 && step !== 2 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-10 animate-slide-up shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-12 shrink-0 px-0 flex justify-center"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              onClick={step === 4 ? handleConfirm : handleNext}
              disabled={(step === 1 && !isLocationValid) || (step === 3 && !isScheduleValid) || loading}
              loading={step === 4 && loading}
              className="flex-1 h-12 text-base"
            >
              {step === 4 ? 'Confirm Booking' : 'Next Step'} <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        )}
      </div>

      <WhatsAppButton message="Hi RIVO, I need help with booking a service." />
    </div>
  );
}
