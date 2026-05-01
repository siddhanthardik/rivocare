import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  RefreshCw, Download, Search, XCircle, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Clock, Flag, CreditCard, DollarSign,
  TrendingUp, Activity
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '@/components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '@/utils';
import { formatDate } from '@/utils/format';

/* ─── Formatters ──────────────────────────────────────── */
const fmt     = (n) => `₹${Number(n ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const today   = () => new Date().toISOString().split('T')[0];

/* ─── Status config ───────────────────────────────────── */
const STATUS = {
  settled:  { label: 'Settled',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  mismatch: { label: 'Mismatch', cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
};

const PAY_STATUS = {
  collected: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  cash_due:  { cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  failed:    { cls: 'bg-red-50 text-red-600 border-red-200' },
};

/* ─── CSV export ──────────────────────────────────────── */
function exportCSV(rows, date) {
  const headers = ['Lab Name','City','Orders','Total Collected','Platform Fee','Lab Earning','Settled','Difference','Status'];
  const lines = rows.map(r => [
    `"${r.labName}"`, r.city, r.ordersCount,
    r.totalAmount.toFixed(2), r.platformFee.toFixed(2), r.labEarning.toFixed(2),
    r.settledAmount.toFixed(2), r.difference.toFixed(2), r.status,
  ].join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reconciliation_${date}.csv`;
  a.click();
}

/* ─── Summary KPI strip ───────────────────────────────── */
function SummaryStrip({ s }) {
  const kpis = [
    { label: 'Orders',          value: s.totalOrders,      icon: Activity,   color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', raw: true },
    { label: 'Total Collected', value: fmt(s.totalCollected), icon: CreditCard, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
    { label: 'Platform Revenue',value: fmt(s.platformRevenue),icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Lab Payout',      value: fmt(s.totalLabPayout), icon: DollarSign, color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-100'},
    { label: 'Mismatch',        value: fmt(s.totalMismatch),  icon: AlertCircle,color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-100'    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map(k => (
        <div key={k.label} className={cn('bg-white rounded-xl border p-4 flex items-center gap-3', k.border)}>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', k.bg, k.color)}>
            <k.icon size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{k.label}</p>
            <p className="text-base font-black text-slate-900 leading-tight tabular-nums">{k.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Settle modal ────────────────────────────────────── */
function SettleModal({ lab, date, onClose, onDone }) {
  const [amount, setAmount]  = useState(lab.difference.toFixed(2));
  const [ref, setRef]        = useState('');
  const [method, setMethod]  = useState('bank_transfer');
  const [notes, setNotes]    = useState('');
  const [loading, setLoading]= useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return toast.error('Enter valid amount');
    setLoading(true);
    try {
      await labService.settleReconciliation({
        partnerId: lab.partnerId, date,
        amount: Number(amount), payoutReference: ref, payoutMethod: method, notes,
      });
      toast.success('Settlement processed');
      onDone();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Settlement failed');
    } finally { setLoading(false); }
  };

  const inp = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Mark Settlement</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{lab.labName} · {date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XCircle size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 text-xs">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collected</p><p className="font-black text-slate-900">{fmt(lab.collectedAmount)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Already Settled</p><p className="font-black text-slate-900">{fmt(lab.settledAmount)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lab Earning</p><p className="font-black text-emerald-600">{fmt(lab.labEarning)}</p></div>
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remaining</p><p className={cn('font-black', lab.difference > 0 ? 'text-amber-600' : 'text-red-600')}>{fmt(lab.difference)}</p></div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount to Settle (₹) *</label>
            <input required className={inp} type="number" step="0.01" min="0.01" max={lab.difference} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payout Reference</label>
            <input className={inp} value={ref} onChange={e => setRef(e.target.value)} placeholder="UTR / Transaction ID" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</label>
            <select className={inp} value={method} onChange={e => setMethod(e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
            <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black disabled:opacity-50">
              {loading ? 'Processing…' : 'Confirm Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Order breakdown modal ───────────────────────────── */
function OrdersModal({ lab, date, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    labService.getReconciliationOrders({ partnerId: lab.partnerId, date })
      .then(r => setOrders(r.data?.data ?? []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [lab.partnerId, date]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Order Breakdown</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{lab.labName} · {date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XCircle size={16} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw size={20} className="animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="grid gap-0 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest"
              style={{ gridTemplateColumns: '100px 1fr 80px 80px 80px 80px 80px' }}>
              <span>Order ID</span><span>Patient</span><span>Amount</span><span>Platform</span><span>Earning</span><span>Mode</span><span>Status</span>
            </div>
            {orders.map((o, i) => {
              const ps = PAY_STATUS[o.paymentStatus] || PAY_STATUS.pending;
              return (
                <div key={i} className="grid items-center gap-2 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 text-xs"
                  style={{ gridTemplateColumns: '100px 1fr 80px 80px 80px 80px 80px' }}>
                  <span className="font-mono text-[10px] text-slate-600">#{o.orderId?.toString().slice(-7)}</span>
                  <span className="font-semibold text-slate-800 truncate">{o.patient}</span>
                  <span className="font-bold text-slate-900 tabular-nums">{fmt(o.amount)}</span>
                  <span className="text-red-500 tabular-nums">-{fmt(o.platformFee)}</span>
                  <span className="text-emerald-600 font-bold tabular-nums">+{fmt(o.labEarning)}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{o.paymentMode}</span>
                  <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded border uppercase', ps.cls)}>{o.paymentStatus}</span>
                </div>
              );
            })}
            {orders.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm font-bold">No collected orders found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Lab row ─────────────────────────────────────────── */
const LabRow = memo(function LabRow({ row, date, onRefresh }) {
  const [settleModal, setSettleModal] = useState(false);
  const [ordersModal, setOrdersModal] = useState(false);
  const [flagging,    setFlagging]    = useState(false);
  const s = STATUS[row.status] || STATUS.pending;

  const handleFlag = async () => {
    const reason = prompt('Reason for flagging:');
    if (!reason) return;
    setFlagging(true);
    try {
      await labService.flagReconciliation({ partnerId: row.partnerId, date, reason });
      toast.success('Flagged for review'); onRefresh();
    } catch { toast.error('Flag failed'); }
    finally { setFlagging(false); }
  };

  return (
    <>
      <div
        className={cn(
          'grid items-center gap-2 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50/70 transition-colors text-xs group',
          row.status === 'mismatch' && 'bg-red-50/40',
        )}
        style={{ gridTemplateColumns: '1fr 60px 85px 80px 85px 85px 80px 75px 70px 120px' }}
      >
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate leading-tight">{row.labName}</p>
          <p className="text-[10px] text-slate-400">{row.city}</p>
        </div>
        <span className="font-bold text-slate-700 text-center">{row.ordersCount}</span>
        <span className="font-bold text-slate-800 tabular-nums">{fmt(row.totalAmount)}</span>
        <span className="text-red-500 tabular-nums">-{fmt(row.platformFee)}</span>
        <span className="text-emerald-600 font-bold tabular-nums">+{fmt(row.labEarning)}</span>
        <span className="text-indigo-700 font-bold tabular-nums">{fmt(row.collectedAmount)}</span>
        <span className="font-bold tabular-nums text-slate-700">{fmt(row.settledAmount)}</span>
        <span className={cn('font-black tabular-nums', row.difference > 0.01 ? 'text-amber-600' : row.difference < -0.01 ? 'text-red-600' : 'text-emerald-600')}>
          {row.difference >= 0 ? '' : '-'}{fmt(Math.abs(row.difference))}
        </span>
        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wide', s.cls)}>{s.label}</span>
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setOrdersModal(true)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[9px] font-black uppercase text-slate-600 transition-all" title="View Orders">
            View
          </button>
          {row.status !== 'settled' && row.difference > 0.01 && (
            <button onClick={() => setSettleModal(true)} className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[9px] font-black uppercase text-white transition-all">
              Settle
            </button>
          )}
          <button onClick={handleFlag} disabled={flagging} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Flag Issue">
            <Flag size={12} />
          </button>
        </div>
      </div>

      {settleModal && <SettleModal lab={row} date={date} onClose={() => setSettleModal(false)} onDone={onRefresh} />}
      {ordersModal && <OrdersModal lab={row} date={date} onClose={() => setOrdersModal(false)} />}
    </>
  );
});

/* ─── Main page ───────────────────────────────────────── */
export default function LabReconciliation() {
  const [data,       setData]      = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [filters, setFilters] = useState({ date: today(), city: '', partnerId: '', q: '' });

  const setF = useCallback((k, v) => setFilters(f => ({ ...f, [k]: v })), []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const params = { date: filters.date };
      if (filters.city) params.city = filters.city;
      if (filters.partnerId) params.partnerId = filters.partnerId;
      const res = await labService.getReconciliation(params);
      setData(res);
    } catch (e) { toast.error('Failed to load reconciliation data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filters.date, filters.city, filters.partnerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const visible = useMemo(() => {
    if (!data?.data) return [];
    const q = filters.q.toLowerCase();
    if (!q) return data.data;
    return data.data.filter(r => r.labName.toLowerCase().includes(q) || r.city.toLowerCase().includes(q));
  }, [data, filters.q]);

  if (loading) return <PageLoader />;

  const summary = data?.summary ?? {};

  return (
    <div className="space-y-4 animate-fade-in pb-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin · Finance</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Daily Reconciliation</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Only completed orders with paymentStatus = collected are included.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => visible.length && exportCSV(visible, filters.date)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={filters.date} onChange={e => setF('date', e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 outline-none cursor-pointer" />
        <input value={filters.city} onChange={e => setF('city', e.target.value)} placeholder="City filter…"
          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium w-28 outline-none focus:border-indigo-300" />
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filters.q} onChange={e => setF('q', e.target.value)} placeholder="Search lab…"
            className="pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium w-36 outline-none focus:border-indigo-300" />
          {filters.q && <button onClick={() => setF('q', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><XCircle size={11} /></button>}
        </div>
        <span className="text-[10px] font-bold text-slate-400 ml-auto">{visible.length} labs · {formatDate(data?.date)}</span>
      </div>

      {/* KPI summary strip */}
      <SummaryStrip s={summary} />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Column headers */}
        <div className="grid items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest"
          style={{ gridTemplateColumns: '1fr 60px 85px 80px 85px 85px 80px 75px 70px 120px' }}>
          <span>Lab</span><span className="text-center">Orders</span><span>Total</span>
          <span>Plat. Fee</span><span>Earning</span><span>Collected</span>
          <span>Settled</span><span>Diff</span><span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <Activity size={18} className="text-slate-400" />
              </div>
              <p className="text-sm font-black text-slate-500">No data for {formatDate(filters.date)}</p>
              <p className="text-xs text-slate-400 mt-1">No collected orders found for this date / filters.</p>
            </div>
          ) : (
            visible.map(row => (
              <LabRow key={row.partnerId} row={row} date={filters.date} onRefresh={() => fetchData(true)} />
            ))
          )}
        </div>

        {/* Totals footer */}
        {visible.length > 0 && (
          <div className="grid items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500"
            style={{ gridTemplateColumns: '1fr 60px 85px 80px 85px 85px 80px 75px 70px 120px' }}>
            <span className="text-slate-700 uppercase tracking-widest">Totals</span>
            <span className="text-center text-slate-700">{summary.totalOrders}</span>
            <span className="tabular-nums text-slate-700">{fmt(summary.totalCollected)}</span>
            <span className="tabular-nums text-red-500">-{fmt(summary.platformRevenue)}</span>
            <span className="tabular-nums text-emerald-600">+{fmt(summary.totalLabPayout)}</span>
            <span className="tabular-nums text-indigo-700">{fmt(summary.totalCollected)}</span>
            <span /><span />
            <span className={cn('tabular-nums', summary.totalMismatch > 0 ? 'text-red-600' : 'text-slate-400')}>{fmt(summary.totalMismatch)}</span>
            <span />
          </div>
        )}
      </div>

      {/* Policy notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>
          <strong>Finance Policy:</strong> Only orders with <strong>paymentStatus = collected</strong> contribute to reconciliation.
          Platform fee is calculated server-side from the configured margin ({import.meta.env?.VITE_PLATFORM_FEE || '20'}%).
          Over-settlement is blocked by the API.
        </span>
      </div>
    </div>
  );
}
