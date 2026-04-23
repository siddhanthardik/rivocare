import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
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
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-app-bg">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-card-hover animate-slide-up bg-white">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-2xl mb-4">
                  <Lock size={24} className="text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Create New Password</h1>
                <p className="text-slate-500 text-sm mt-2">
                  Your new password must be different from previous used passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                  label="New Password" 
                  type="password" 
                  icon={Lock} 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
                <Input 
                  label="Confirm Password" 
                  type="password" 
                  icon={Lock} 
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                />
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center animate-fade-in py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full text-emerald-500 mb-6">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Password Reset!</h2>
              <p className="text-slate-500 mt-2 mb-8">
                Your password has been successfully reset. Click below to log in magically.
              </p>
              <Button onClick={() => navigate('/login')} size="lg" className="w-full">
                Continue to Login <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
