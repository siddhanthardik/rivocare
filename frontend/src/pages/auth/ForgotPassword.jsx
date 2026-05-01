import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
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
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-primary-600 mb-8 transition-colors gap-1.5">
          <ArrowLeft size={14} /> Back to login
        </Link>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-8">
          {!isSent ? (
            <>
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <Mail size={22} className="text-primary-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h1>
                <p className="text-slate-500 text-sm font-medium">
                  No worries — enter your email and we'll send reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  Send Reset Link <Send size={16} />
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Check your inbox</h3>
                <p className="text-slate-500 text-sm font-medium">
                  We sent a reset link to <strong className="text-slate-900">{email}</strong>
                </p>
              </div>
              <Button onClick={() => setIsSent(false)} variant="outline" className="w-full text-sm">
                Didn't receive it? Resend
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
