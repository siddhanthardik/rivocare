import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, HeartPulse, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };

const TRUST_POINTS = [
  'Book verified home healthcare professionals',
  'Manage visits, updates, and payments in one place',
  'Access your care plan securely across devices',
];

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
      navigate(from || DASHBOARD[result.user.role]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_42%,_#e2e8f0_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/65 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                <HeartPulse size={16} className="text-primary-600" />
                Trusted home healthcare, thoughtfully managed
              </div>

              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-950">
                Care coordination that feels calm, clear, and dependable.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Sign in to manage bookings, stay connected with providers, and keep every care update in one secure place.
              </p>

              <div className="mt-8 space-y-3">
                {TRUST_POINTS.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur"
                  >
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/92 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur xl:p-9">
              <div className="text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-sky-100 ring-1 ring-primary-100">
                  <HeartPulse size={26} className="text-primary-600" />
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your RIVO account to continue.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="mt-8 space-y-5">
                <Input
                  label="Email"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  error={errors.email}
                  className="rounded-xl border-slate-200/90 bg-white/90"
                />

                <div className="space-y-1.5">
                  <Input
                    label="Password"
                    type="password"
                    icon={Lock}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                    error={errors.password}
                    className="rounded-xl border-slate-200/90 bg-white/90"
                  />

                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full rounded-xl shadow-lg shadow-primary-600/20">
                  Sign In
                </Button>
              </form>

              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium text-slate-800">New to RIVO?</span>{' '}
                Create your account to book care, manage visits, and stay updated in real time.
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="inline-flex items-center gap-1 font-semibold text-primary-600 transition-colors hover:text-primary-700">
                  Create one
                  <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
