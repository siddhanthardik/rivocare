import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Search, FileText, Upload, XCircle,
  CheckCircle2, Clock, ShieldAlert, RefreshCw,
  Download, Users, Filter
} from 'lucide-react';
import { labService } from '@/services';
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

function ActionBtn({ color, onClick, children }) {
  const cls = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    red:     'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    indigo:  'bg-indigo-600 hover:bg-indigo-700 text-white',
    blue:    'bg-primary-600 hover:bg-primary-700 text-white',
    orange:  'bg-orange-500 hover:bg-orange-600 text-white',
    teal:    'bg-teal-600 hover:bg-teal-700 text-white',
    slate:   'bg-slate-700 hover:bg-slate-800 text-white',
  }[color] || 'bg-slate-100 text-slate-700';

  return (
    <button
      onClick={onClick}
      style={{ minHeight: 32 }}
      className={cn('px-3 rounded-lg typo-label !text-[10px] !text-white !font-bold transition-all active:scale-95 whitespace-nowrap', cls)}
    >
      {children}
    </button>
  );
}

/* ── Single order row (memoized) ─────────────────────────────── */
const OrderRow = memo(function OrderRow({ order, selected, onToggle, onAction, onAssign, onUpload }) {
  const s = STATUS[order.status] || STATUS.cancelled;
  const isUrgent = order.isUrgent;

  return (
    <div className={cn(
      'partner-table-row grid grid-cols-[30px_60px_160px_1fr_120px_120px_120px_160px] items-center gap-3',
      selected && 'bg-indigo-50/50',
      isUrgent && order.status !== 'completed' && 'bg-red-50/30'
    )}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(order._id)}
        className="w-4 h-4 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
      />
      
      <SLABadge deadline={order.slaDeadline} status={order.status} />

      <div className="min-w-0">
        <p className="typo-body !text-gray-900 font-bold truncate">#{order._id.slice(-8).toUpperCase()}</p>
        <p className="typo-micro mt-0.5">{formatDateCompact(order.createdAt)}</p>
      </div>

      <div className="min-w-0">
        <p className="typo-body !text-gray-900 font-medium truncate">{order.patient?.name || 'N/A'}</p>
        <p className="typo-micro truncate">{order.tests?.map(t => t.name).join(', ')}</p>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
          <p className="typo-body font-medium truncate">{order.assignedStaff?.name || 'Unassigned'}</p>
        </div>
      </div>

      <div className="flex justify-center">
         <span className={cn('typo-label !text-[9px] px-2 py-0.5 rounded border leading-none', s.cls)}>
           {s.label}
         </span>
      </div>

      <div className="flex justify-center">
        {order.paymentStatus === 'collected' ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
        ) : (
          <Clock size={14} className="text-amber-500" />
        )}
      </div>

      <div className="flex justify-end pr-1">
        <PrimaryAction order={order} onAction={onAction} onAssign={onAssign} onUpload={onUpload} />
      </div>
    </div>
  );
});

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
  const [staff, setStaff] = useState([]);

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
    try {
      await labService.updateOrderStatus(id, { status, ...extra });
      toast.success(`Order ${status}`);
      fetchOrders(true);
      if (assignModal) setAssignModal(null);
      if (uploadModal) setUploadModal(null);
    } catch { toast.error('Action failed'); }
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fade-in pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="typo-label !text-gray-400">Operations</span>
          </div>
          <h1 className="typo-title">Order Management</h1>
        </div>

        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button 
              onClick={handleBulkAccept}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl typo-label !text-white !font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Bulk Accept ({selected.length})
            </button>
          )}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Tabs & Search ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl typo-label transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {FILTER_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="relative group px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Patient or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl typo-body focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Table Ledger ────────────────────────────────────────── */}
      <div className="partner-card">
        {/* Table Header */}
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-[30px_60px_160px_1fr_120px_120px_120px_160px] items-center gap-3">
          <input
            type="checkbox"
            checked={selected.length === visibleOrders.length && visibleOrders.length > 0}
            onChange={selectAll}
            className="w-4 h-4 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <p className="typo-label">SLA</p>
          <p className="typo-label">Order Ref</p>
          <p className="typo-label">Patient / Tests</p>
          <p className="typo-label">Assigned Staff</p>
          <div className="text-center"><p className="typo-label">Status</p></div>
          <div className="text-center"><p className="typo-label">Payment</p></div>
          <p className="typo-label text-right">Actions</p>
        </div>

        <div className="divide-y divide-gray-50">
          {visibleOrders.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Filter size={32} className="text-slate-200" />
              </div>
              <p className="typo-body !text-gray-900 font-bold">No orders found</p>
              <p className="typo-micro mt-1">Try switching tabs or adjusting search</p>
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
                onUpload={setUploadModal}
              />
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50/30 flex items-center justify-between border-t border-gray-100">
           <p className="typo-micro">Total {visibleOrders.length} orders in view</p>
           {selected.length > 0 && <p className="typo-label !text-indigo-600 font-bold">{selected.length} Selected</p>}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {assignModal && (
        <ModalShell title="Assign Staff" onClose={() => setAssignModal(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
               <p className="typo-label">Order Details</p>
               <p className="typo-body !text-gray-900 font-bold mt-1">#{assignModal._id.slice(-8).toUpperCase()}</p>
               <p className="typo-micro">{assignModal.patient?.name} • {assignModal.tests?.length} Tests</p>
            </div>
            
            <div className="space-y-2">
              <p className="typo-label">Select Staff Member</p>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {staff.map(s => (
                  <button
                    key={s._id}
                    onClick={() => handleAction(assignModal._id, 'technician_assigned', { staffId: s._id })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Users size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="typo-body !text-gray-900 font-bold truncate">{s.name}</p>
                      <p className="typo-micro truncate">{s.role || 'Staff'}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-300 -rotate-90" />
                  </button>
                ))}
                {staff.length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="typo-body !text-gray-400">No active staff found</p>
                    <Link to="/dashboard/partner/lab/staff" className="typo-label !text-indigo-600 mt-2 block">Go to Staff Management</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {uploadModal && (
        <ModalShell title="Upload Diagnostic Report" onClose={() => setUploadModal(null)}>
           <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                 <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={14} className="text-indigo-600" />
                    <p className="typo-label !text-indigo-700">Audit Notice</p>
                 </div>
                 <p className="typo-micro !text-indigo-600">Reports must be in PDF format. A clinical watermark "Powered by Rivo" will be added automatically.</p>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={24} className="text-indigo-600" />
                  </div>
                  <p className="typo-body !text-gray-900 font-bold">Select PDF Report</p>
                  <p className="typo-micro mt-1">Maximum size 5MB</p>
                  {/* Real implementation would have input[type=file] */}
                  <button 
                    onClick={() => handleAction(uploadModal._id, 'report_uploaded', { reportUrl: 'https://cdn.rivo.care/mock-report.pdf' })}
                    className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl typo-label !text-white !font-bold"
                  >
                    Simulate Upload
                  </button>
              </div>
           </div>
        </ModalShell>
      )}

    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
       <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
             <h3 className="typo-title !text-[18px]">{title}</h3>
             <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><XCircle size={20} /></button>
          </div>
          <div className="p-6">
            {children}
          </div>
       </div>
    </div>
  );
}
