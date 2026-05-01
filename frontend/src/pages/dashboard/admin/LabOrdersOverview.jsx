import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Clock, CheckCircle2, 
  FlaskConical, ArrowRight, Calendar, 
  User, Building, Wallet, Download, Eye,
  RefreshCw, RotateCcw, AlertTriangle, 
  MoreVertical, ShieldAlert, Zap, DollarSign, ChevronRight
} from 'lucide-react';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LabOrdersOverview() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await labService.getAllOrders();
      setOrders(data || []);
    } catch (err) {
      toast.error('Failed to load global orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const { data } = await labService.getPartners();
      setPartners(data || []);
    } catch (err) {
      console.error('Failed to load partners');
    }
  };

  const handleAction = async (orderId, action, extra = {}) => {
    try {
      await labService.manageOrder(orderId, { action, ...extra });
      toast.success(`Order ${action}ed successfully`);
      fetchOrders();
      setShowReassignModal(false);
      setSelectedOrder(null);
    } catch (err) {
      toast.error('Operational override failed');
    }
  };

  const handleFinanceAction = async (orderId, newStatus) => {
    try {
      await labService.manageFinanceStatus(orderId, { newStatus });
      toast.success(`Payment status updated to ${newStatus}`);
      fetchOrders();
      setShowFinanceModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update finance status');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = o.patient?.name?.toLowerCase().includes(search.toLowerCase()) || 
                         o._id.toLowerCase().includes(search.toLowerCase()) ||
                         o.partner?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'new': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', label: 'New Order' },
      'accepted': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'Accepted' },
      'sample_collected': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: 'Collected' },
      'processing': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', label: 'Processing' },
      'report_uploaded': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', label: 'Report Ready' },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Completed' },
      'delayed': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', label: 'Delayed' },
      'rejected': { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', label: 'Rejected' },
    };
    const b = badges[status] || badges['new'];
    return <span className={`px-2 py-0.5 rounded-full ${b.bg} ${b.text} ${b.border} text-[9px] font-black uppercase border`}>{b.label}</span>;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-20">
      
      {/* ── COMMAND HEADER ── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <Zap size={14} /> Control Center
          </div>
          <h1 className="text-4xl font-black tracking-tight">Operational Triage</h1>
          <p className="text-slate-400 font-medium">Manage and override diagnostic lifecycles globally.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative group w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search triage queue..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-sm text-white"
              />
           </div>
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 font-black text-xs uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer"
           >
             {['all', 'new', 'accepted', 'sample_collected', 'processing', 'completed', 'delayed', 'rejected'].map(s => (
               <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
             ))}
           </select>
           <Button className="bg-blue-600 text-white rounded-2xl font-black px-8 py-4 h-auto shadow-xl shadow-blue-500/20">
              Export MIS
           </Button>
        </div>
      </div>

      {/* ── DATA DENSE TRIAGE TABLE ── */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID & Timeline</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Performance</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Command Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className={`hover:bg-slate-50/50 transition-colors group ${order.isEscalated ? 'bg-red-50/30' : ''}`}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                       <span className="font-black text-slate-900">#{order._id.slice(-6).toUpperCase()}</span>
                       {order.isEscalated && <ShieldAlert size={14} className="text-red-600 animate-pulse" />}
                    </div>
                    <div className="mt-1.5">{getStatusBadge(order.status)}</div>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                       <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-0.5">
                       <p className="font-black text-slate-900 text-sm">{order.patient?.name}</p>
                       <p className="text-[10px] font-bold text-slate-500">{order.patient?.phone}</p>
                       <p className="text-[9px] font-black text-blue-600 uppercase mt-1">{order.collectionAddress?.city}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                          {order.partner?.name?.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-xs">{order.partner?.name || 'Searching Lab...'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Compliant</span>
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="font-black text-slate-900 text-sm">₹{order.totalAmount}</div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[9px] font-black uppercase ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {order.paymentStatus}
                       </span>
                       <span className="text-slate-300">|</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">{order.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                         variant="secondary" 
                         onClick={() => { setSelectedOrder(order); setShowFinanceModal(true); }}
                         className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                         title="Manage Finance"
                       >
                          <DollarSign size={16} />
                       </Button>
                       <Button 
                         variant="secondary" 
                         onClick={() => { setSelectedOrder(order); setShowReassignModal(true); }}
                         className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                         title="Reassign Lab"
                       >
                          <RefreshCw size={16} />
                       </Button>
                       <Button 
                         variant="secondary" 
                         onClick={() => handleAction(order._id, 'refund')}
                         className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                         title="Cancel & Refund"
                       >
                          <RotateCcw size={16} />
                       </Button>
                       <Button 
                         variant="secondary" 
                         onClick={() => handleAction(order._id, 'escalate')}
                         className="p-3 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-all"
                         title="Escalate Issue"
                       >
                          <AlertTriangle size={16} />
                       </Button>
                       <div className="w-px h-8 bg-slate-100 mx-2" />
                       <Button variant="secondary" className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                          <MoreVertical size={16} />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="p-20 text-center">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <FlaskConical size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-900">Queue is Clear</h3>
               <p className="text-slate-500 font-medium mt-2">No active orders found matching these filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* REASSIGN MODAL */}
      <AnimatePresence>
        {showReassignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowReassignModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                     <RefreshCw size={28} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 leading-tight">Reassign Lab</h3>
                     <p className="text-xs font-bold text-slate-400 mt-1">Move order #{selectedOrder._id.slice(-6).toUpperCase()} to a new partner.</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Active Partner</label>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                     {partners.filter(p => p.status === 'active' && p._id !== selectedOrder.partner?._id).map(p => (
                       <button 
                        key={p._id}
                        onClick={() => handleAction(selectedOrder._id, 'reassign', { newPartnerId: p._id })}
                        className="w-full p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 text-left transition-all group"
                       >
                          <div className="flex items-center justify-between">
                             <div>
                                <p className="text-sm font-black text-slate-900">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{p.type}</p>
                             </div>
                             <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                          </div>
                       </button>
                     ))}
                  </div>
               </div>
               
               <Button variant="secondary" className="w-full py-4 text-xs font-black uppercase tracking-widest" onClick={() => setShowReassignModal(false)}>
                  Cancel Override
               </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FINANCE MODAL */}
      <AnimatePresence>
        {showFinanceModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowFinanceModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                     <DollarSign size={28} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 leading-tight">Finance Ops</h3>
                     <p className="text-xs font-bold text-slate-400 mt-1">Update payment for #{selectedOrder._id.slice(-6).toUpperCase()}</p>
                  </div>
               </div>
               
               <div className="space-y-2">
                 <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center mb-4">
                   <span className="text-sm font-bold text-slate-500">Current Status:</span>
                   <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{selectedOrder.paymentStatus}</span>
                 </div>
                 
                 {[
                   { status: 'collected', label: 'Mark Collected', desc: 'Auto-unlocks report and credits partner wallet.', color: 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-600 hover:text-white hover:border-transparent' },
                   { status: 'waived', label: 'Waive Payment', desc: 'Free access given by admin.', color: 'text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-600 hover:text-white hover:border-transparent' },
                   { status: 'refunded', label: 'Refunded', desc: 'Mark payment as returned to patient.', color: 'text-red-600 border-red-200 bg-red-50 hover:bg-red-600 hover:text-white hover:border-transparent' },
                   { status: 'payment_link_sent', label: 'Link Sent', desc: 'Manual payment link shared.', color: 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white hover:border-transparent' }
                 ].map(action => (
                   <button
                     key={action.status}
                     onClick={() => handleFinanceAction(selectedOrder._id, action.status)}
                     className={`w-full p-4 rounded-2xl border text-left transition-all ${action.color} group`}
                   >
                     <div className="flex justify-between items-center">
                       <div>
                         <p className="font-black">{action.label}</p>
                         <p className="text-[10px] opacity-70 mt-1">{action.desc}</p>
                       </div>
                       <ChevronRight size={16} className="opacity-50" />
                     </div>
                   </button>
                 ))}
               </div>
               
               <Button variant="secondary" className="w-full py-4 text-xs font-black uppercase tracking-widest" onClick={() => setShowFinanceModal(false)}>
                  Cancel
               </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
