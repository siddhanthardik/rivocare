import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Wallet, ArrowDownCircle, Banknote, ArrowUpCircle } from 'lucide-react';
import { walletService } from '../../../services';
import { formatDateTime, formatCurrency } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

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
        setWallet(wRes.data.data.wallet);
        setTransactions(tRes.data.data.transactions);
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
  const totalEarnings = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Earnings & Wallet</h1>
          <p className="text-slate-500">Track your revenue and manage payouts.</p>
        </div>
        <Button onClick={() => setIsPayoutOpen(true)} disabled={wallet.balance <= 0} className="flex items-center gap-1.5">
          <ArrowDownCircle size={18} /> Request Payout
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card border-none bg-blue-50">
          <div className="p-3 bg-blue-500 text-white rounded-xl"><Banknote size={24} /></div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-0.5">Available Balance</p>
            <h3 className="text-4xl font-black text-slate-800">{formatCurrency(wallet.balance)}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-emerald-50">
          <div className="p-3 bg-emerald-500 text-white rounded-xl"><Wallet size={24} /></div>
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-0.5">Total Earnings (80% Cut)</p>
            <h3 className="text-3xl font-bold text-slate-800">{formatCurrency(totalEarnings)}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="section-title">Wallet Ledger</h3>
        </div>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Complete bookings to start earning your 80% cut." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      {t.type === 'CREDIT' ? (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold w-fit">
                          <ArrowUpCircle size={14} /> EARNING
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs font-bold w-fit">
                          <ArrowDownCircle size={14} /> PAYOUT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{t.description}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      <Modal
        isOpen={isPayoutOpen}
        onClose={() => !requesting && setIsPayoutOpen(false)}
        title="Request Payout"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPayoutOpen(false)} disabled={requesting}>Cancel</Button>
            <Button onClick={handleRequestPayout} loading={requesting}>Confirm Withdrawal</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <p className="text-sm text-slate-500">Available to withdraw</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(wallet.balance)}</p>
          </div>
          <Input
            label="Amount to withdraw"
            type="number"
            min="100"
            max={wallet.balance}
            placeholder="₹0.00"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Payouts are processed manually by our team within 24-48 business hours. Funds will be deposited to your registered bank account.
          </p>
        </div>
      </Modal>
    </div>
  );
}
