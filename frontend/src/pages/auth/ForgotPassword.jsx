import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, HeartPulse, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setIsSent(true);
      toast.success('Reset link sent successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-app-bg">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to login
        </Link>
        
        <div className="card p-8 shadow-card-hover animate-slide-up bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-2xl mb-4">
              <HeartPulse size={24} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
            <p className="text-slate-500 text-sm mt-2">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label="Email" 
                type="email" 
                icon={Mail} 
                placeholder="you@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Reset Password
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="flex items-center justify-center text-emerald-500 mb-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Send size={28} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Check your email</h3>
                <p className="text-slate-500 text-sm mt-2">
                  We sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Button onClick={() => setIsSent(false)} variant="outline" className="w-full mt-4">
                Didn't receive the email? Click to resend
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
