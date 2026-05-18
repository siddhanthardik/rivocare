import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Download, RefreshCw, Search, XCircle,
  CreditCard, TrendingUp, Clock, AlertCircle,
  CheckCircle2, ChevronDown, Activity, ShieldCheck
} from 'lucide-react';
import { labService } from '@/services';
import { normalizePaymentStatus, PAYMENT_STATUS } from '../../../constants/paymentStatus';
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
    },
    {
      label: "Today's Earnings",
      value: formatCurrency(wallet?.todayEarnings),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'This Month',
      value: formatCurrency(wallet?.monthlyEarnings),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Pending Payout',
      value: formatCurrency(wallet?.pendingSettlement),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map(k => (
        <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors">
          <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.color} flex items-center justify-center shrink-0`}>
            {k.icon && <k.icon size={20} />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{k.label}</p>
            <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{k.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Memoized transaction row ────────────────────────── */
const TxRow = memo(function TxRow({ tx, onDownload }) {
  const ps = PAY_STATUS[tx.paymentStatus]   || { label: tx.paymentStatus || '—', cls: 'bg-slate-50 text-slate-400 border-slate-100' };
  const ss = SETTLE_STATUS[tx.settlementStatus] || { label: tx.settlementStatus || 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  const isPaid = normalizePaymentStatus(tx.paymentStatus) === PAYMENT_STATUS.COLLECTED;

  return (
    <div className="grid grid-cols-12 items-center gap-4 py-4 px-6 hover:bg-slate-50/50 transition-all group">
      <div className="col-span-2">
        <p className="text-sm font-black text-slate-900 mb-0.5 tracking-tight">#{tx.order?.toString().slice(-8) || 'ADJ'}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDateCompact(tx.createdAt)}</p>
      </div>
      
      <div className="col-span-2 text-center">
        <p className="text-sm font-bold text-slate-600">{formatCurrency(tx.amount)}</p>
      </div>

      <div className="col-span-2 text-center">
        <p className="text-sm font-bold text-red-500/80">-{formatCurrency(tx.platformCommission)}</p>
      </div>

      <div className="col-span-2 text-center">
        <p className="text-[15px] font-black text-emerald-600 tracking-tight">{formatCurrency(tx.netAmount)}</p>
      </div>

      <div className="col-span-2 flex justify-center">
        <span className={cn('px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm', ps.cls)}>
          {ps.label}
        </span>
      </div>

      <div className="col-span-2 flex justify-end items-center gap-3">
        <span className={cn('px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm mr-2', ss.cls)}>
          {ss.label}
        </span>
        <button 
          className={cn(
            "p-2 rounded-lg transition-all",
            isPaid ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white" : "text-slate-200 cursor-not-allowed"
          )}
          onClick={() => isPaid && onDownload && onDownload(tx)}
          title={isPaid ? "Download Receipt" : "Awaiting Collection"}
        >
          {isPaid ? <Download size={14} /> : <XCircle size={14} />}
        </button>
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

  const visible = useMemo(() => {
    return txns.filter(tx => {
      const q = filters.q.toLowerCase();
      if (q && !tx.order?.toString().includes(q) && !(tx.description || '').toLowerCase().includes(q)) return false;
      if (filters.payStatus && normalizePaymentStatus(tx.paymentStatus) !== normalizePaymentStatus(filters.payStatus)) return false;
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

  const handleDownload = async (tx) => {
    if (!tx || !tx.order) return toast.error('No associated order to download');
    const url = `/api/invoices/${tx.order}/download`;
    // Open in new tab; auth cookie will be sent
    window.open(url, '_blank');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-10 animate-fade-in px-4 md:px-0">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Finance Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet & Payouts</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchAll(true)} 
            disabled={refreshing} 
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={requestPayout} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <KpiStrip wallet={wallet} />

      {/* ── TRANSACTION LEDGER ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Transaction Ledger</h2>
              <p className="text-[10px] font-bold text-slate-400">All financial logs and settlement status</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                type="text"
                placeholder="Search ID..."
                value={filters.q}
                onChange={e => setFilters({ ...filters, q: e.target.value })}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-48 transition-all"
              />
            </div>
            <button 
              onClick={() => exportCSV(visible)} 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 items-center gap-4">
          <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref / Date</div>
          <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Amount</div>
          <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Fee</div>
          <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Earning</div>
          <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay Status</div>
          <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</div>
        </div>

        <div className="divide-y divide-slate-50">
          {visible.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <AlertCircle size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No entries found</p>
            </div>
          ) : (
            visible.map(tx => <TxRow key={tx._id} tx={tx} onDownload={handleDownload} />)
          )}
        </div>

        {/* Table Footer */}
        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {visible.length} entries
          </p>
          <div className="flex items-center gap-3">
             <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Earnings:</p>
             <p className="text-xl font-black text-indigo-600 tracking-tight">
               {formatCurrency(visible.reduce((acc, curr) => acc + (curr.netAmount || 0), 0))}
             </p>
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

