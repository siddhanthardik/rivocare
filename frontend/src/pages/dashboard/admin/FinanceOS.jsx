import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Activity, Wallet, Download, 
  RefreshCcw, AlertTriangle, CheckCircle2,
  TrendingUp, CreditCard, Banknote, Lock, Calendar
} from 'lucide-react';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../../utils/format';

export default function FinanceOS() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data } = await labService.getFinanceMetrics();
      setMetrics(data);
    } catch (err) {
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (partnerId, amount) => {
    if (!window.confirm(`Process payout of ₹${amount} to partner?`)) return;
    
    try {
      setProcessingId(partnerId);
      // Generate a mock bank reference for the prototype
      const ref = `TXN${Math.floor(Math.random() * 10000000)}`;
      await labService.processSettlement({
        partnerId,
        amount,
        payoutReference: ref,
        payoutMethod: 'bank_transfer'
      });
      toast.success('Payout processed successfully');
      fetchMetrics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 px-6 py-5 rounded-2xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
            <DollarSign size={16} /> Finance OS
          </div>
          <h1 className="text-xl font-black tracking-tight">Revenue & Settlements</h1>
          <p className="text-slate-400 font-medium text-xs">Real-time GMV, Platform Margins, and Partner Payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchMetrics} className="bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-6 font-black text-xs">
            <RefreshCcw size={16} className="mr-2 inline" /> Refresh
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-6 font-black text-xs shadow-lg shadow-indigo-600/20">
            <Download size={16} className="mr-2 inline" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
             <Activity size={80} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total GMV (Collected)</p>
          <h3 className="text-3xl font-black text-slate-900">₹{metrics.totalGmv?.toLocaleString() || 0}</h3>
          <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1"><TrendingUp size={12}/> +12% this month</p>
        </div>
        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg shadow-indigo-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet size={80} />
          </div>
          <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2">Platform Revenue</p>
          <h3 className="text-3xl font-black">₹{metrics.platformRevenue?.toLocaleString() || 0}</h3>
        </div>
        <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-lg shadow-emerald-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Calendar size={80} />
          </div>
          <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-2">Collected Today</p>
          <h3 className="text-3xl font-black">₹{metrics.todayCollected?.toLocaleString() || 0}</h3>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Reports Locked (Pending Pay)</p>
          <h3 className="text-2xl font-black text-indigo-600">{metrics.lockedReports || 0} <span className="text-sm">Reports</span></h3>
          <p className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center gap-1"><Lock size={9}/> Awaiting Collection</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">COD Pending (Cash at Labs)</p>
          <h3 className="text-2xl font-black text-red-600">₹{metrics.codPending?.toLocaleString() || 0}</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-1.5">Requires offline collection</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Partner Payouts Pending</p>
          <h3 className="text-2xl font-black text-orange-600">₹{metrics.pendingPayouts?.toLocaleString() || 0}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECONCILIATION TABLE */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-lg font-black text-slate-900 px-2 flex items-center gap-2"><CreditCard size={18}/> Partner Settlement Queue</h3>
           <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Lab</th>
                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Balance</th>
                     <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody>
                   {metrics.wallets.filter(w => w.balance > 0).length === 0 ? (
                      <tr>
                         <td colSpan="3" className="p-8 text-center text-slate-400 font-bold text-sm">All partners are fully settled.</td>
                      </tr>
                   ) : (
                     metrics.wallets.filter(w => w.balance > 0).map(wallet => (
                        <tr key={wallet._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                           <td className="p-4">
                             <p className="text-sm font-black text-slate-900">{wallet.partner?.name}</p>
                             <p className="text-[10px] font-bold text-slate-400">{wallet.partner?.email}</p>
                           </td>
                           <td className="p-4">
                             <p className="text-lg font-black text-orange-600">₹{wallet.balance.toLocaleString()}</p>
                           </td>
                           <td className="p-4 text-right">
                             <Button 
                               onClick={() => handleProcessPayout(wallet.partner._id, wallet.balance)}
                               disabled={processingId === wallet.partner._id}
                               className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-black disabled:opacity-50"
                             >
                               {processingId === wallet.partner._id ? 'Processing...' : 'Settle Now'}
                             </Button>
                           </td>
                        </tr>
                     ))
                   )}
                </tbody>
             </table>
           </div>
        </div>

        {/* RECENT SETTLEMENTS */}
        <div className="space-y-4">
           <h3 className="text-lg font-black text-slate-900 px-2 flex items-center gap-2"><Banknote size={18}/> Recent Payouts</h3>
           <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2">
              {metrics.recentSettlements.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 font-bold text-sm">No recent settlements.</div>
              ) : (
                 <div className="space-y-1">
                    {metrics.recentSettlements.map(set => (
                       <div key={set._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                          <div>
                             <p className="text-sm font-black text-slate-900">{set.partner?.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(set.createdAt)} • {set.payoutReference}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-emerald-600">₹{set.netPayout.toLocaleString()}</p>
                             <p className="text-[10px] font-black text-emerald-600 flex items-center justify-end gap-1"><CheckCircle2 size={10}/> Paid</p>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>

      </div>

    </div>
  );
}
