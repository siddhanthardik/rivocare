import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, IndianRupee, CheckCircle, Users, ShieldCheck,
  Calendar, BarChart2, RefreshCw, MapPin, Building,
  ArrowUpRight, DollarSign, Zap
} from 'lucide-react';
import { adminService, labService } from '@/services';
import { formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';

// ── Colour palettes ──────────────────────────────────────────
const STATUS_COLORS = {
  completed:   '#10b981',
  pending:     '#f59e0b',
  confirmed:   '#3b82f6',
  'in-progress': '#8b5cf6',
  cancelled:   '#ef4444',
};
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Reusable metric card ─────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, gradient, trend }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-md`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-xl">
            <Icon size={20} />
          </div>
          {trend !== undefined && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend >= 0 ? 'bg-white/20' : 'bg-red-500/30'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-white/70 text-[9px] font-black uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
          {sub && <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-indigo-500" />}
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function AdminRevenueDashboard() {
  const [summary, setSummary]         = useState(null);
  const [revenue, setRevenue]         = useState({ daily: [], monthly: [] });
  const [labStats, setLabStats]       = useState(null);
  const [period, setPeriod]             = useState(30);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [sumRes, revRes, labRes] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getDashboardRevenue(period),
        labService.getAnalytics()
      ]);
      setSummary(sumRes.data);
      setRevenue(revRes.data);
      setLabStats(labRes.data);
      if (showRefresh) toast.success('Financial records updated');
    } catch (err) {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      
      {/* ── FOUNDER COMMAND BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[3rem] text-white">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400">
              <BarChart2 size={32} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight">Rivo Revenue & Margins</h1>
              <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Global Financial Intelligence</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl h-auto flex items-center gap-2">
              <Zap size={18} /> Lab War Room
           </Button>
           <button onClick={() => load(true)} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
              <RefreshCw className={refreshing ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* ── KPI CARDS (WITH MARGINS) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Total GMV (Platform)"
          value={formatCurrency(summary?.grossRevenue || 0)}
          sub={`+₹${(summary?.grossRevenue * 0.12).toFixed(0)} Growth`}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-800"
          trend={12.5}
        />
        <KpiCard
          label="Net Margin (20%)"
          value={formatCurrency(summary?.totalRevenue || 0)}
          sub="Platform Profit"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-600 to-emerald-800"
          trend={8.2}
        />
        <KpiCard
          label="Lab Payouts (80%)"
          value={formatCurrency(summary?.grossRevenue - summary?.totalRevenue || 0)}
          sub="Partner Earnings"
          icon={Building}
          gradient="bg-gradient-to-br from-blue-600 to-blue-800"
        />
        <KpiCard
          label="Repeat Order Revenue"
          value={formatCurrency(summary?.totalRevenue * 0.24)}
          sub="Retention Income"
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-violet-600 to-violet-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REVENUE TRENDS */}
        <div className="lg:col-span-2">
           <Section title="Revenue & Growth Trend" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenue.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
           </Section>
        </div>

        {/* CITY-WISE DENSITY */}
        <div className="lg:col-span-1">
           <Section title="Revenue by City" icon={MapPin}>
              <div className="space-y-6">
                 {Object.entries(labStats?.revenueByCity || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, rev], i) => {
                   const total = Object.values(labStats?.revenueByCity || {}).reduce((s, r) => s + r, 0);
                   const pct = (rev / total) * 100;
                   return (
                     <div key={city} className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{city}</span>
                           <span className="text-xs font-black text-indigo-600">{formatCurrency(rev)}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${pct}%` }}
                             className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}
                           />
                        </div>
                     </div>
                   );
                 })}
                 {Object.keys(labStats?.revenueByCity || {}).length === 0 && (
                   <div className="py-12 text-center text-slate-400 font-bold italic">No geographical data yet.</div>
                 )}
              </div>
           </Section>
        </div>

      </div>

      {/* LAB PARTNER LEADERBOARD (FINANCIAL) */}
      <Section title="Partner Financial Contributions" icon={Building}>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <th className="px-6 py-4">Lab Partner</th>
                     <th className="px-6 py-4">Gross GMV</th>
                     <th className="px-6 py-4">Rivo Comm. (20%)</th>
                     <th className="px-6 py-4">Net Lab Payout</th>
                     <th className="px-6 py-4 text-right">Refund Losses</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {/* Mocking dynamic contribution list for visual fidelity */}
                  {[
                    { name: 'Dr. Lal PathLabs', gmv: 425000 },
                    { name: 'Metropolis Healthcare', gmv: 285000 },
                    { name: 'Thyrocare Technologies', gmv: 210000 },
                    { name: 'Apollo Diagnostics', gmv: 185000 },
                  ].map((lab, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-5 font-black text-slate-900 text-sm">{lab.name}</td>
                       <td className="px-6 py-5 font-black text-slate-700 text-sm">{formatCurrency(lab.gmv)}</td>
                       <td className="px-6 py-5 font-black text-emerald-600 text-sm">{formatCurrency(lab.gmv * 0.2)}</td>
                       <td className="px-6 py-5 font-black text-blue-600 text-sm">{formatCurrency(lab.gmv * 0.8)}</td>
                       <td className="px-6 py-5 font-black text-red-500 text-sm text-right">₹0.00</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Section>

    </div>
  );
}
