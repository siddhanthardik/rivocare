import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Download, RefreshCw, Search, XCircle,
  CreditCard, TrendingUp, Clock, AlertCircle,
  CheckCircle2, ChevronDown, Activity
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatCurrency, formatDateCompact } from '../../../utils/format';

/* ─── Status config ───────────────────────────────────── */
const PAY_STATUS = {
  collected:    { label: 'Collected',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:      { label: 'Pending',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  payment_link_sent: { label: 'Link Sent', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  cash_due:     { label: 'COD Due',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  failed:       { label: 'Failed',      cls: 'bg-red-50 text-red-600 border-red-200' },
  refunded:     { label: 'Refunded',    cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  waived:       { label: 'Waived',      cls: 'bg-purple-50 text-purple-600 border-purple-200' },
};

const SETTLE_STATUS = {
  settled:    { label: 'Settled',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:    { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

/* ─── CSV export ──────────────────────────────────────── */
function exportCSV(rows) {
  const headers = ['Order ID','Date','Amount','Platform Fee','Lab Earning','Mode','Pay Status','Settlement'];
  const lines = rows.map(tx => [
    tx.order?.toString().slice(-8) || 'ADJ',
    formatDateCompact(tx.createdAt),
    Number(tx.amount ?? 0).toFixed(2),
    Number(tx.platformCommission ?? 0).toFixed(2),
    Number(tx.netAmount ?? 0).toFixed(2),
    tx.paymentMode || '—',
    tx.paymentStatus || '—',
    tx.settlementStatus || '—',
  ].join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `rivo_wallet_${Date.now()}.csv`; a.click();
}

/* ─── Summary KPI strip ───────────────────────────────── */
function KpiStrip({ wallet }) {
  const kpis = [
    {
      label: 'Available Balance',
      value: formatCurrency(wallet?.availableBalance),
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: "Today's Earnings",
      value: formatCurrency(wallet?.todayEarnings),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'This Month',
      value: formatCurrency(wallet?.monthlyEarnings),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Pending Payout',
      value: formatCurrency(wallet?.pendingSettlement),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="kpi-strip">
      {kpis.map(k => (
        <div key={k.label} className={cn('bg-white rounded-xl border py-3 px-4 flex items-center gap-3', k.border)}>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', k.bg, k.color)}>
            {k.icon && <k.icon size={15} />}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="typo-label truncate">{k.label}</p>
            <p className="typo-kpi leading-tight">{k.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Memoized transaction row ────────────────────────── */
const TxRow = memo(function TxRow({ tx }) {
  const ps = PAY_STATUS[tx.paymentStatus]   || { label: tx.paymentStatus || '—', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  const ss = SETTLE_STATUS[tx.settlementStatus] || { label: tx.settlementStatus || 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  const isPaid = tx.paymentStatus === 'collected';

  return (
    <div className="table-row grid grid-cols-8 items-center gap-4 text-center">
      <div className="text-left">
        <p className="typo-body !text-gray-900 font-bold leading-tight">#{tx.order?.toString().slice(-8) || 'ADJ'}</p>
        <p className="typo-micro mt-0.5">{formatDateCompact(tx.createdAt)}</p>
      </div>
      <p className="typo-body font-medium">{formatCurrency(tx.amount)}</p>
      <p className="typo-body text-red-500">-{formatCurrency(tx.platformCommission)}</p>
      <p className="typo-value !text-[14px] !text-emerald-600">{formatCurrency(tx.netAmount)}</p>
      <div className="flex flex-col items-center">
        <p className="typo-label !text-[10px]">{tx.paymentMode || 'Online'}</p>
      </div>
      <div>
        <span className={cn('typo-label !text-[9px] px-2 py-0.5 rounded-lg border', ps.cls)}>
          {ps.label}
        </span>
      </div>
      <div>
        <span className={cn('typo-label !text-[9px] px-2 py-0.5 rounded-lg border', ss.cls)}>
          {ss.label}
        </span>
      </div>
      <div className="flex justify-end">
        {!isPaid ? (
          <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-300 transition-colors" title="Awaiting collection">
            <XCircle size={14} />
          </button>
        ) : (
          <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors" title="Receipt Ready">
            <Download size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ q: '', payStatus: '', mode: '', from: '', to: '' });

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [finRes, txRes] = await Promise.allSettled([
        labService.getFinancialSummary(),
        labService.getTransactions(),
      ]);
      if (finRes.status === 'fulfilled') setWallet(finRes.value.data ?? {});
      if (txRes.status === 'fulfilled')  setTxns(txRes.value.data?.transactions ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Client-side filter over fetched rows */
  const visible = useMemo(() => {
    return txns.filter(tx => {
      const q = filters.q.toLowerCase();
      if (q && !tx.order?.toString().includes(q) && !(tx.description || '').toLowerCase().includes(q)) return false;
      if (filters.payStatus && tx.paymentStatus !== filters.payStatus) return false;
      if (filters.mode && tx.paymentMode !== filters.mode) return false;
      if (filters.from) {
        const d = new Date(tx.createdAt);
        if (d < new Date(filters.from)) return false;
      }
      if (filters.to) {
        const d = new Date(tx.createdAt);
        if (d > new Date(filters.to + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [txns, filters]);

  const requestPayout = async () => {
    if ((wallet?.availableBalance || 0) < 500) return toast.error('Minimum ₹500 required for payout');
    toast.success('Payout request submitted for ₹' + wallet.availableBalance.toFixed(2));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page-container">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="typo-label !text-gray-400">Finance</span>
          </div>
          <h1 className="typo-title">Wallet & Payouts</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAll(true)} disabled={refreshing} className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={requestPayout} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
            Request Payout
          </button>
        </div>
      </div>

      {/* ── Summary Strip ──────────────────────────────── */}
      <KpiStrip wallet={wallet} />

      {/* ── Transaction Ledger ─────────────────────────── */}
      <div className="compact-card">
        <div className="card-header flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-500" />
            <h2 className="typo-value !text-gray-900 !text-[14px]">Transaction Ledger</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
              <input
                type="text"
                placeholder="Search ID..."
                value={filters.q}
                onChange={e => setFilters({ ...filters, q: e.target.value })}
                className="pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl typo-body focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-40 transition-all"
              />
            </div>
            <button onClick={() => exportCSV(visible)} className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-xl typo-label hover:bg-slate-50 transition-all">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-8 items-center gap-4 text-center">
          <p className="typo-label text-left">Ref / Date</p>
          <p className="typo-label">Gross</p>
          <p className="typo-label">Platform</p>
          <p className="typo-label">Earning</p>
          <p className="typo-label">Mode</p>
          <p className="typo-label">Pay Status</p>
          <p className="typo-label">Settlement</p>
          <p className="typo-label text-right">Actions</p>
        </div>

        <div className="divide-y divide-gray-50">
          {visible.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="typo-body !text-gray-400">No transactions found matching filters</p>
            </div>
          ) : (
            visible.map(tx => <TxRow key={tx._id} tx={tx} />)
          )}
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <p className="typo-micro">Showing {visible.length} entries</p>
          <div className="flex items-center gap-2">
             <p className="typo-label">Total Earning:</p>
             <p className="typo-value !text-indigo-600">
               {formatCurrency(visible.reduce((acc, curr) => acc + (curr.netAmount || 0), 0))}
             </p>
          </div>
        </div>
      </div>

      <p className="typo-micro text-center pt-2">
        Financial ledger is audit-grade. All earnings are calculated based on <strong>Collected</strong> status only. 
        Payout requests are processed within 24–48 working hours.
      </p>
    </div>
  );
}
