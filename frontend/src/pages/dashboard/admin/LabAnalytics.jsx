import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, ShoppingBag, 
  Activity, Users, Calendar, Download,
  Filter, ArrowUpRight, ArrowDownRight,
  Search, FlaskConical, DollarSign
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { motion } from 'framer-motion';

export default function LabAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await labService.getAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lab Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time revenue and booking insights for Rivo Labs.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-6 py-3 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          >
            {['Last 7 Days', 'Last 30 Days', 'This Quarter', 'This Year'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Bookings', value: stats.totalOrders, change: '+8.2%', up: true, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Completion Rate', value: `${Math.round((stats.completedOrders/stats.totalOrders)*100)}%`, change: '-2.1%', up: false, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Patients', value: '1,284', change: '+14.3%', up: true, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-900/5 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REVENUE CHART (VISUAL MOCK) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900">Revenue Trends</h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                 <span className="text-xs font-bold text-slate-500">Revenue</span>
               </div>
            </div>
          </div>
          
          <div className="h-72 flex items-end justify-between gap-4 px-4">
            {Object.entries(stats.revenueByMonth).map(([month, val], i) => {
               const max = Math.max(...Object.values(stats.revenueByMonth));
               const height = (val / max) * 100;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                   <div className="w-full relative">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-full bg-blue-600/10 rounded-t-xl group-hover:bg-blue-600 transition-all relative"
                      >
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            ₹{val.toLocaleString()}
                         </div>
                      </motion.div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{month}</span>
                 </div>
               );
            })}
          </div>
        </div>

        {/* POPULAR TESTS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-xl font-black text-slate-900">Top Selling Tests</h3>
          <div className="space-y-6">
            {stats.popularTests.map((test, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700">{test.name}</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{test.count} bookings</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(test.count / stats.popularTests[0].count) * 100}%` }}
                    className="h-full bg-blue-600 rounded-full"
                   />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-slate-100">
             <button className="w-full py-4 text-sm font-black text-slate-900 hover:bg-slate-50 rounded-2xl transition-all flex items-center justify-center gap-2">
                View Full Catalog Performance <ArrowUpRight size={18} />
             </button>
          </div>
        </div>

      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Live Lab Orders</h3>
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Patient..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Slot</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">#RIVO-{10200 + i}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                        JD
                      </div>
                      <span className="text-sm font-bold text-slate-700">John Doe</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-900">Oct 24, 2024</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">09:00 AM - 10:00 AM</p>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">₹1,499</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                      Processing
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                      <ArrowUpRight size={18} className="text-slate-400 hover:text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
