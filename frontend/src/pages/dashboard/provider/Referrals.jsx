import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Share2, Copy, Users, CheckCircle, Gift } from 'lucide-react';
import { providerService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';

export default function ProviderReferrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerService.getMyReferral()
      .then(res => setData(res.data.data))
      .catch((err) => {
        toast.error('Failed to load referral data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Hi! Join RIVO as a healthcare provider using my referral link and earn a bonus. Click here: ${data.referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) return <PageLoader />;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load referral data.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Refer & Earn</h1>
        <p className="text-slate-500">Invite your colleagues to RIVO and earn bonuses for every successful onboarding.</p>
      </div>

      {/* Hero Banner */}
      <div className="card p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute right-12 bottom-0 opacity-20 hidden md:block">
          <Gift size={120} />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            Tiered Referral Program
          </span>
          <h2 className="text-3xl font-extrabold mb-3">Earn up to ₹200 per referral</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 mt-6">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm text-center">
              <p className="text-[10px] uppercase font-bold text-indigo-200">Stage 1</p>
              <p className="text-xl font-bold">₹25</p>
              <p className="text-[10px] text-indigo-100">On Signup</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm text-center">
              <p className="text-[10px] uppercase font-bold text-indigo-200">Stage 2</p>
              <p className="text-xl font-bold">₹75</p>
              <p className="text-[10px] text-indigo-100">On Onboarding</p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm text-center">
              <p className="text-[10px] uppercase font-bold text-indigo-200">Stage 3</p>
              <p className="text-xl font-bold">₹100</p>
              <p className="text-[10px] text-indigo-100">On First Booking</p>
            </div>
          </div>


          <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md">
            <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold mb-2">Your Unique Link</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-black/20 px-4 py-3 rounded-lg font-mono text-white text-sm truncate flex items-center">
                {data.referralLink}
              </div>
              <Button 
                onClick={copyToClipboard}
                className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 px-4 shrink-0"
              >
                <Copy size={16} className="mr-2" /> Copy
              </Button>
            </div>
            
            <div className="mt-4 flex gap-3">
              <Button onClick={shareViaWhatsApp} className="w-full bg-[#25D366] hover:bg-[#20bd5a] border-0 text-white">
                <Share2 size={16} className="mr-2" /> Share on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Your Referral Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Referrals (Signups)</p>
            <h3 className="text-3xl font-bold text-slate-800">{data.totalLeads}</h3>
            <p className="text-xs text-slate-400 mt-1">₹25 earned per signup</p>
          </div>
        </div>

        <div className="card p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Successfully Onboarded</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold text-slate-800">{data.onboarded}</h3>
              <p className="text-emerald-600 font-semibold mb-1">₹75 more per lead</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">₹100 extra on their first booking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
