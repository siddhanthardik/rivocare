import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Users, Gift, Copy, Share2, Mail, MessageSquare, 
  ChevronRight, CheckCircle2, Star, ShieldCheck, 
  Clock, TrendingUp, Heart, Briefcase
} from 'lucide-react';
import { providerService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import { formatDate } from '../../../utils/format';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils';

export default function ProviderReferrals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerService.getMyReferral()
      .then(res => setData(res.data))
      .catch((err) => {
        toast.error('Failed to load referral data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    toast.success('Referral link copied!');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Hi! Join Rivo Care as a healthcare provider using my referral link and earn bonuses. Click here to register: ${data.referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join Rivo Care as a Healthcare Partner');
    const body = encodeURIComponent(`Hi,\n\nI'm working with Rivo Care as a healthcare partner and it's a great platform for nursing, physiotherapy, and other care experts.\n\nYou can join using my referral link here: ${data.referralLink}\n\nLet me know if you have any questions!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) return <PageLoader />;
  if (!data) return <div className="p-8 text-center text-red-500 font-bold">Failed to load referral center. Please try again.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 px-2 lg:px-0">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">Partner Rewards</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Refer & Earn</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Invite your colleagues to join Rivo Care. Help us expand our network of care experts and earn exclusive bonuses for every successful onboarding.
          </p>
        </div>
        <Button 
          onClick={copyToClipboard}
          className="bg-white border-2 border-slate-100 hover:border-blue-200 text-blue-600 rounded-2xl px-8 py-4 font-black shadow-sm flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          Copy Referral Link <Copy size={18} />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
        <StatChip icon={<Users size={16} className="text-blue-500" />} label="Total Leads" value={data.stats.total} className="bg-blue-50/50 border-blue-100/50" />
        <StatChip icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Onboarded" value={data.stats.onboarded} className="bg-emerald-50/50 border-emerald-100/50" />
        <StatChip icon={<Clock size={16} className="text-amber-500" />} label="Pending" value={data.stats.pending} className="bg-amber-50/50 border-amber-100/50" />
        <StatChip icon={<Gift size={16} className="text-purple-500" />} label="Rewards Earned" value={data.stats.rewards} className="bg-purple-50/50 border-purple-100/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Link Card */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden h-full">
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Partner Invite Link</h3>
                <p className="text-slate-500 font-medium">Colleagues who register using this link will be tracked as your referrals.</p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 w-full font-mono text-lg font-black text-blue-600 bg-white px-6 py-4 rounded-2xl border border-slate-200 text-center sm:text-left truncate">
                    {data.referralLink}
                  </div>
                  <Button onClick={copyToClipboard} className="w-full sm:w-auto bg-blue-600 text-white rounded-2xl px-6 py-4 font-black shadow-lg shadow-blue-500/20">
                    Copy Link
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Quick Share</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ShareButton icon={<Share2 size={18} />} label="WhatsApp" color="bg-[#25D366]" onClick={shareViaWhatsApp} />
                  <ShareButton icon={<Mail size={18} />} label="Email" color="bg-slate-900" onClick={shareViaEmail} />
                </div>
              </div>
            </div>
            
            {/* Decoration */}
            <div className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none rotate-12">
              <Briefcase size={300} />
            </div>
          </div>
        </div>

        {/* Right Column: How it Works */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-slate-900/10 h-full relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8">Provider Rewards</h3>
            
            <div className="space-y-10">
              <Step number="1" title="Share with colleagues" desc="Invite expert care providers to join our growing team." />
              <Step number="2" title="Verification" desc="Our team verifies their credentials and completes onboarding." />
              <Step number="3" title="Earn Bonuses" desc="Rewards are credited to your wallet at every milestone." />
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <p className="text-sm font-bold text-blue-100">Expand the network, increase your earnings 🚀</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 px-2 tracking-tight">Milestone Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
          <BenefitCard icon={<Star className="text-amber-500" />} title="Signup Bonus" desc="Get credited as soon as they register." />
          <BenefitCard icon={<ShieldCheck className="text-emerald-500" />} title="Onboarding Bonus" desc="Earn more when they get verified." />
          <BenefitCard icon={<Briefcase className="text-blue-500" />} title="Booking Bonus" desc="Extra rewards after their first booking." />
          <BenefitCard icon={<TrendingUp className="text-purple-500" />} title="Network Growth" desc="Higher tiers for regular referrers." />
        </div>
      </div>

      {/* Referral History */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 px-2 tracking-tight">Colleague Referrals</h3>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          {data.history.length === 0 ? (
            <div className="p-20 text-center">
              <Users size={48} className="mx-auto text-slate-200 mb-6" />
              <h4 className="text-xl font-bold text-slate-900 mb-2">No referrals yet</h4>
              <p className="text-slate-500">History will appear here once your colleagues start joining.</p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Joined</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-6 text-sm font-black text-slate-900">{item.name}</td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500">{formatDate(item.date)}</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          item.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : 
                          item.status === 'Rejected' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-black",
                          item.rewardStatus === 'Unlocked' ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {item.rewardStatus === 'Unlocked' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          {item.rewardStatus === 'Unlocked' ? 'Credited' : 'Locked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white text-center shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-black tracking-tight">Build the Best Care Team.</h2>
          <p className="text-blue-100 font-medium text-lg">Invite the best experts in your circle and build a better future of healthcare together.</p>
          <Button 
            onClick={copyToClipboard}
            className="bg-white text-blue-600 rounded-2xl px-12 py-5 font-black text-lg shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
          >
            Invite Colleagues
          </Button>
        </div>
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function StatChip({ icon, label, value, className }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-6 py-3 rounded-full border border-slate-100 bg-white transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default shrink-0",
      className
    )}>
      <div className="shrink-0">{icon}</div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="flex gap-6">
      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black shrink-0">
        {number}
      </div>
      <div>
        <h4 className="text-lg font-black mb-1">{title}</h4>
        <p className="text-sm text-slate-400 font-medium">{desc}</p>
      </div>
    </div>
  );
}

function ShareButton({ icon, label, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg",
        color
      )}
    >
      {icon} {label}
    </button>
  );
}

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-base font-black text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
