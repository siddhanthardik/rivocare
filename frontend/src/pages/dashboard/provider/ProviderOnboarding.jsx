import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, MapPin, CheckCircle, ShieldCheck, Upload,
  Briefcase, IndianRupee, Clock, FileText, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { providerService, kycService } from '../../../services';
import { SERVICE_CONFIG } from '../../../utils';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import WizardProgress from '../../../components/ui/WizardProgress';
import WhatsAppButton from '../../../components/ui/WhatsAppButton';

const STEPS = ['Basic Info', 'Availability', 'KYC & Docs', 'Review'];

export default function ProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [init, setInit] = useState(false);

  // Form State
  const [form, setForm] = useState({
    services: [],
    bio: '',
    experience: 0,
    pricePerHour: 300,
    isOnline: true,
    pincodesServed: '',
    registrationNumber: '',
    councilType: 'NURSING',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: user?.name || '',
  });

  const [files, setFiles] = useState({
    govtId: null,
    degree: null,
    cheque: null,
  });

  // Restore Draft
  useEffect(() => {
    if (!init) {
      const draft = localStorage.getItem('rivo_onboarding_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setForm((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          // ignore
        }
      }
      setInit(true);
    }
  }, [init]);

  // Save Draft (excluding files)
  useEffect(() => {
    if (init) {
      localStorage.setItem('rivo_onboarding_draft', JSON.stringify(form));
    }
  }, [form, init]);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleToggleService = (key) => {
    setForm((f) => {
      const exists = f.services.includes(key);
      return { ...f, services: exists ? f.services.filter(s => s !== key) : [...f.services, key] };
    });
  };

  const calculateCompletion = () => {
    let score = 0;
    if (form.services.length > 0) score += 20;
    if (form.bio) score += 10;
    if (form.pincodesServed) score += 20;
    if (files.govtId && files.degree && files.cheque) score += 30;
    if (form.accountNumber && form.ifscCode) score += 20;
    return score;
  };

  const handleSubmit = async () => {
    if (!files.govtId || !files.degree || !files.cheque) {
      toast.error('Please upload all required documents.');
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      // 1. Update Profile & Availability
      const pincodesArray = form.pincodesServed.split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p));
      await providerService.updateProfile({
        services: form.services,
        bio: form.bio,
        experience: Number(form.experience),
        pricePerHour: Number(form.pricePerHour),
        pincodesServed: pincodesArray,
        isOnline: form.isOnline,
      });

      // 2. Submit KYC
      const formData = new FormData();
      formData.append('registrationNumber', form.registrationNumber);
      formData.append('councilType', form.councilType);
      formData.append('accountNumber', form.accountNumber);
      formData.append('ifscCode', form.ifscCode);
      formData.append('accountHolderName', form.accountHolderName);
      formData.append('govtId', files.govtId);
      formData.append('degree', files.degree);
      formData.append('cheque', files.cheque);

      await kycService.submitKYC(formData);

      toast.success('Onboarding complete! Your profile is pending verification.');
      localStorage.removeItem('rivo_onboarding_draft');
      navigate('/dashboard/provider');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const isBasicValid = form.services.length > 0 && form.experience >= 0 && form.pricePerHour > 0;
  const isAvailabilityValid = form.pincodesServed.trim().length > 5;
  const isKycValid = form.registrationNumber && form.accountNumber && form.ifscCode;

  // ─── Step Content ──────────────────────────────────────────────────────────

  const renderBasicInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Professional Profile</h2>
      <p className="text-sm text-slate-500 -mt-4 mb-6">What services do you provide to patients?</p>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">Services Provided (Select multiple)</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SERVICE_CONFIG).map(([key, config]) => {
            const selected = form.services.includes(key);
            return (
              <button
                key={key}
                onClick={() => handleToggleService(key)}
                className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-100' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="text-2xl">{config.icon}</span>
                <span className={`font-medium ${selected ? 'text-primary-800' : 'text-slate-700'}`}>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Hourly Rate (₹)" type="number" icon={IndianRupee} value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} min={100} />
        <Input label="Experience (Years)" type="number" icon={Briefcase} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} min={0} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Short Bio</label>
        <textarea
          className="input-base min-h-[100px]"
          placeholder="I am a certified nurse with 5 years of experience in post-operative care..."
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
        <p className="text-xs text-slate-500 text-right">{form.bio.length} chars</p>
      </div>

      <Button onClick={handleNext} disabled={!isBasicValid} className="w-full">Continue to Availability</Button>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Work Preferences</h2>
      <p className="text-sm text-slate-500 -mt-4 mb-6">Set where and how you want to work.</p>

      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-emerald-800 flex items-center gap-1.5"><Activity size={16} /> Online Status</h3>
          <p className="text-sm text-emerald-700 mt-0.5">Start accepting booking requests immediately after approval.</p>
        </div>
        <button
          onClick={() => setForm({ ...form, isOnline: !form.isOnline })}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors mt-1 ${form.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><MapPin size={16} /> Service Area (Pincodes)</label>
        <textarea
          className="input-base"
          placeholder="e.g. 400001, 400005, 400012"
          value={form.pincodesServed}
          onChange={(e) => setForm({ ...form, pincodesServed: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg inline-block">💡 Hint: Separate multiple 6-digit pincodes with commas to define your travel radius.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBack} className="w-12 px-0 flex justify-center shrink-0"><ChevronLeft size={20} /></Button>
        <Button onClick={handleNext} disabled={!isAvailabilityValid} className="flex-1">Continue to KYC</Button>
      </div>
    </div>
  );

  const renderKyc = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800">Verification & Payouts</h2>
      <p className="text-sm text-slate-500 -mt-4 mb-6">Securely upload documents to activate your account.</p>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2"><FileText size={18} /> Credentials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Registration Number" required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 block">Council Type</label>
            <select className="input-base" value={form.councilType} onChange={(e) => setForm({ ...form, councilType: e.target.value })}>
              <option value="NURSING">Nursing Council</option>
              <option value="MEDICAL">Medical Council</option>
              <option value="OTHER">Other Body</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <label className="text-sm font-medium text-slate-700 block mb-2">Govt ID (Aadhaar/PAN)</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'govtId')} className="text-xs" />
          </div>
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <label className="text-sm font-medium text-slate-700 block mb-2">Degree / Certificate</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'degree')} className="text-xs" />
          </div>
        </div>

        <h3 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2 mt-6 pt-4"><IndianRupee size={18} /> Bank Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Account Holder" required value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} />
          <Input label="IFSC Code" className="uppercase" required value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
          <div className="sm:col-span-2">
            <Input label="Account Number" type="password" required value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
          </div>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
          <label className="text-sm font-medium text-slate-700 block mb-2">Cancelled Cheque</label>
          <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 'cheque')} className="text-xs" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={handleBack} className="w-12 px-0 flex justify-center shrink-0"><ChevronLeft size={20} /></Button>
        <Button onClick={handleNext} disabled={!isKycValid} className="flex-1">Review Details</Button>
      </div>
    </div>
  );

  const renderReview = () => {
    const compScore = calculateCompletion();
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center pb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-3 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">You're almost there!</h2>
          <p className="text-slate-500">Review your profile before submitting to our admins.</p>
        </div>

        <div className="card p-5 bg-slate-50 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-bl-full opacity-50 pointer-events-none" />
          <h3 className="font-bold flex items-center justify-between text-slate-800">
            <span>Profile Quality</span>
            <span className={`text-lg ${compScore === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{compScore}%</span>
          </h3>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${compScore === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${compScore}%` }} />
          </div>
          <ul className="text-xs text-slate-500 space-y-1">
            <li className="flex items-center gap-1.5"><CheckCircle size={12} className={form.services.length ? 'text-emerald-500' : 'text-slate-300'} /> Added services</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={12} className={form.pincodesServed ? 'text-emerald-500' : 'text-slate-300'} /> Added service area</li>
            <li className="flex items-center gap-1.5"><CheckCircle size={12} className={files.govtId ? 'text-emerald-500' : 'text-slate-300'} /> Attached all documents</li>
          </ul>
        </div>

        <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full shadow-lg shadow-primary-200">
          Submit for Verification
        </Button>
        <Button variant="ghost" onClick={handleBack} className="w-full">Go Back</Button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="page-title">Provider Setup</h1>
        <p className="text-slate-500 mt-1">Complete your profile to start receiving bookings.</p>
      </div>

      <div className="card p-6 md:p-8">
        <div className="mb-10">
          <WizardProgress steps={STEPS} current={step} />
        </div>

        {step === 0 && renderBasicInfo()}
        {step === 1 && renderAvailability()}
        {step === 2 && renderKyc()}
        {step === 3 && renderReview()}
      </div>

      <WhatsAppButton message="Hi RIVO, I need help deciding on my onboarding options." />
    </div>
  );
}
