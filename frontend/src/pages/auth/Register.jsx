import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, HeartPulse, Lock, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { cn } from '../../utils';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };
const ROLES = [
  { value: 'patient', label: 'I need care', desc: 'Book trusted support at home' },
  { value: 'provider', label: 'I provide care', desc: 'Offer services and grow your practice' },
];

const BENEFITS = [
  'Faster booking and care coordination',
  'Clear service updates and communication',
  'Secure account access for every visit',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'patient', acceptedTerms: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.email) nextErrors.email = 'Email is required';
    if (!form.phone) nextErrors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) nextErrors.phone = 'Enter a valid 10-digit mobile number';
    if (!form.password) nextErrors.password = 'Password is required';
    else if (form.password.length < 6) nextErrors.password = 'Minimum 6 characters';
    if (!form.acceptedTerms) nextErrors.acceptedTerms = 'You must accept the terms and conditions';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created! Welcome to RIVO.');
      navigate(DASHBOARD[user.role]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_30%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_38%,_#e2e8f0_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/65 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                <HeartPulse size={16} className="text-primary-600" />
                Join a care platform built for trust and clarity
              </div>

              <h1 className="mt-6 text-5xl font-bold tracking-tight text-slate-950">
                Create an account that feels ready for real-world care.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                Whether you are booking care or offering services, RIVO gives you a simple, secure place to manage the full experience.
              </p>

              <div className="mt-8 rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Why teams choose RIVO</p>
                <div className="mt-5 space-y-4">
                  {BENEFITS.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="mx-auto w-full max-w-lg rounded-[28px] border border-white/70 bg-white/92 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur xl:p-9">
              <div className="text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-sky-100 ring-1 ring-primary-100">
                  <HeartPulse size={26} className="text-primary-600" />
                </div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">Set up your profile to book or provide care with confidence.</p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, role: role.value }))}
                    className={cn(
                      'rounded-2xl border px-4 py-4 text-left transition-all duration-150',
                      form.role === role.value
                        ? 'border-primary-500 bg-primary-50 shadow-sm shadow-primary-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{role.desc}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input
                  label="Full Name"
                  icon={User}
                  placeholder="Rahul Mehta"
                  value={form.name}
                  onChange={set('name')}
                  error={errors.name}
                  className="rounded-xl border-slate-200/90 bg-white/90"
                />

                <Input
                  label="Email"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  className="rounded-xl border-slate-200/90 bg-white/90"
                />

                <Input
                  label="Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="9XXXXXXXXX"
                  value={form.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  hint="10-digit Indian mobile number"
                  className="rounded-xl border-slate-200/90 bg-white/90"
                />

                <Input
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  className="rounded-xl border-slate-200/90 bg-white/90"
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptedTerms}
                      onChange={set('acceptedTerms')}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm leading-6 text-slate-600">
                      I agree to RIVO&apos;s{' '}
                      <Link to="/terms-of-service" target="_blank" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" target="_blank" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.acceptedTerms && <p className="mt-2 text-xs font-medium text-red-500">{errors.acceptedTerms}</p>}
                </div>

                <Button type="submit" loading={loading} size="lg" className="mt-2 w-full rounded-xl shadow-lg shadow-primary-600/20">
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-primary-600 transition-colors hover:text-primary-700">
                  Sign in
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
