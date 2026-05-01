import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Wallet, ArrowDownCircle, Banknote, ArrowUpCircle, Clock, CheckCircle2 } from 'lucide-react';
import { walletService } from '@/services';
import { cn, formatDateTime, formatCurrency } from '@/utils';
import { PageLoader, EmptyState } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

export default function ProviderEarnings() {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  // Payout Modal State
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    Promise.all([
      walletService.getInfo(),
      walletService.getTransactions({ limit: 50 })
    ])
      .then(([wRes, tRes]) => {
        setWallet(wRes.data.wallet || { balance: 0 });
        setTransactions(tRes.data.transactions || []);
      })
      .catch((err) => toast.error('Failed to load wallet data'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (amount > wallet.balance) return toast.error('Insufficient balance');

    setRequesting(true);
    try {
      await walletService.requestPayout(amount);
      toast.success('Payout requested successfully');
      setPayoutAmount('');
      setIsPayoutOpen(false);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout request failed');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <PageLoader />;

  // Calculate total all-time earnings from credit transactions
  const totalEarnings = (transactions || [])
    .filter(t => t?.type === 'CREDIT')
    .reduce((sum, t) => sum + (t?.amount || 0), 0);

  return (
    <div className="page-container font-['Inter',_system-ui,_sans-serif]">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="typo-label !text-gray-400">Finance</span>
          </div>
          <h1 className="typo-title">Earnings & Wallet</h1>
          <p className="typo-body">Track your revenue and manage payouts.</p>
        </div>
        <Button onClick={() => setIsPayoutOpen(true)} disabled={wallet.balance <= 0} className="bg-slate-900 text-white rounded-xl px-5 py-2.5 typo-label !text-white !font-bold flex items-center gap-2 shadow-lg active:scale-95">
          <ArrowDownCircle size={16} /> Request Payout
        </Button>
      </div>

      {/* ── KPI Strip ──────────────────────────────────── */}
      <div className="kpi-strip !grid-cols-1 sm:!grid-cols-2">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5 transition-transform group-hover:scale-150 duration-700" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/10">
              <Banknote size={20} className="text-emerald-400" />
            </div>
            <p className="typo-label !text-slate-400">Available Balance</p>
            <h3 className="typo-kpi !text-white !text-[32px] mt-1">{formatCurrency(wallet.balance)}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-50 transition-transform group-hover:scale-150 duration-700" />
          <div className="relative z-10">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <p className="typo-label !text-gray-400">Total Earnings (80% Cut)</p>
            <h3 className="typo-kpi !text-gray-900 !text-[32px] mt-1">{formatCurrency(totalEarnings)}</h3>
          </div>
        </div>
      </div>

      {/* ── Wallet Ledger ─────────────────────────────── */}
      <div className="compact-card">
        <div className="card-header">
           <h3 className="typo-label !text-gray-900 !font-bold">Wallet Ledger</h3>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Complete bookings to start earning your 80% cut." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 typo-label">Date</th>
                  <th className="px-6 py-3 typo-label">Type</th>
                  <th className="px-6 py-3 typo-label">Description</th>
                  <th className="px-6 py-3 typo-label text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t._id} className="table-row group">
                    <td className="px-6 py-4 typo-body font-medium whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      {t.type === 'CREDIT' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 typo-label !text-[9px] !font-bold">
                          <ArrowUpCircle size={12} /> EARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 typo-label !text-[9px] !font-bold">
                          <ArrowDownCircle size={12} /> PAYOUT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 typo-body !text-gray-700">{t.description}</td>
                    <td className={cn("px-6 py-4 text-right typo-body font-bold", t.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900')}>
                      {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="typo-micro text-center pt-4 flex items-center justify-center gap-2">
         <Clock size={12} /> Payouts are processed manually within 24-48 business hours.
      </p>

      {/* Payout Modal */}
      <Modal
        isOpen={isPayoutOpen}
        onClose={() => !requesting && setIsPayoutOpen(false)}
        title="Request Payout"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <p className="typo-label !text-gray-400">Available to withdraw</p>
            <p className="typo-kpi !text-[28px] mt-1">{formatCurrency(wallet.balance)}</p>
          </div>
          <div className="space-y-1">
             <label className="typo-label !text-gray-400">Amount to withdraw (₹) *</label>
             <input 
               type="number"
               className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-value outline-none focus:ring-2 focus:ring-indigo-500/20"
               placeholder="₹0.00"
               value={payoutAmount}
               onChange={(e) => setPayoutAmount(e.target.value)}
             />
          </div>
          <p className="typo-micro !text-gray-400 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
            Funds will be deposited to your registered bank account. Make sure your KYC is updated.
          </p>
          <div className="flex gap-2 pt-2">
             <Button variant="ghost" onClick={() => setIsPayoutOpen(false)} disabled={requesting} className="flex-1 typo-label">Cancel</Button>
             <Button onClick={handleRequestPayout} disabled={requesting} className="flex-1 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold">
                {requesting ? 'Processing...' : 'Confirm Withdrawal'}
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
