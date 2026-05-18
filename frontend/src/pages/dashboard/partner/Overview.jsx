import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Clock, CheckCircle2,
  FlaskConical, Activity, CreditCard, RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { formatCurrency } from '../../../utils/format';
import { cn } from '../../../utils';

const STATUS_MAP = {
  new:                { label: 'New',         color: 'bg-blue-50 text-blue-600 border-blue-100' },
  accepted:           { label: 'Confirmed',   color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  technician_assigned:{ label: 'Assigned',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
  sample_collected:   { label: 'Collected',   color: 'bg-amber-50 text-amber-600 border-amber-100' },
  processing:         { label: 'Processing',  color: 'bg-orange-50 text-orange-600 border-orange-100' },
  report_uploaded:    { label: 'Report Ready',color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  completed:          { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:          { label: 'Cancelled',   color: 'bg-red-50 text-red-500 border-red-100' },
  rejected:           { label: 'Rejected',    color: 'bg-red-100 text-red-600 border-red-200' },
};

export default function PartnerOverview() {
  const [data, setData] = useState(null);
  const [fin, setFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, finRes] = await Promise.all([
        labService.getDashboard(),
        labService.getFinancialSummary()
      ]);
      setData(dashRes.data.stats);
      setFin(finRes.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader />;

  const financialKpis = [
    {
      label: 'Available Balance',
      value: formatCurrency(fin?.availableBalance),
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: "Today's Earnings",
      value: formatCurrency(fin?.todayEarnings),
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'This Month',
      value: formatCurrency(fin?.monthlyEarnings),
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Pending Payout',
      value: formatCurrency(fin?.pendingSettlement),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const orderStats = [
    { label: 'Orders Today', value: data?.todayOrders ?? 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Action', value: data?.pendingAction ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Today', value: data?.collectedToday ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentOrders = data?.recentOrders ?? [];

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-10 animate-fade-in">
      
      {/* ── COMPACT HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <Link 
            to="/dashboard/partner/lab/orders"
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* ── COMPACT FINANCIAL STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {financialKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.color} flex items-center justify-center shrink-0`}>
              <k.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{k.label}</p>
              <h3 className="text-lg font-black text-slate-900 truncate">{k.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Activity & Orders */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Live Activity</h2>
              </div>
              <Link to="/dashboard/partner/lab/orders" className="text-[10px] font-bold text-indigo-600 hover:underline">
                VIEW ALL
              </Link>
            </div>

            <div className="p-1">
              {recentOrders.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <FlaskConical size={32} className="text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active orders</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentOrders.slice(0, 5).map((order) => {
                    const s = STATUS_MAP[order.status] || { label: order.status, color: 'bg-slate-50 text-slate-400 border-slate-100' };
                    return (
                      <div key={order._id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-all rounded-xl mx-1 my-0.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100/50">
                            {order.patient?.name?.charAt(0) ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{order.patient?.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]">
                              {order.tests?.map(t => t.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        <span className={cn('px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border', s.color)}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Right Column: Stats & Performance */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Order Stats Vertical Stack */}
          <div className="grid grid-cols-1 gap-3">
            {orderStats.map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-none mb-1">{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Compact Quality Score */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform" />
            
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quality Score</h3>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">98.2</span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">EXCELLENT</span>
            </div>

            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[98%]" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Compliance Rate: 98.2%</p>
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}


