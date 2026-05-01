import React, { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, ShoppingBag, 
  Activity, Users, Calendar, Download,
  Filter, ArrowUpRight, ArrowDownRight,
  Search, FlaskConical, DollarSign,
  AlertCircle, ShieldAlert, CheckCircle2,
  Clock, Zap, ChevronRight, MessageSquare
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';

export default function LabWarRoom() {
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWarRoomData();
  }, []);

  const fetchWarRoomData = async () => {
    try {
      setLoading(true);
      const [warRoomRes, perfRes] = await Promise.all([
        labService.getWarRoomStats(),
        labService.getPartnersPerformance()
      ]);
      setStats(warRoomRes.stats);
      setPartners(perfRes.data);
    } catch (err) {
      console.error('Failed to fetch war room data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* EXECUTIVE TOP KPI BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Today GMV', value: `₹${stats.gmvToday.toLocaleString()}`, sub: `Net: ₹${stats.netRevenue.toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: DollarSign },
          { label: 'Orders Today', value: stats.ordersToday, sub: `${stats.activePartners} Labs Active`, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: ShoppingBag },
          { label: 'System SLA %', value: `${stats.slaScore}%`, sub: 'Optimal Threshold', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Activity },
          { label: 'Critical Issues', value: stats.activeIssues, sub: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50', icon: ShieldAlert },
        ].map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                <kpi.icon size={24} />
              </div>
              <ArrowUpRight size={18} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{kpi.value}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIVE OPERATIONS FUNNEL */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
             <Zap size={160} />
          </div>
          <div className="relative z-10 space-y-10">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black">Live Ops Funnel</h3>
                   <p className="text-slate-400 text-xs font-bold mt-1">Real-time tracking across 9 operational steps.</p>
                </div>
                <Button className="bg-white text-slate-900 font-black px-6 rounded-xl text-xs h-auto py-3">View Live Map</Button>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                {[
                  { label: 'New', val: stats.funnel.new, color: 'bg-blue-500' },
                  { label: 'Accepted', val: stats.funnel.accepted, color: 'bg-indigo-500' },
                  { label: 'Assigned', val: stats.funnel.assigned, color: 'bg-purple-500' },
                  { label: 'Collected', val: stats.funnel.collected, color: 'bg-emerald-500' },
                  { label: 'Process', val: stats.funnel.processing, color: 'bg-orange-500' },
                  { label: 'Completed', val: stats.funnel.completed, color: 'bg-teal-500' },
                ].map((step, i) => (
                  <div key={i} className="space-y-3 text-center">
                    <div className="h-16 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                       <div className={`absolute bottom-0 left-0 right-0 h-1 ${step.color}`} />
                       <span className="text-2xl font-black">{step.val}</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{step.label}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* FOUNDER INSIGHTS PANEL */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
           <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" /> Founder Insights
           </h3>
           <div className="space-y-4">
              {[
                { type: 'demand', text: 'Delhi demand rising 22% this week.', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                { type: 'margin', text: 'CBC highest margin test today.', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { type: 'risk', text: 'Lab "Apex Diagnostics" SLA dipping.', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
                { type: 'opportunity', text: 'Vitamin D campaign opportunity.', icon: Star, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              ].map((insight, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:border-slate-100 transition-all cursor-pointer group">
                   <div className={`w-10 h-10 rounded-xl ${insight.bg} ${insight.color} flex items-center justify-center flex-shrink-0`}>
                      <insight.icon size={18} />
                   </div>
                   <p className="text-xs font-bold text-slate-600 leading-relaxed group-hover:text-slate-900">
                      {insight.text}
                   </p>
                </div>
              ))}
           </div>
           <Button variant="secondary" className="w-full rounded-2xl font-black py-4 h-auto text-xs">
              Generate Weekly Report
           </Button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PARTNER PERFORMANCE SCOREBOARD */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Partner Scorecards</h3>
              <Button variant="secondary" className="rounded-xl px-4 py-2 text-[10px] h-auto">View All</Button>
           </div>
           <div className="space-y-6">
              {partners.slice(0, 5).map((lab, i) => (
                <div key={i} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-black text-slate-400 text-xs">
                         {lab.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900">{lab.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lab.totalOrders} Orders • Score: {lab.performanceScore}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-sm font-black ${lab.completionRate > 90 ? 'text-emerald-600' : 'text-orange-600'}`}>
                         {lab.completionRate.toFixed(1)}%
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">TAT Compliance</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* RECENT OPERATIONAL ISSUES */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Operational Issues</h3>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Tickets</span>
              </div>
           </div>
           <div className="space-y-4">
              {[
                { patient: 'Siddhant H.', issue: 'Report Delayed > 4h', status: 'critical', order: '#RIVO-1024' },
                { patient: 'Aayush M.', issue: 'Technician No-Show', status: 'critical', order: '#RIVO-1025' },
                { patient: 'Riya S.', issue: 'Sample Leakage', status: 'high', order: '#RIVO-1026' },
                { patient: 'Karan J.', issue: 'Address Mismatch', status: 'medium', order: '#RIVO-1027' },
              ].map((ticket, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-red-100 transition-all cursor-pointer">
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${ticket.status === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                      <div>
                         <p className="text-xs font-black text-slate-900">{ticket.issue}</p>
                         <p className="text-[10px] font-bold text-slate-400">{ticket.patient} • {ticket.order}</p>
                      </div>
                   </div>
                   <Button variant="secondary" className="rounded-lg px-3 py-1.5 text-[9px] h-auto font-black uppercase tracking-widest">Triage</Button>
                </div>
              ))}
           </div>
        </div>

      </div>

    </div>
  );
}

function Star({ size, fill, className }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" 
      fill={fill} stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
