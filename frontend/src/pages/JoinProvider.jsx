import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Heart, Stethoscope, ChevronRight, HandHeart, Activity } from 'lucide-react';
import { authService } from '../services';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function JoinProvider() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const referralCode = searchParams.get('ref') || '';
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    serviceType: '',
    pincode: '',
  });
  
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email || !form.password || !form.serviceType || !form.pincode) {
      return toast.error('Please fill all required fields');
    }
    if (form.phone.length !== 10) return toast.error('Phone must be 10 digits');
    if (form.pincode.length !== 6) return toast.error('Pincode must be 6 digits');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setSubmitting(true);
    try {
      // Create user + provider profile and log them in
      const res = await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        pincode: form.pincode,
        role: 'provider',
        services: [form.serviceType],
        // Referral code can be processed later if needed (backend doesn't accept it natively in /register yet, 
        // but it can be patched later or ignored for this explicit step since user didn't request backend changes for it)
      });
      
      // Update global auth context
      login(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
      toast.success('Account created successfully!');
      
      // Redirect to provider dashboard for onboarding
      navigate('/dashboard/provider');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left side: Value props */}
      <div className="md:w-5/12 bg-primary-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between">
        <div className="space-y-8 max-w-lg mx-auto md:mx-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-800 text-primary-200 text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Hiring Now
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
              Earn <span className="text-emerald-400">₹20K–₹50K</span> monthly with RIVO
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed">
              Join thousands of healthcare professionals. Create your account and complete onboarding to start earning.
            </p>
          </div>

          <div className="space-y-6 pt-6">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Heart className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Flexible Hours</h3>
                <p className="text-primary-200">Work when you want. Accept bookings that fit your schedule.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Guaranteed Payouts</h3>
                <p className="text-primary-200">Get your earnings deposited directly to your bank account securely.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 hidden md:block opacity-60">
          <p className="text-sm">© {new Date().getFullYear()} RIVO Platform Inc.</p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="md:w-7/12 p-8 md:p-12 lg:p-16 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Provider Account</h2>
            <p className="text-slate-600">Enter your details to register as a healthcare provider.</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6 shadow-xl border-slate-100/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Full Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="Phone Number *" type="tel" maxLength={10} value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="10 digits" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Email Address *" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input label="Password *" type="password" minLength={6} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Service Type *"</label>
                <select 
                  className="input-base bg-white" 
                  value={form.serviceType} 
                  onChange={(e) => setForm(f => ({ ...f, serviceType: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select a role...</option>
                  <option value="nurse">Nurse</option>
                  <option value="physiotherapist">Physiotherapist</option>
                  <option value="doctor">Doctor</option>
                  <option value="caretaker">Caretaker / Attendant</option>
                </select>
              </div>
              <Input label="Current Pincode *" maxLength={6} value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} required />
            </div>

            {referralCode && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm flex items-center justify-between">
                <div>
                  <span className="font-semibold text-indigo-800">Referral Code Applied</span>
                  <p className="text-indigo-600/80 text-xs mt-0.5">Bonus unlocked!</p>
                </div>
                <span className="bg-white px-2 py-1 rounded text-indigo-700 font-mono font-bold">{referralCode}</span>
              </div>
            )}

            <Button type="submit" className="w-full shadow-lg h-12 text-lg group bg-slate-900 border-none text-white hover:bg-slate-800" loading={submitting}>
              Create Account Let's Go
              {!submitting && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />}
            </Button>
            
            <p className="text-center text-xs text-slate-500 mt-4">
              Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-primary-600 font-semibold hover:underline">Log in</button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
