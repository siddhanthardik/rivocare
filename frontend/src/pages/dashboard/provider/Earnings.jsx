import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ArrowDownCircle,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Clock3,
  Landmark,
  Wallet,
} from 'lucide-react';
import { providerService, walletService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { cn, formatDateTime, formatCurrency } from '@/utils';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const initialSummary = {
  totalEarnings: 0,
  netEarnings: 0,
  platformCut: 0,
  walletBalance: 0,
  totalBookings: 0,
  trendPercentage: 0,
  lastPayoutAt: null,
  minimumPayoutThreshold: 1000,
  lastUpdatedAt: null,
  bookings: [],
};

export default function ProviderEarnings() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const loadEarnings = async () => {
      setLoading(true);
      try {
        const response = await providerService.getEarningsSummary();
        setSummary(response.data);
      } catch (error) {
        console.error('[PROVIDER_EARNINGS_LOAD_FAILED]', error);
        toast.error('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, [refresh, user?._id]);

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > summary.walletBalance) return toast.error('Insufficient balance');

    setRequesting(true);
    try {
      await walletService.requestPayout(amount);
      toast.success('Payout requested successfully');
      setPayoutAmount('');
      setIsPayoutOpen(false);
      setRefresh((current) => current + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payout request failed');
    } finally {
      setRequesting(false);
    }
  };

  const trendLabel = useMemo(() => {
    if (summary.trendPercentage > 0) return `+${summary.trendPercentage}%`;
    if (summary.trendPercentage < 0) return `${summary.trendPercentage}%`;
    return '0%';
  }, [summary.trendPercentage]);

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  if (loading || !user?._id) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-3">
        <PageLoader label="Loading earnings..." />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying identity</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              <Wallet size={14} />
              Earnings Control
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Available Balance</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{formatCurrency(summary.walletBalance)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold',
                  summary.trendPercentage >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                )}
              >
                <ArrowUpRight size={14} />
                {trendLabel} vs last month
              </span>
              <span>Last payout: {summary.lastPayoutAt ? formatDateTime(summary.lastPayoutAt) : 'No payouts yet'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <Button
              onClick={() => setIsPayoutOpen(true)}
              disabled={summary.walletBalance <= 0}
              className="rounded-xl bg-white px-5 py-3 font-bold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              Request Payout
            </Button>
            <div className="text-right text-xs text-slate-400">
              <p>Minimum payout threshold: {formatCurrency(summary.minimumPayoutThreshold)}</p>
              <p>Last updated: {summary.lastUpdatedAt ? formatDateTime(summary.lastUpdatedAt) : 'Just now'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BreakdownCard icon={Banknote} title="Total Earnings" value={formatCurrency(summary.totalEarnings)} />
        <BreakdownCard icon={Landmark} title="Platform Fee" value={formatCurrency(summary.platformCut)} />
        <BreakdownCard icon={Wallet} title="Net Earnings" value={formatCurrency(summary.netEarnings)} />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Completed Booking Credits</h3>
            <p className="text-sm text-slate-500">
              Single-source earnings ledger from completed bookings only.
            </p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {summary.totalBookings} completed bookings
          </div>
        </div>

        {summary.bookings.length === 0 ? (
          <EmptyState title="No earnings yet" description="Completed bookings will appear here once they are credited." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.bookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      #{String(booking.bookingId).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDateTime(booking.date)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600">
                      {formatCurrency(booking.amount)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Payout actions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Withdraw only when your balance crosses the minimum threshold.
            </p>
          </div>
          <Button
            onClick={() => setIsPayoutOpen(true)}
            disabled={summary.walletBalance < summary.minimumPayoutThreshold}
            className="rounded-xl bg-black px-5 py-3 font-bold text-white"
          >
            Request Payout
          </Button>
        </div>
      </section>

      <Modal
        isOpen={isPayoutOpen}
        onClose={() => !requesting && setIsPayoutOpen(false)}
        title="Request Payout"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Available to withdraw</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(summary.walletBalance)}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Amount to withdraw (₹)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="Enter payout amount"
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
            />
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-500">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Clock3 size={15} />
              Minimum payout: {formatCurrency(summary.minimumPayoutThreshold)}
            </div>
            <p className="mt-1">Payouts are processed manually within 24-48 business hours after approval.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsPayoutOpen(false)} disabled={requesting} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={requesting}
              className="flex-1 rounded-xl bg-slate-900 font-bold text-white"
            >
              {requesting ? 'Processing...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BreakdownCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon size={18} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}
