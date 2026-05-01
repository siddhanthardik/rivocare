import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Calendar, Clock, Microscope, 
  CheckCircle2, AlertCircle, FlaskConical,
  Truck, FileCheck, MapPin, User, X, Info
} from 'lucide-react';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatCurrency, formatDate } from '../../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, Card, Row, Section, KPIChip, StatusPill } from '../../../components/ui/Layout';

export default function LabOrders() {
   const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTracking, setShowTracking] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await labService.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      toast.error('Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTrack = (order) => {
    setSelectedOrder(order);
    setShowTracking(true);
  };

  const handleRebook = (order) => {
    if (!order.tests || order.tests.length === 0) {
      toast.error("No tests found");
      return;
    }
    localStorage.setItem('rivo_lab_cart', JSON.stringify(order.tests));
    toast.success("Tests added to cart.");
    setTimeout(() => { navigate('/dashboard/patient/labs/book'); }, 1000);
  };

  const handleDownloadInvoice = async (order) => {
    try {
      if (order.paymentStatus !== 'collected' && order.paymentStatus !== 'paid') {
        toast.error('Invoice pending collection.');
        return;
      }
      const { data } = await labService.getInvoice(order._id);
      const invoiceWindow = window.open('', '_blank');
      invoiceWindow.document.write(`
        <html><head><title>Invoice ${data.invoiceId}</title>
        <style>body{font-family:sans-serif;padding:40px;color:#333;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#f9fafb;}</style>
        </head><body>
          <h1>Rivo Labs - Tax Invoice</h1>
          <p><strong>Invoice ID:</strong> ${data.invoiceId}</p>
          <hr/>
          <table>
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Diagnostic Tests</td><td>₹${data.financials.baseAmount}</td></tr>
              <tr><td><strong>Total</strong></td><td><strong>₹${data.financials.totalAmount}</strong></td></tr>
            </tbody>
          </table>
        </body></html>
      `);
      invoiceWindow.document.close();
      setTimeout(() => invoiceWindow.print(), 500);
    } catch (err) { toast.error('Invoice failed'); }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase().includes(filter.toLowerCase());
  });

  if (loading) return <PageLoader />;

  return (
    <PageWrapper>
      {/* ── Page Header ────────────────────────────────── */}
      <Section 
        title="Lab Test Orders" 
        subtitle="Track your diagnostic samples"
        action={
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
            {['all', 'new', 'sample_collected', 'report_uploaded'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg typo-micro font-black transition-all whitespace-nowrap uppercase tracking-tighter",
                  filter === f ? "bg-slate-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        }
      />

      {orders.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
            <FlaskConical size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="typo-value font-black text-slate-900">No orders found</h3>
            <p className="typo-micro">You haven't booked any lab tests yet.</p>
          </div>
          <button onClick={() => navigate('/dashboard/patient/labs/book')} className="btn-primary-sm !px-8 !py-3">Book Test</button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <Card key={order._id} noPadding className="overflow-hidden">
              <div className="p-3 flex flex-col lg:flex-row gap-4">
                {/* Order Meta */}
                <div className="lg:w-1/4 space-y-2">
                  <div className="space-y-0.5">
                    <p className="typo-micro font-black text-slate-400 uppercase tracking-widest leading-none">Order ID</p>
                    <p className="typo-value !text-gray-900 font-black tracking-tight">#LAB-{order._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <StatusPill status={order.status} className="scale-105 origin-left" />
                </div>

                {/* Tests Included */}
                <div className="flex-1 space-y-3">
                  <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 space-y-2">
                    <p className="typo-micro font-black text-slate-400 uppercase tracking-widest leading-none">Included Tests</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                      {order.tests.map((test, i) => (
                        <div key={i} className="flex justify-between items-center typo-micro font-bold">
                          <span className="text-gray-900 truncate mr-2">{test.name}</span>
                          <span className="text-blue-600 shrink-0">{formatCurrency(test.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 px-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="typo-micro font-bold text-gray-600">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-blue-500" />
                      <span className="typo-micro font-bold text-gray-600">{order.scheduledTime || 'TBD'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:w-1/4 flex flex-col justify-center gap-3 lg:border-l border-gray-100 lg:pl-4">
                  <div className="text-right lg:text-left space-y-0.5">
                    <p className="typo-micro font-black text-slate-400 uppercase tracking-widest leading-none">Total Amount</p>
                    <p className="typo-kpi text-blue-600 font-black leading-tight">{formatCurrency(order.totalAmount)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'completed' || order.status === 'report_uploaded' ? (
                      <button 
                        onClick={() => navigate('/dashboard/patient/labs/reports')}
                        className="btn-primary-sm col-span-2 !bg-emerald-600 !py-2.5 shadow-md shadow-emerald-900/10"
                      >
                        View Report
                      </button>
                    ) : (
                      <button 
                        disabled={order.status === 'cancelled' || order.status === 'rejected'}
                        onClick={() => handleTrack(order)}
                        className="btn-primary-sm col-span-2 !py-2.5 shadow-md shadow-blue-900/10"
                      >
                        Track Order
                      </button>
                    )}
                    <button onClick={() => handleRebook(order)} className="btn-secondary-sm !py-2 !text-[11px] font-black uppercase">Rebook</button>
                    <button onClick={() => handleDownloadInvoice(order)} className="btn-secondary-sm !py-2 !text-[11px] font-black uppercase">Invoice</button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tracking Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showTracking && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTracking(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-slate-900 p-8 text-center text-white">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                   <Truck size={32} className="text-white" />
                 </div>
                 <h3 className="typo-title !text-white mb-1">Track Order</h3>
                 <StatusPill status={selectedOrder.status} className="!bg-white/10 !text-white !border-white/20" />
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                   {[
                     { id: 'new', label: 'Order Placed', icon: Clock },
                     { id: 'accepted', label: 'Order Confirmed', icon: CheckCircle2 },
                     { id: 'sample_collected', label: 'Sample Collected', icon: FlaskConical },
                     { id: 'report_uploaded', label: 'Report Ready', icon: FileCheck }
                   ].map((s, i) => {
                     const isPast = ['new', 'accepted', 'sample_collected', 'report_uploaded'].indexOf(selectedOrder.status) >= i;
                     return (
                      <div key={i} className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300",
                          isPast ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-300"
                        )}>
                          <s.icon size={16} />
                        </div>
                        <p className={cn("typo-micro font-black uppercase tracking-widest", isPast ? "text-slate-900" : "text-slate-300")}>
                          {s.label}
                        </p>
                      </div>
                     );
                   })}
                </div>
                <button onClick={() => setShowTracking(false)} className="w-full btn-primary-sm !py-3 shadow-lg shadow-blue-900/10">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
