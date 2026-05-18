import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Search, FileText, Upload, XCircle,
  CheckCircle2, Clock, ShieldAlert, RefreshCw,
  Download, Users, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { labService, paymentService } from '@/services';
import { normalizePaymentStatus, PAYMENT_STATUS } from '../../../constants/paymentStatus';
import PageLoader from '../../../components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatDateCompact } from '../../../utils/format';

/* ── Status config ───────────────────────────────────────────── */
const STATUS = {
  new:                 { label: 'New',           cls: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  accepted:            { label: 'Confirmed',      cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  technician_assigned: { label: 'Assigned',       cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  sample_collected:    { label: 'Collected',      cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500' },
  processing:          { label: 'Processing',     cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  report_uploaded:     { label: 'Report Ready',   cls: 'bg-teal-50 text-teal-700 border-teal-200',    dot: 'bg-teal-500' },
  completed:           { label: 'Completed',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:           { label: 'Cancelled',      cls: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
  rejected:            { label: 'Rejected',       cls: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-500' },
};

const FILTER_TABS = ['all','new','accepted','technician_assigned','sample_collected','processing','completed'];
const FILTER_LABELS = { all:'All', new:'New', accepted:'Confirmed', technician_assigned:'Assigned',
  sample_collected:'Collected', processing:'Processing', completed:'Done' };

/* ── SLA Countdown ───────────────────────────────────────────── */
function SLABadge({ deadline, status }) {
  const [label, setLabel] = useState('—');
  const [color, setColor] = useState('text-slate-400');

  useEffect(() => {
    if (['completed','cancelled','rejected'].includes(status)) { setLabel('—'); return; }
    if (!deadline) { setLabel('—'); return; }
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setLabel('BREACHED'); setColor('text-red-600 font-bold animate-pulse'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (diff < 3600000)      { setLabel(`${m}m`);    setColor('text-red-500 font-bold'); }
      else if (diff < 7200000) { setLabel(`${h}h ${m}m`); setColor('text-amber-500 font-bold'); }
      else                     { setLabel(`${h}h ${m}m`); setColor('text-emerald-600 font-semibold'); }
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [deadline, status]);

  return <span className={cn('typo-micro !text-[10px] tabular-nums leading-none', color)}>{label}</span>;
}

/* ── Primary action per status ───────────────────────────────── */
function PrimaryAction({ order, onAction, onAssign, onUpload }) {
  const s = order.status;
  if (s === 'new')                 return (
    <div className="flex gap-1">
      <ActionBtn color="emerald" onClick={() => onAction(order._id, 'accepted')}>Accept</ActionBtn>
      <ActionBtn color="red"     onClick={() => onAction(order._id, 'rejected', { rejectionReason: 'too_busy' })}>Reject</ActionBtn>
    </div>
  );
  if (s === 'accepted')            return <ActionBtn color="indigo" onClick={() => onAssign(order)}>Assign Staff</ActionBtn>;
  if (s === 'technician_assigned') return <ActionBtn color="blue"   onClick={() => onAction(order._id, 'sample_collected')}>Mark Collected</ActionBtn>;
  if (s === 'sample_collected')    return <ActionBtn color="orange" onClick={() => onAction(order._id, 'processing')}>Start Processing</ActionBtn>;
  if (s === 'processing')          return <ActionBtn color="teal"   onClick={() => onUpload(order)}>Upload Report</ActionBtn>;
  if (s === 'report_uploaded')     return <ActionBtn color="slate"  onClick={() => onAction(order._id, 'completed')}>Mark Complete</ActionBtn>;
  return null;
}



/* ── Single order row (memoized) ─────────────────────────────── */


export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Modals
  const [assignModal, setAssignModal] = useState(null);
  const [uploadModal, setUploadModal] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [staff, setStaff] = useState([]);
  const [paymentConfirmModal, setPaymentConfirmModal] = useState(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [cashModal, setCashModal] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [cashProof, setCashProof] = useState(null);
  const [submittingCash, setSubmittingCash] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await labService.getOrders(activeTab === 'all' ? null : activeTab);
      setOrders(res.data);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      const res = await labService.getStaff();
      setStaff(res.data.filter(s => s.status === 'active' || s.isActive));
    } catch { /* silent */ }
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchStaff(); }, []);

  const visibleOrders = useMemo(() => {
    return orders.filter(o => 
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      o.patient?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(selected.length === visibleOrders.length ? [] : visibleOrders.map(o => o._id));
  };

  const handleAction = async (id, status, extra = {}) => {
    // If marking as collected, trigger custom modal instead of prompt
    if (normalizePaymentStatus(extra.paymentStatus) === PAYMENT_STATUS.COLLECTED && !extra.isAmountVerified) {
      setPaymentConfirmModal(id);
      setConfirmAmount('');
      return;
    }

    try {
      const payload = {};
      if (status) payload.status = status;
      if (extra.paymentStatus) payload.paymentStatus = extra.paymentStatus;
      if (extra.staffId) payload.staffId = extra.staffId;
      if (extra.rejectionReason) payload.rejectionReason = extra.rejectionReason;

      await labService.updateOrderStatus(id, payload);
      toast.success(normalizePaymentStatus(extra.paymentStatus) === PAYMENT_STATUS.COLLECTED ? 'Payment marked as collected' : `Order ${status.replace('_', ' ')}`);
      fetchOrders(true);
      if (assignModal) setAssignModal(null);
      if (uploadModal) setUploadModal(null);
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Action failed'); 
    }
  };

  const handleBulkAccept = async () => {
    const toAccept = orders.filter(o => selected.includes(o._id) && o.status === 'new');
    if (!toAccept.length) return toast.error('No new orders selected');
    
    setRefreshing(true);
    try {
      await Promise.all(toAccept.map(o => labService.updateOrderStatus(o._id, { status: 'accepted' })));
      toast.success(`${toAccept.length} orders accepted`);
      setSelected([]);
      fetchOrders(true);
    } catch { toast.error('Bulk action failed'); }
  };

  const handleReportUpload = async () => {
    if (!selectedFile || !uploadModal) return toast.error('Please select a report file');
    
    const formData = new FormData();
    formData.append('report', selectedFile);
    
    setUploading(true);
    try {
      // Block unpaid CASH orders from uploading reports
      if (uploadModal.paymentMethod === 'cod' && normalizePaymentStatus(uploadModal.paymentStatus) !== PAYMENT_STATUS.COLLECTED) {
        return toast.error('Cash payment must be collected before uploading report.');
      }
      await labService.uploadReport(uploadModal._id, formData);
      toast.success('Report uploaded successfully');
      setUploadModal(null);
      setSelectedFile(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmPayment = async () => {
    const order = orders.find(o => o._id === paymentConfirmModal);
    if (!order) return;

    if (Number(confirmAmount) !== order.totalAmount) {
      return toast.error(`Amount mismatch! Expected ₹${order.totalAmount}.`);
    }

    await handleAction(order._id, null, { paymentStatus: 'collected', isAmountVerified: true });
    setPaymentConfirmModal(null);
  };

  const openCashModal = (order) => {
    setCashModal(order);
    setCashAmount(order.totalAmount || '');
    setCashNote('');
    setCashProof(null);
  };

  const submitCashCollection = async () => {
    if (!cashModal) return;
    setSubmittingCash(true);
    try {
      // If proof file provided, send multipart form
      if (cashProof) {
        const fd = new FormData();
        fd.append('amountCollected', cashAmount);
        fd.append('note', cashNote);
        fd.append('proofUrl', cashProof);
        await paymentService.markCashCollectedBooking(cashModal._id, fd);
      } else {
        await paymentService.markCashCollectedBooking(cashModal._id, { amountCollected: cashAmount, note: cashNote });
      }
      toast.success('Payment marked as collected');
      setCashModal(null);
      fetchOrders(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark collected');
    } finally {
      setSubmittingCash(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-10 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Operations Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Management</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button 
              onClick={handleBulkAccept}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              Bulk Accept ({selected.length})
            </button>
          )}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── TABS & SEARCH ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              {FILTER_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="relative group min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input
            type="text"
            placeholder="Search Patient, Order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 items-center gap-4">
          <div className="col-span-1 flex items-center justify-center">
            <input
              type="checkbox"
              checked={selected.length === visibleOrders.length && visibleOrders.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          <div className="col-span-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</div>
          <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient / Tests</div>
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</div>
          <div className="col-span-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay</div>
          <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
        </div>

        <div className="divide-y divide-slate-50">
          {visibleOrders.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                <Filter size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase">No orders found</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Try adjusting your filters or search</p>
            </div>
          ) : (
            visibleOrders.map(o => (
              <OrderRow
                key={o._id}
                order={o}
                selected={selected.includes(o._id)}
                onToggle={toggleSelect}
                onAction={handleAction}
                onAssign={setAssignModal}
                onCollect={openCashModal}
                onUpload={setUploadModal}
              />
            ))
          )}
        </div>

        {/* Table Footer */}
        <div className="px-8 py-4 bg-slate-50/30 flex items-center justify-between border-t border-slate-100">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Total {visibleOrders.length} orders in view
           </p>
           {selected.length > 0 && (
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selected.length} Selected</p>
             </div>
           )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {assignModal && (
        <ModalShell title="Assign Staff" onClose={() => setAssignModal(null)}>
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Context</p>
               <h4 className="text-lg font-black text-slate-900">#{assignModal._id.slice(-8).toUpperCase()}</h4>
               <p className="text-xs font-bold text-slate-500 mt-0.5">{assignModal.patient?.name} • {assignModal.tests?.length} Tests</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Staff</p>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {staff.map(s => (
                  <button
                    key={s._id}
                    onClick={() => handleAction(assignModal._id, 'technician_assigned', { staffId: s._id })}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-lg border border-indigo-100/50 group-hover:scale-105 transition-transform">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 leading-tight mb-0.5">{s.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.role || 'Staff'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                      <Users size={16} />
                    </div>
                  </button>
                ))}
                {staff.length === 0 && (
                  <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active staff found</p>
                    <Link to="/dashboard/partner/lab/staff" className="text-[10px] font-black text-indigo-600 mt-3 block uppercase tracking-widest hover:underline">Go to Staff Management →</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {uploadModal && (
        <ModalShell title="Upload Report" onClose={() => { setUploadModal(null); setSelectedFile(null); }}>
           <div className="space-y-6">
              <div className="bg-indigo-50 p-5 rounded-[1.5rem] border border-indigo-100/50 flex items-start gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <ShieldAlert size={20} />
                 </div>
                 <div>
                    <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Audit Notice</p>
                    <p className="text-[10px] text-indigo-600/80 font-medium leading-relaxed">
                      Reports must be in PDF format. A clinical watermark "Powered by Rivo" will be added automatically.
                    </p>
                 </div>
              </div>

              {/* Payment Status Check */}
              <div className={cn(
                "p-5 rounded-[1.5rem] border flex items-center justify-between gap-4 transition-all",
                  (normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED) || uploadModal.paymentMethod !== 'cod'
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-amber-50 border-amber-100"
              )}>
                 <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                      (normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED) || uploadModal.paymentMethod !== 'cod'
                        ? "bg-white text-emerald-600"
                        : "bg-white text-amber-500"
                    )}>
                       {(normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED) || uploadModal.paymentMethod !== 'cod' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                       <p className={cn(
                         "text-[10px] font-black uppercase tracking-widest mb-0.5",
                         (normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED) || uploadModal.paymentMethod !== 'cod' ? "text-emerald-700" : "text-amber-700"
                       )}>
                         Payment Status
                       </p>
                       <p className={cn(
                         "text-xs font-black",
                         (normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED) || uploadModal.paymentMethod !== 'cod' ? "text-emerald-600" : "text-amber-600"
                       )}>
                         {uploadModal.paymentMethod === 'cod' 
                          ? (normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED ? 'Collected' : 'Pending Collection')
                           : 'Prepaid Order'
                         }
                       </p>
                    </div>
                 </div>
                    {uploadModal.paymentMethod === 'cod' && normalizePaymentStatus(uploadModal.paymentStatus) !== PAYMENT_STATUS.COLLECTED && (
                    <button 
                      onClick={() => handleAction(uploadModal._id, null, { paymentStatus: 'collected' })}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm"
                    >
                       Mark Paid
                    </button>
                 )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-[2rem] py-12 flex flex-col items-center justify-center transition-all cursor-pointer group",
                  selectedFile 
                    ? "border-emerald-200 bg-emerald-50/30" 
                    : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                )}
              >
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
                    selectedFile ? "bg-emerald-500 text-white" : "bg-white text-indigo-600"
                  )}>
                    {selectedFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                  </div>
                  
                  {selectedFile ? (
                    <div className="text-center px-6">
                      <h4 className="text-sm font-black text-slate-900 truncate max-w-[200px] mb-1">{selectedFile.name}</h4>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ready to upload • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Select PDF Report</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Maximum file size: 5MB</p>
                    </>
                  )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setUploadModal(null); setSelectedFile(null); }}
                  className="flex-1 px-8 py-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-black hover:bg-slate-100 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReportUpload}
                  disabled={!selectedFile || uploading || (uploadModal.paymentMethod === 'cod' && normalizePaymentStatus(uploadModal.paymentStatus) !== PAYMENT_STATUS.COLLECTED)}
                  className={cn(
                    "flex-[2] px-8 py-3 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                    selectedFile && !uploading && (uploadModal.paymentMethod !== 'cod' || normalizePaymentStatus(uploadModal.paymentStatus) === PAYMENT_STATUS.COLLECTED)
                      ? "bg-slate-900 text-white shadow-slate-900/10 hover:scale-[1.02]" 
                      : "bg-slate-100 text-slate-300 shadow-none cursor-not-allowed"
                  )}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : 'Upload Report'}
                </button>
              </div>
           </div>
        </ModalShell>
      )}

      {/* Cash Collection Modal */}
      {cashModal && (
        <ModalShell title={`Mark Cash Collected — #${cashModal._id.slice(-8).toUpperCase()}`} onClose={() => setCashModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase">Amount Collected</label>
              <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-full mt-2 p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase">Notes (optional)</label>
              <textarea value={cashNote} onChange={e => setCashNote(e.target.value)} className="w-full mt-2 p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase">Proof (optional)</label>
              <input type="file" onChange={e => setCashProof(e.target.files[0])} className="mt-2" />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setCashModal(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={submitCashCollection} disabled={submittingCash} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">{submittingCash ? 'Submitting...' : 'Mark Collected'}</button>
            </div>
          </div>
        </ModalShell>
      )}

      {paymentConfirmModal && (
        <ModalShell title="Confirm Collection" onClose={() => setPaymentConfirmModal(null)}>
          <div className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 text-center">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Verify Amount</p>
              <h4 className="text-2xl font-black text-amber-900">₹{orders.find(o => o._id === paymentConfirmModal)?.totalAmount}</h4>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter Collected Amount</label>
               <input 
                 type="number"
                 placeholder="₹ 0.00"
                 value={confirmAmount}
                 onChange={(e) => setConfirmAmount(e.target.value)}
                 className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-lg font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-200"
                 autoFocus
               />
            </div>

            <button 
              onClick={handleConfirmPayment}
              disabled={!confirmAmount}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Mark Paid
            </button>
          </div>
        </ModalShell>
      )}

    </div>
  );
}

/* ── OrderRow Redesign ── */
const OrderRow = memo(function OrderRow({ order, selected, onToggle, onAction, onAssign, onUpload, onCollect }) {
  const s = STATUS[order.status] || STATUS.cancelled;
  const isUrgent = order.isUrgent;

  return (
    <div className={cn(
      'grid grid-cols-12 items-center gap-4 py-4 px-6 hover:bg-slate-50/80 transition-all group',
      selected && 'bg-indigo-50/30',
      isUrgent && order.status !== 'completed' && 'bg-red-50/40'
    )}>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(order._id)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      
      <div className="col-span-1 text-center">
        <SLABadge deadline={order.slaDeadline} status={order.status} />
      </div>

      <div className="col-span-2">
        <p className="text-sm font-black text-slate-900 mb-0.5 tracking-tight">#{order._id.slice(-8).toUpperCase()}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDateCompact(order.createdAt)}</p>
      </div>

      <div className="col-span-3 min-w-0">
        <p className="text-sm font-black text-slate-900 truncate mb-0.5">{order.patient?.name || 'N/A'}</p>
        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{order.tests?.map(t => t.name).join(', ')}</p>
      </div>

      <div className="col-span-2 flex justify-center">
         <span className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm', s.cls)}>
           {s.label}
         </span>
      </div>

      <div className="col-span-1 flex justify-center">
          {normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.COLLECTED ? (
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 size={14} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm animate-pulse">
            <Clock size={14} />
          </div>
        )}
      </div>

        <div className="col-span-2 flex justify-end">
        <div className="flex items-center gap-2">
          <PrimaryAction order={order} onAction={onAction} onAssign={onAssign} onUpload={onUpload} />
          {/* Cash collection button for COD orders */}
          {order.paymentMethod === 'cod' && normalizePaymentStatus(order.paymentStatus) !== PAYMENT_STATUS.COLLECTED && (
            <button onClick={() => onCollect && onCollect(order)} className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-emerald-600 text-white">Mark Cash</button>
          )}
          <a href={`/api/invoices/${order._id}/download`} className={cn('px-3 py-1.5 rounded-lg text-[11px] font-black border', normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.COLLECTED || normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.PAID ? 'border-slate-200' : 'opacity-50 pointer-events-none')}>
            Invoice
          </a>
        </div>
      </div>
    </div>
  );
});

/* ── ActionBtn Redesign ── */
function ActionBtn({ color, onClick, children }) {
  const cls = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200',
    red:     'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-none',
    indigo:  'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
    blue:    'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
    orange:  'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
    teal:    'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200',
    slate:   'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200',
  }[color] || 'bg-slate-100 text-slate-700 shadow-none';

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-md',
        cls
      )}
    >
      {children}
    </button>
  );
}

/* ── ModalShell Redesign ── */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
       <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border border-white/20">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
             <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
             <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center">
                <XCircle size={24} />
             </button>
          </div>
          <div className="p-8">
            {children}
          </div>
       </div>
    </div>
  );
}

