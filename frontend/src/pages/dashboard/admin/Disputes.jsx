import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle, RefreshCw, Clock, Phone,
  CheckCircle, MoreHorizontal, DollarSign, ShieldCheck,
  XCircle, Scale, ChevronDown, ChevronRight, User
} from 'lucide-react';
import { adminService } from '../../../services';
import { PageWrapper, Card, Section, KPIChip } from '../../../components/ui/Layout';
import { PageLoader } from '../../../components/ui/Feedback';
import { formatCurrency } from '../../../utils/format';
import { cn } from '../../../utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const ageLabel = (dateStr) => {
  if (!dateStr) return '—';
  const hrs = Math.round((Date.now() - new Date(dateStr)) / 3600000);
  if (hrs < 1) return '< 1h ago';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const RESOLUTION_LABELS = {
  APPROVE_PROVIDER: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECT_PROVIDER: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
  PARTIAL_SETTLEMENT: { label: 'Partial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ── Resolution Panel ──────────────────────────────────────────────────────────
function ResolutionPanel({ dispute, onResolved }) {
  const [mode, setMode] = useState(null); // 'approve' | 'reject' | 'partial'
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxAmount = dispute.collectedAmount || dispute.totalAmount || 0;

  const submit = async (resolutionType) => {
    if (submitting) return;

    if (resolutionType === 'PARTIAL_SETTLEMENT') {
      const amt = Number(approvedAmount);
      if (!amt || amt <= 0 || amt > maxAmount) {
        toast.error(`Enter a valid amount between ₹1 and ₹${maxAmount}`);
        return;
      }
    }

    const confirmMsg = {
      APPROVE_PROVIDER: `Approve full payment of ₹${maxAmount} to provider?`,
      REJECT_PROVIDER: 'Reject provider claim? No payout will be made.',
      PARTIAL_SETTLEMENT: `Credit ₹${approvedAmount} to provider as partial settlement?`,
    }[resolutionType];

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      await adminService.resolveDispute(dispute._id, {
        resolutionType,
        adminNotes: adminNotes.trim(),
        approvedAmount: resolutionType === 'PARTIAL_SETTLEMENT' ? Number(approvedAmount) : undefined,
      });
      toast.success(`Dispute resolved: ${RESOLUTION_LABELS[resolutionType].label}`);
      onResolved(dispute._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resolution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-3 pt-3 border-t border-slate-100'>
      {/* Admin Notes */}
      <div>
        <label className='text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1'>
          Admin Notes (optional)
        </label>
        <textarea
          className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 resize-none h-16'
          placeholder='e.g. Patient confirmed ₹400 was paid, not ₹500...'
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
      </div>

      {/* Partial Amount (only when mode=partial) */}
      {mode === 'partial' && (
        <div>
          <label className='text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1'>
            Approved Amount (max ₹{maxAmount})
          </label>
          <input
            type='number'
            min={1}
            max={maxAmount}
            className='w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20'
            placeholder={`Enter amount (max ₹${maxAmount})`}
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-2'>
        {/* Approve Provider */}
        <button
          id={`approve-dispute-${dispute._id}`}
          onClick={() => {
            if (mode === 'approve') { submit('APPROVE_PROVIDER'); } else { setMode('approve'); }
          }}
          disabled={submitting}
          className={cn(
            'flex-1 py-2 text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50',
            mode === 'approve'
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          )}
        >
          <ShieldCheck size={12} />
          {submitting && mode === 'approve' ? 'Processing...' : mode === 'approve' ? 'Confirm Approve' : 'Approve Provider'}
        </button>

        {/* Partial Settlement */}
        <button
          id={`partial-dispute-${dispute._id}`}
          onClick={() => {
            if (mode === 'partial') { submit('PARTIAL_SETTLEMENT'); } else { setMode('partial'); }
          }}
          disabled={submitting}
          className={cn(
            'flex-1 py-2 text-xs font-black rounded-xl border transition-all flex items-center justify-center gap-1.5 disabled:opacity-50',
            mode === 'partial'
              ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          )}
        >
          <Scale size={12} />
          {submitting && mode === 'partial' ? 'Processing...' : mode === 'partial' ? 'Confirm Partial' : 'Partial Settlement'}
        </button>

        {/* Reject Provider */}
        <button
          id={`reject-dispute-${dispute._id}`}
          onClick={() => {
            if (mode === 'reject') { submit('REJECT_PROVIDER'); } else { setMode('reject'); }
          }}
          disabled={submitting}
          className={cn(
            'px-3 py-2 text-xs font-black rounded-xl border transition-all flex items-center gap-1 disabled:opacity-50',
            mode === 'reject'
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
          )}
        >
          <XCircle size={12} />
          {submitting && mode === 'reject' ? '...' : mode === 'reject' ? 'Confirm Reject' : 'Reject'}
        </button>
      </div>

      {mode && (
        <button
          onClick={() => setMode(null)}
          className='text-xs text-slate-400 hover:text-slate-600 transition-colors w-full text-center'
        >
          Cancel
        </button>
      )}
    </div>
  );
}

// ── Open Dispute Card ─────────────────────────────────────────────────────────
function DisputeCard({ dispute, onResolved }) {
  const [expanded, setExpanded] = useState(true);

  const patient = dispute.patient;
  const provider = dispute.provider?.user;
  const collectedAmount = dispute.collectedAmount || dispute.totalAmount || 0;
  const expectedAmount = dispute.totalAmount || 0;
  const note = dispute.paymentCollectionNote || '';
  const disputeText = note.includes('PATIENT_DISPUTE')
    ? note.split('PATIENT_DISPUTE').pop()?.replace(/^\s*\[.*?\]:\s*/, '').trim()
    : '—';

  return (
    <Card className='space-y-0'>
      {/* Header — always visible */}
      <div
        className='flex items-center justify-between cursor-pointer pb-3'
        onClick={() => setExpanded(e => !e)}
      >
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0'>
            <AlertTriangle size={15} className='text-red-500' />
          </div>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <p className='text-sm font-black text-slate-900'>
                #{dispute._id?.slice(-6).toUpperCase()}
              </p>
              <span className='text-[10px] font-black bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded uppercase tracking-widest'>
                DISPUTED
              </span>
              {dispute.paymentMethod && (
                <span className='text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase'>
                  {dispute.paymentMethod}
                </span>
              )}
            </div>
            <p className='text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5'>
              <Clock size={9} /> {ageLabel(dispute.updatedAt)} · {patient?.name || '—'}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <p className='text-base font-black text-slate-900'>{formatCurrency(collectedAmount)}</p>
          {expanded ? <ChevronDown size={14} className='text-slate-300' /> : <ChevronRight size={14} className='text-slate-300' />}
        </div>
      </div>

      {expanded && (
        <div className='space-y-3 pt-3 border-t border-slate-100'>
          {/* Parties */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2 space-y-0.5'>
              <p className='text-[10px] font-black text-blue-400 uppercase tracking-widest'>Patient</p>
              <p className='text-xs font-black text-slate-800'>{patient?.name || '—'}</p>
              <p className='text-[11px] text-slate-500 flex items-center gap-1'>
                <Phone size={9} /> {patient?.phone || '—'}
              </p>
            </div>
            <div className='bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 space-y-0.5'>
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>Provider</p>
              <p className='text-xs font-black text-slate-800'>{provider?.name || '—'}</p>
              <p className='text-[11px] text-slate-500 flex items-center gap-1'>
                <Phone size={9} /> {provider?.phone || '—'}
              </p>
            </div>
          </div>

          {/* Dispute reason */}
          <div className='bg-amber-50 border border-amber-100 rounded-xl px-3 py-2'>
            <p className='text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1'>Patient's Report</p>
            <p className='text-xs text-amber-800 font-bold leading-relaxed'>{disputeText}</p>
          </div>

          {/* Amount comparison */}
          <div className='grid grid-cols-2 gap-2 text-center'>
            <div className='bg-slate-50 border border-slate-100 rounded-xl py-2'>
              <p className='text-[10px] font-black text-slate-400 uppercase'>Expected</p>
              <p className='text-sm font-black text-slate-800'>{formatCurrency(expectedAmount)}</p>
            </div>
            <div className='bg-amber-50 border border-amber-200 rounded-xl py-2'>
              <p className='text-[10px] font-black text-amber-500 uppercase'>Provider Claimed</p>
              <p className='text-sm font-black text-amber-700'>{formatCurrency(collectedAmount)}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className='text-[11px] text-slate-400 font-bold space-y-0.5'>
            {dispute.collectedAt && (
              <p>Cash collected: {new Date(dispute.collectedAt).toLocaleString()}</p>
            )}
            {dispute.updatedAt && (
              <p>Dispute raised: {ageLabel(dispute.updatedAt)}</p>
            )}
          </div>

          {/* Resolution actions */}
          <ResolutionPanel dispute={dispute} onResolved={onResolved} />
        </div>
      )}
    </Card>
  );
}

// ── Resolved Dispute Card ─────────────────────────────────────────────────────
function ResolvedCard({ dispute }) {
  const [expanded, setExpanded] = useState(false);
  const res = dispute.disputeResolution || {};
  const cfg = RESOLUTION_LABELS[res.resolutionType] || {};
  const patient = dispute.patient;
  const provider = dispute.provider?.user;

  return (
    <Card className='opacity-90'>
      <div
        className='flex items-center justify-between cursor-pointer'
        onClick={() => setExpanded(e => !e)}
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0'>
            <CheckCircle size={14} className='text-emerald-500' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <p className='text-sm font-black text-slate-700'>#{dispute._id?.slice(-6).toUpperCase()}</p>
              {cfg.label && (
                <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest', cfg.color)}>
                  {cfg.label}
                </span>
              )}
            </div>
            <p className='text-[11px] text-slate-400 font-bold mt-0.5'>
              {patient?.name || '—'} · Resolved {ageLabel(res.resolvedAt)}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-black text-slate-600'>
            {res.resolutionType === 'PARTIAL_SETTLEMENT'
              ? formatCurrency(res.approvedAmount || 0)
              : formatCurrency(dispute.collectedAmount || dispute.totalAmount || 0)}
          </p>
          {expanded ? <ChevronDown size={13} className='text-slate-300' /> : <ChevronRight size={13} className='text-slate-300' />}
        </div>
      </div>

      {expanded && (
        <div className='pt-3 mt-3 border-t border-slate-100 space-y-2 text-xs font-bold text-slate-600'>
          <div className='grid grid-cols-2 gap-2'>
            <span className='text-slate-400'>Patient</span><span>{patient?.name} · {patient?.phone || '—'}</span>
            <span className='text-slate-400'>Provider</span><span>{provider?.name} · {provider?.phone || '—'}</span>
            <span className='text-slate-400'>Resolution</span><span>{res.resolutionType}</span>
            <span className='text-slate-400'>Original Amount</span><span>{formatCurrency(res.originalCollectedAmount || 0)}</span>
            {res.approvedAmount != null && (
              <><span className='text-slate-400'>Approved Amount</span><span>{formatCurrency(res.approvedAmount)}</span></>
            )}
            <span className='text-slate-400'>Resolved By</span><span>{res.resolvedBy?.name || 'Admin'}</span>
            <span className='text-slate-400'>Resolved At</span><span>{res.resolvedAt ? new Date(res.resolvedAt).toLocaleString() : '—'}</span>
          </div>
          {res.adminNotes && (
            <div className='bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-500 text-[11px] mt-1'>
              {res.adminNotes}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Disputes() {
  const [tab, setTab] = useState('open');           // 'open' | 'resolved'
  const [openDisputes, setOpenDisputes] = useState([]);
  const [resolvedDisputes, setResolvedDisputes] = useState([]);
  const [openTotal, setOpenTotal] = useState(0);
  const [resolvedTotal, setResolvedTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadOpen = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getDisputes({ page: p, limit: 10 });
      const d = res.data?.data;
      // Filter to only unresolved
      const unresolved = (d?.bookings || []).filter(b => !b.disputeResolution?.disputeResolved);
      setOpenDisputes(unresolved);
      setOpenTotal(d?.total || 0);
      setTotalPages(d?.totalPages || 1);
    } catch {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResolved = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getResolvedDisputes({ page: p, limit: 10 });
      const d = res.data?.data;
      setResolvedDisputes(d?.bookings || []);
      setResolvedTotal(d?.total || 0);
      setTotalPages(d?.totalPages || 1);
    } catch {
      toast.error('Failed to load resolved disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    if (tab === 'open') loadOpen(1);
    else loadResolved(1);
  }, [tab, loadOpen, loadResolved]);

  useEffect(() => {
    if (tab === 'open') loadOpen(page);
    else loadResolved(page);
  }, [page]); // eslint-disable-line

  const handleResolved = (id) => {
    setOpenDisputes(prev => prev.filter(d => d._id !== id));
    setOpenTotal(t => Math.max(0, t - 1));
    setResolvedTotal(t => t + 1);
    // Reload resolved tab count in background
    adminService.getResolvedDisputes({ page: 1, limit: 1 }).then(res => {
      setResolvedTotal(res.data?.data?.total || 0);
    }).catch(() => {});
  };

  const refresh = () => {
    setPage(1);
    if (tab === 'open') loadOpen(1);
    else loadResolved(1);
  };

  const displayList = tab === 'open' ? openDisputes : resolvedDisputes;

  return (
    <PageWrapper maxWidth='1200px'>
      <Section
        title='COD Disputes'
        subtitle='Patient-reported cash payment issues — review and resolve each dispute'
        action={
          <button
            onClick={refresh}
            disabled={loading}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors'
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* KPI Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <KPIChip
          label='Open Disputes'
          value={openTotal}
          icon={AlertTriangle}
          color={openTotal > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={openTotal > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        />
        <KPIChip
          label='Resolved'
          value={resolvedTotal}
          icon={CheckCircle}
          color='text-emerald-600'
          bg='bg-emerald-50'
        />
        <KPIChip
          label='Pending Payout'
          value={openTotal}
          icon={DollarSign}
          color={openTotal > 0 ? 'text-amber-600' : 'text-slate-400'}
        />
        <KPIChip
          label='Current Tab'
          value={tab === 'open' ? 'Open' : 'Resolved'}
          icon={MoreHorizontal}
        />
      </div>

      {/* Tabs */}
      <div className='flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm w-fit'>
        {[
          { key: 'open', label: 'Open Disputes', count: openTotal, alert: openTotal > 0 },
          { key: 'resolved', label: 'Resolved', count: resolvedTotal },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative px-4 py-1.5 text-xs font-black rounded-lg transition-all whitespace-nowrap',
              tab === t.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black',
                tab === t.key
                  ? 'bg-white/20 text-white'
                  : t.alert ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && displayList.length === 0 ? (
        <PageLoader label={`Loading ${tab} disputes...`} />
      ) : displayList.length === 0 ? (
        <Card className='py-16 flex flex-col items-center gap-4 text-center'>
          <div className='w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center'>
            <CheckCircle size={26} className='text-emerald-500' />
          </div>
          <div>
            <p className='text-base font-black text-slate-900'>
              {tab === 'open' ? 'No Open Disputes' : 'No Resolved Disputes Yet'}
            </p>
            <p className='text-sm text-slate-400 mt-1'>
              {tab === 'open'
                ? 'All COD payments confirmed. No disputes pending resolution.'
                : 'Resolved disputes will appear here after admin action.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {tab === 'open'
            ? openDisputes.map(d => <DisputeCard key={d._id} dispute={d} onResolved={handleResolved} />)
            : resolvedDisputes.map(d => <ResolvedCard key={d._id} dispute={d} />)
          }
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between pt-2 border-t border-slate-100'>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='px-4 py-2 text-xs font-black border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors'
          >← Prev</button>
          <p className='text-xs font-black text-slate-400'>Page {page} of {totalPages}</p>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className='px-4 py-2 text-xs font-black border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors'
          >Next →</button>
        </div>
      )}
    </PageWrapper>
  );
}
