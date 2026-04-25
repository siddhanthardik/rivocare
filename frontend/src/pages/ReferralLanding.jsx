import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Users, Heart, Share2, Copy, CheckCircle, ArrowRight, Star, Wallet, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function ReferralLanding() {
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (user) {
      const code = user.referralCode || '';
      setReferralCode(code);
      setReferralLink(`${window.location.origin}/register?ref=${code}`);
    }
  }, [user]);

  const copyToClipboard = () => {
    if (!user) {
      toast.error('Please login to get your referral link');
      return;
    }
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareViaWhatsApp = () => {
    if (!user) {
      toast.error('Please login to share your link');
      return;
    }
    const text = `Hey! Join RIVO Care for professional home healthcare. Use my link to get ₹100 OFF on your first booking: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative bg-slate-900 py-20 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-indigo-600/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-sm font-bold mb-8 backdrop-blur-md">
            <Gift size={16} /> RIVO REFERRAL PROGRAM
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Care for them, <span className="text-blue-500">Rewards for you.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Invite your friends and colleagues to RIVO. Help them get professional home healthcare while you earn rewards for every successful referral.
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold h-auto shadow-lg shadow-blue-600/20">
                  Join to Start Referring
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800 px-8 py-4 rounded-xl text-lg h-auto">
                  Log In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4 text-left">Your Personal Referral Link</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-black/40 border border-white/10 px-4 py-3 rounded-xl font-mono text-blue-400 text-sm truncate flex items-center justify-center">
                  {referralLink}
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} className="bg-white text-slate-900 hover:bg-slate-100 border-0 px-6 font-bold shrink-0">
                    <Copy size={18} className="mr-2" /> Copy
                  </Button>
                  <Button onClick={shareViaWhatsApp} className="bg-[#25D366] hover:bg-[#20bd5a] border-0 text-white px-4 shrink-0">
                    <MessageCircle size={20} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it Works - Split for Patient and Provider */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Choose your referral track</h2>
            <p className="text-slate-500">Whether you're a patient seeking care or a provider offering it, we have rewards for you.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Patient Track */}
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Heart size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">For Patients</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Help your friends find the best home nursing, physiotherapy, or elderly care. 
                  Share the gift of health and get rewarded.
                </p>

                <div className="space-y-6 mb-10">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-slate-800">Friend gets ₹100 OFF</h4>
                      <p className="text-sm text-slate-500">They get an instant discount on their very first booking.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-slate-800">You earn ₹100</h4>
                      <p className="text-sm text-slate-500">Once their service is completed, ₹100 is credited to your wallet.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Track */}
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-50 rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">For Providers</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Refer your fellow nurses or physiotherapists to join the RIVO network. 
                  Earn big as they grow their professional journey.
                </p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <span className="text-sm font-medium text-slate-700">₹25 on friend's signup</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <span className="text-sm font-medium text-slate-700">₹75 on their onboarding</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <span className="text-sm font-medium text-slate-700">₹100 on their first booking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Grid */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-14">Why Refer to RIVO?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet size={28} />
              </div>
              <h4 className="text-xl font-bold">Real Money</h4>
              <p className="text-slate-500 text-sm">Credits are added directly to your wallet. No hidden points or vouchers.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={28} />
              </div>
              <h4 className="text-xl font-bold">Infinite Earning</h4>
              <p className="text-slate-500 text-sm">There is no limit to how many friends or colleagues you can refer.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={28} />
              </div>
              <h4 className="text-xl font-bold">Impactful Care</h4>
              <p className="text-slate-500 text-sm">You help loved ones get access to verified, professional home healthcare.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Ready to spread the word?</h2>
          <p className="text-blue-100 mb-10 relative z-10 text-lg">Join 1,000+ people already earning through the RIVO referral program.</p>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user ? (
              <Link to="/register">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-xl text-lg font-bold h-auto">
                  Start Earning Now
                </Button>
              </Link>
            ) : (
              <Button onClick={shareViaWhatsApp} className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-xl text-lg font-bold h-auto">
                <Share2 size={20} className="mr-2" /> Share with Friends
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
