import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const DASHBOARD = { patient: '/dashboard/patient', provider: '/dashboard/provider', admin: '/dashboard/admin' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-app-bg">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-card-hover animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-2xl mb-4">
              <HeartPulse size={24} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your RIVO account</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input label="Email" type="email" icon={Mail} placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email} />
            <div className="space-y-1">
              <Input label="Password" type="password" icon={Lock} placeholder="••••••••"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                error={errors.password} />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">Create one</Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
            <p className="font-semibold mb-2">Demo Accounts:</p>
            <p>🩺 Patient: patient@rivocare.in / Patient@1234</p>
            <p>👨‍⚕️ Provider: provider@rivocare.in / Provider@1234</p>
            <p>🛡️ Admin: admin@rivocare.in / Admin@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
