import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await authService.resetPassword(token, { password });
      setIsSuccess(true);
      toast.success('Password successfully reset');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password. The link might have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-8">
          {!isSuccess ? (
            <>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={22} className="text-primary-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Password</h1>
                <p className="text-slate-500 text-sm font-medium">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="New Password"
                  type="password"
                  icon={Lock}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Reset Password <Lock size={16} />
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">All done!</h2>
                <p className="text-slate-500 text-sm font-medium">
                  Your password has been successfully reset.
                </p>
              </div>
              <Button onClick={() => navigate('/login')} size="lg" className="w-full">
                Continue to Login <ArrowRight size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
