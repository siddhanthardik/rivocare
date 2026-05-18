import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin', partner: '/dashboard/partner/lab' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.email) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(form);
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      navigate(from || DASHBOARD[result.user.role] || '/dashboard/patient');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* LEFT BRAND PANEL — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 flex-col justify-between p-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10" />

        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              India's Premium<br />Home Care Network
            </h1>
            <p className="text-white/70 text-lg font-medium leading-relaxed max-w-sm">
              Expert care, diagnostics and wellness — delivered to your doorstep.
            </p>
          </div>

        </div>

        <div className="relative z-10">
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 font-medium">Sign in to your account to continue.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              error={errors.email}
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                error={errors.password}
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-[11px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Sign In <ArrowRight size={18} />
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">New to Rivo?</p>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-slate-200 text-sm font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Create an Account <ArrowRight size={16} />
            </Link>
          </div>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            By signing in you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary-600 hover:underline font-bold">Terms</Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-primary-600 hover:underline font-bold">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
