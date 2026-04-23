import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { cn } from '../../utils';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };
const ROLES = [
  { value: 'patient', label: '🩺 I need care', desc: 'Book healthcare services' },
  { value: 'provider', label: '👨‍⚕️ I provide care', desc: 'Offer your services' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'patient', acceptedTerms: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [key]: value }));
  };
  
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.phone) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.acceptedTerms) e.acceptedTerms = 'You must accept the terms and conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to RIVO 🎉');
      navigate(DASHBOARD[user.role]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-app-bg">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-card-hover animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-2xl mb-4">
              <HeartPulse size={24} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Start your healthcare journey with RIVO</p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map((r) => (
              <button key={r.value} type="button"
                onClick={() => setForm(f => ({ ...f, role: r.value }))}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all duration-150',
                  form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
                )}>
                <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" icon={User} placeholder="Rahul Mehta"
              value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Email" type="email" icon={Mail} placeholder="you@example.com"
              value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Phone" type="tel" icon={Phone} placeholder="9XXXXXXXXX"
              value={form.phone} onChange={set('phone')} error={errors.phone} hint="10-digit Indian mobile" />
            <Input label="Password" type="password" icon={Lock} placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')} error={errors.password} />

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={form.acceptedTerms}
                    onChange={set('acceptedTerms')}
                    className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                </div>
                <div className="text-sm">
                  <span className="text-slate-600">
                    I agree to RIVO's{' '}
                    <Link to="/terms-of-service" target="_blank" className="text-primary-600 font-semibold hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary-600 font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </div>
              </label>
              {errors.acceptedTerms && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.acceptedTerms}</p>
              )}
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-4">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
