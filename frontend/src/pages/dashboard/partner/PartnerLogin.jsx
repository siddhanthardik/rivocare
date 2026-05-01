import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Microscope, ArrowRight, Lock, Mail, User, Phone, CheckCircle2, FlaskConical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { labService } from '@/services';
import { useAuth } from '../../../context/AuthContext';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { partnerLogin, partnerRegister } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    labName: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await partnerLogin({ email: formData.email, password: formData.password });
        toast.success('Login successful!');
        navigate('/dashboard/partner/lab');
      } else {
        await partnerRegister(formData);
        toast.success('Registration successful!');
        navigate('/dashboard/partner/lab');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* ── LEFT SIDE: BRANDING ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-500/20 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white mb-20 group w-fit">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FlaskConical size={22} />
            </div>
            <span className="text-xl font-black tracking-tight">RIVO LABS</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
            Grow your diagnostic business with Rivo.
          </h1>
          <p className="text-indigo-200 text-lg mb-12 max-w-md">
            Join our network of premium, accredited partner labs. Access thousands of patients looking for reliable diagnostic services at home.
          </p>

          <div className="space-y-6">
            {[
              "Zero upfront onboarding costs.",
              "Guaranteed home-collection logistics.",
              "Automated smart reporting system.",
              "Weekly transparent payouts."
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-indigo-100 font-medium">
                <CheckCircle2 size={20} className="text-emerald-400" /> {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-semibold text-indigo-300">
          <p>© 2026 Rivo Healthcare.</p>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>
      </div>

      {/* ── RIGHT SIDE: FORM ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <FlaskConical size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">RIVO LABS</span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back, Partner' : 'Apply as Partner Lab'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Fill out your lab details to join the network.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" name="name" required value={formData.name} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Registered Lab Name</label>
                  <div className="relative">
                    <Microscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" name="labName" required value={formData.labName} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                      placeholder="e.g. Apex Diagnostics"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                  placeholder="partner@lab.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                {isLogin && <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Forgot?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" name="password" required value={formData.password} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              loading={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl mt-4 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isLogin ? 'Login to Portal' : 'Submit Application'} <ArrowRight size={20} />
            </Button>
          </form>

          <p className="text-center text-slate-500 font-medium mt-8">
            {isLogin ? "Don't have a partner account? " : "Already an approved partner? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
            >
              {isLogin ? 'Apply Now' : 'Login Here'}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}

