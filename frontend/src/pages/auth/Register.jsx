import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Phone, User, HeartPulse, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };
const ROLES = [
  { value: 'patient', label: 'I need care', desc: 'Book trusted support at home', icon: HeartPulse, color: 'border-primary-500 bg-primary-50 text-primary-700' },
  { value: 'provider', label: 'I provide care', desc: 'Offer services & grow', icon: ShieldCheck, color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get('ref') || '';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'patient', acceptedTerms: false, ref: referralCode
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((c) => ({ ...c, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.phone) e.phone = 'Phone is required';
    if (!form.password || form.password.length < 8) e.password = 'At least 8 characters required';
    if (!form.acceptedTerms) e.acceptedTerms = 'You must accept the terms to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await register(form);
      toast.success(`Welcome to Rivo, ${result.user.name.split(' ')[0]}!`);
      navigate(DASHBOARD[result.user.role]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* LEFT BRAND PANEL — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-navy-900 via-slate-800 to-slate-700 flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <Link to="/"><img src="/images/logo.png" alt="Rivo Care" className="h-10 brightness-0 invert" /></Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-white/80 uppercase tracking-widest">Join Our Network</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Start Your<br />Healthcare Journey
            </h1>
            <p className="text-white/70 text-lg font-medium leading-relaxed max-w-sm">
              Whether you need care or provide it — Rivo connects the right people at the right time.
            </p>
          </div>

          {/* Role benefit highlights */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-5 space-y-2">
              <p className="text-xs font-black text-white/60 uppercase tracking-widest">For Patients</p>
              <p className="text-white font-bold text-sm">Book home care, diagnostics & wellness services in minutes.</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-3xl p-5 space-y-2">
              <p className="text-xs font-black text-white/60 uppercase tracking-widest">For Providers</p>
              <p className="text-white font-bold text-sm">Manage your schedule, grow your patient base & earn more.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-xs font-medium">© 2025 Rivo Care Technologies Pvt. Ltd.</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-16 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/"><img src="/images/logo.png" alt="Rivo Care" className="h-9 mx-auto" /></Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-slate-500 font-medium">Join thousands of families getting quality care.</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = form.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((c) => ({ ...c, role: r.value }))}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    isActive ? r.color : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon size={20} className={`mb-2 ${isActive ? '' : 'text-slate-400'}`} />
                  <p className={`font-black text-sm ${isActive ? '' : 'text-slate-800'}`}>{r.label}</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${isActive ? 'opacity-70' : 'text-slate-400'}`}>{r.desc}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" icon={User} placeholder="Your full name" value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Email Address" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Phone Number" type="tel" icon={Phone} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} />
            <Input label="Password" type="password" icon={Lock} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} />

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={set('acceptedTerms')}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.acceptedTerms ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white group-hover:border-primary-400'}`}>
                  {form.acceptedTerms && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
              <span className="text-xs text-slate-600 leading-relaxed font-medium">
                I agree to Rivo's{' '}
                <Link to="/terms-of-service" className="text-primary-600 hover:underline font-black">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-primary-600 hover:underline font-black">Privacy Policy</Link>.
              </span>
            </label>
            {errors.acceptedTerms && <p className="text-xs text-red-500 font-bold -mt-2">{errors.acceptedTerms}</p>}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Create Account <ArrowRight size={18} />
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-black text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                Sign in <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
