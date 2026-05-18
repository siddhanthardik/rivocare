import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle, Clock, CheckCircle, RefreshCw,
  Timer, XCircle, Zap, User, Phone, DollarSign,
  ChevronRight, AlertOctagon
} from 'lucide-react';
import { adminService } from '../../../services';
import { PageWrapper, Card, Section, KPIChip } from '../../../components/ui/Layout';
import { PageLoader } from '../../../components/ui/Feedback';
import { formatCurrency } from '../../../utils/format';
import { cn } from '../../../utils';

// ── Helpers ──────────────────────────────────────────────────────────────────
const ageLabel = (dateStr) => {
  if (!dateStr) return '—';
  const hrs = Math.round((Date.now() - new Date(dateStr)) / 3600000);
  if (hrs < 1) return '< 1h ago';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const patientName = (b) => b.patient?.name || b.patient?.email || '—';
const providerName = (b) => b.provider?.user?.name || '—';
const providerPhone = (b) => b.provider?.user?.phone || '—';

// ── Alert Row ─────────────────────────────────────────────────────────────────
function AlertRow({ booking, type, navigate }) {
  const typeConfig = {
    expired: { color: 'border-l-red-400', badge: 'bg-red-50 text-red-600 border-red-200', label: 'EXPIRED' },
    unpaidConfirmed: { color: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'UNPAID >24H' },
    longRunning: { color: 'border-l-purple-400', badge: 'bg-purple-50 text-purple-700 border-purple-200', label: 'RUNNING >12H' },
    unpaidCompleted: { color: 'border-l-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'UNPAID >48H' },
  };
  const cfg = typeConfig[type] || typeConfig.expired;
  const age = ageLabel(booking.updatedAt || booking.createdAt);

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 bg-white border-l-4 border border-slate-100 rounded-xl hover:shadow-sm transition-all cursor-pointer group',
      cfg.color
    )} onClick={() => navigate(`/dashboard/admin/bookings`)}>
      <div className='flex items-center gap-3 min-w-0'>
        <div className='shrink-0'>
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest', cfg.badge)}>
            {cfg.label}
          </span>
        </div>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-black text-slate-800 truncate'>
              #{booking._id?.slice(-6).toUpperCase()}
            </p>
            <span className='text-slate-300'>·</span>
            <p className='text-xs font-bold text-slate-500 truncate'>{patientName(booking)}</p>
          </div>
          <div className='flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-bold flex-wrap'>
            <span className='flex items-center gap-1'>
              <User size={10} /> {providerName(booking)}
            </span>
            {booking.totalAmount && (
              <span className='flex items-center gap-1'>
                <DollarSign size={10} /> {formatCurrency(booking.collectedAmount || booking.totalAmount)}
              </span>
            )}
            <span className='flex items-center gap-1'>
              <Clock size={10} /> {age}
            </span>
            {booking.paymentMethod && (
              <span className='uppercase tracking-widest'>{booking.paymentMethod}</span>
            )}
          </div>
        </div>
      </div>
      <ChevronRight size={14} className='text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors' />
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────
function AlertSection({ title, subtitle, icon: Icon, color, bookings, type, navigate, emptyMsg }) {
  const [expanded, setExpanded] = useState(true);
  const count = bookings?.length || 0;

  return (
    <Card className='space-y-3'>
      <div
        className='flex items-center justify-between cursor-pointer'
        onClick={() => setExpanded(e => !e)}
      >
        <div className='flex items-center gap-2'>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
            <Icon size={15} className='text-white' />
          </div>
          <div>
            <p className='text-sm font-black text-slate-800'>{title}</p>
            <p className='text-[11px] text-slate-400 font-bold'>{subtitle}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {count > 0 ? (
            <span className='text-sm font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg'>{count} alert{count !== 1 ? 's' : ''}</span>
          ) : (
            <span className='text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg'>✓ Clear</span>
          )}
          <ChevronRight size={14} className={cn('text-slate-300 transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {expanded && (
        <div className='space-y-2 pt-1'>
          {count === 0 ? (
            <p className='text-xs text-slate-400 font-bold text-center py-4'>{emptyMsg}</p>
          ) : (
            bookings.slice(0, 10).map(b => (
              <AlertRow key={b._id} booking={b} type={type} navigate={navigate} />
            ))
          )}
          {count > 10 && (
            <p className='text-xs text-slate-400 font-bold text-center pt-1'>
              +{count - 10} more — use Bookings filter to view all
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StuckBookings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getStuckBookings();
      setData(res.data?.data || res.data);
      setLastRefreshed(new Date());
    } catch {
      toast.error('Failed to load operational alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const timer = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  const summary = data?.summary || {};
  const totalAlerts = summary.totalAlerts || 0;

  if (loading && !data) return <PageLoader label='Loading operational alerts...' />;

  return (
    <PageWrapper maxWidth='1200px'>
      {/* ── Header ── */}
      <Section
        title='Operational Alerts'
        subtitle='Bookings stuck in abnormal states that require admin attention'
        action={
          <div className='flex items-center gap-2'>
            {lastRefreshed && (
              <p className='text-[11px] text-slate-400 font-bold'>
                Updated {ageLabel(lastRefreshed)}
              </p>
            )}
            <button
              onClick={load}
              disabled={loading}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-black border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors'
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      {/* ── KPI Summary ── */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <KPIChip
          label='Total Alerts'
          value={totalAlerts}
          icon={AlertOctagon}
          color={totalAlerts > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={totalAlerts > 0 ? 'bg-red-50' : 'bg-emerald-50'}
        />
        <KPIChip
          label='Expired Requests'
          value={summary.expiredRequested ?? 0}
          icon={XCircle}
          color='text-red-600'
        />
        <KPIChip
          label='Unpaid Confirmed'
          value={summary.unpaidConfirmed ?? 0}
          icon={AlertTriangle}
          color='text-amber-600'
        />
        <KPIChip
          label='Long Running'
          value={summary.longRunningInProgress ?? 0}
          icon={Timer}
          color='text-purple-600'
        />
      </div>

      {totalAlerts === 0 && (
        <Card className='py-16 flex flex-col items-center gap-4 text-center'>
          <div className='w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center'>
            <CheckCircle size={26} className='text-emerald-500' />
          </div>
          <div>
            <p className='text-base font-black text-slate-900'>All Clear</p>
            <p className='text-sm text-slate-400 mt-1'>No bookings are stuck in abnormal states right now.</p>
          </div>
        </Card>
      )}

      {/* ── Alert Categories ── */}
      {totalAlerts > 0 && (
        <div className='space-y-4'>
          <AlertSection
            title='Expired Booking Requests'
            subtitle='REQUESTED state past expiry window — provider never responded'
            icon={XCircle}
            color='bg-red-500'
            bookings={data?.expiredRequested}
            type='expired'
            navigate={navigate}
            emptyMsg='No expired requests'
          />

          <AlertSection
            title='Unpaid Confirmed Bookings (>24h)'
            subtitle='CONFIRMED but payment not received for over 24 hours'
            icon={AlertTriangle}
            color='bg-amber-500'
            bookings={data?.unpaidConfirmed}
            type='unpaidConfirmed'
            navigate={navigate}
            emptyMsg='No unpaid confirmed bookings'
          />

          <AlertSection
            title='Long-Running Services (>12h)'
            subtitle='IN_PROGRESS for over 12 hours — may be stale or forgotten'
            icon={Timer}
            color='bg-purple-500'
            bookings={data?.longRunning}
            type='longRunning'
            navigate={navigate}
            emptyMsg='No long-running services'
          />

          <AlertSection
            title='Unpaid Completed Services (>48h)'
            subtitle='COMPLETED but no payment received for over 48 hours'
            icon={Zap}
            color='bg-orange-500'
            bookings={data?.unpaidCompleted}
            type='unpaidCompleted'
            navigate={navigate}
            emptyMsg='No unpaid completed services'
          />
        </div>
      )}
    </PageWrapper>
  );
}
