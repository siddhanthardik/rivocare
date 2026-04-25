import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };
const ROLES = [
  { value: 'patient', label: 'I need care', desc: 'Book trusted support at home' },
  { value: 'provider', label: 'I provide care', desc: 'Offer services & grow your practice' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract referral code from URL if present
  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get('ref') || '';

  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    role: 'patient', 
    acceptedTerms: false,
    ref: referralCode
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
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.phone) e.phone = 'Phone is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!form.acceptedTerms) e.acceptedTerms = 'You must accept the terms';
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
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/images/logo.png" alt="Rivo Care" className="h-10 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins,sans-serif' }}>Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of families getting quality care at home.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm((c) => ({ ...c, role: r.value }))}
                className={`rounded-xl border p-3 text-left transition-all ${
                  form.role === r.value
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <p className={`font-semibold text-sm ${form.role === r.value ? 'text-blue-700' : 'text-slate-800'}`}>{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" icon={User} placeholder="Your full name" value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Email Address" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Phone Number" type="tel" icon={Phone} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} />
            <Input label="Password" type="password" icon={Lock} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} />

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={set('acceptedTerms')}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to Rivo's{' '}
                <Link to="/terms-of-service" className="text-blue-600 hover:underline font-medium">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>.
              </span>
            </label>
            {errors.acceptedTerms && <p className="text-xs text-red-500">{errors.acceptedTerms}</p>}

            <Button type="submit" loading={loading} size="lg" className="w-full rounded-xl mt-2">
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Sign in <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
