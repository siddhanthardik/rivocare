import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Search, MoreHorizontal,
  MapPin, Clock,
  Plus, Activity, Wallet
} from 'lucide-react';
import { bookingService, reviewService, walletService } from '../../../services';
import { formatDateTime, SERVICE_CONFIG, cn, formatDate } from '../../../utils';
import { formatCurrency } from '../../../utils/format';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import RateModal from '../../../components/ui/RateModal';
import { PageWrapper, Card, Row, Section, KPIChip, StatusPill } from '../../../components/ui/Layout';

export default function PatientBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refresh, setRefresh]           = useState(0);
  const [reviewedMap, setReviewedMap]   = useState({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeTab, setActiveTab]       = useState('all');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking]     = useState(null);
  const [cancelReason, setCancelReason]           = useState('');
  const [canceling, setCanceling]                 = useState(false);

  // Rate Modal
  const [rateBooking, setRateBooking]       = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Price Approval
  const [approvingId, setApprovingId] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      const res = await bookingService.getAll({ limit: 100 });
      const bks = res.data.bookings;
      setBookings(bks);

      const completedIds = bks.filter((b) => b.status === 'completed').map((b) => b._id);
      if (completedIds.length > 0) {
        const checks = await Promise.allSettled(completedIds.map((id) => reviewService.getBookingReview(id)));
        const map = {};
        completedIds.forEach((id, i) => {
          const result = checks[i];
          if (result.status === 'fulfilled' && result.value.data !== null) map[id] = true;
        });
        setReviewedMap(map);
      }
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const res = await walletService.getInfo();
      setWalletBalance(res.data.wallet.balance);
    } catch (err) {
      console.error('Failed to load wallet', err);
    }
  }, []);

  useEffect(() => { 
    loadBookings(); 
    loadWallet();
  }, [refresh, loadBookings, loadWallet]);

  const handleApprovePrice = async (bookingId) => {
    setApprovingId(bookingId);
    try {
      await bookingService.approvePrice(bookingId);
      toast.success('Price approved!');
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId
          ? { ...b, priceApprovedByPatient: true }
          : b
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return b.status === 'pending' || b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <PageWrapper>
      {/* ── Wallet KPI ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <KPIChip 
          icon={Wallet} 
          label="Wallet Balance" 
          value={formatCurrency(walletBalance)} 
          color="text-emerald-600"
          bg="bg-emerald-50/30"
        />
        <Card className="flex items-center justify-between border-transparent bg-slate-900/5 p-3">
          <div className="min-w-0">
             <p className="typo-micro font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Referral Rewards</p>
             <p className="typo-body font-black text-slate-900">Share with friends and earn cash</p>
          </div>
          <Link to="/dashboard/patient/referral">
            <button className="btn-secondary-sm !px-4 !py-2 !bg-white">Earn More</button>
          </Link>
        </Card>
      </div>

      {/* ── Tabs & Header ──────────────────────────────── */}
      <div className="space-y-3">
        <Section 
          title="Appointment History" 
          subtitle="Manage your past and future visits"
          action={
            <div className="relative group w-full md:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={12} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-8 pr-4 py-1.5 bg-white border border-gray-100 rounded-xl typo-body focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
              />
            </div>
          }
        />

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit overflow-x-auto no-scrollbar">
          {['all', 'upcoming', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg typo-label transition-all whitespace-nowrap",
                activeTab === tab ? "bg-slate-900 text-white font-black shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Bookings List ──────────────────────────────── */}
        <Card noPadding className="divide-y divide-gray-50 overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-200">
                  <Calendar size={24} />
              </div>
              <p className="typo-value font-black text-slate-900">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map(b => (
              <BookingRow 
                key={b._id} 
                booking={b} 
                isReviewed={reviewedMap[b._id]}
                onCancel={(booking) => { setSelectedBooking(booking); setIsCancelModalOpen(true); }}
                onRate={(booking) => { setRateBooking(booking); setIsRateModalOpen(true); }}
                onApprovePrice={handleApprovePrice}
                approvingId={approvingId}
              />
            ))
          )}
        </Card>
      </div>

      {/* ── Modals ─────────────────────────────────────── */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel Appointment">
        <div className="space-y-4">
            <p className="typo-body">Please let us know the reason for cancellation.</p>
            <textarea 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none h-24 focus:ring-2 focus:ring-blue-500/10"
              placeholder="Why are you cancelling?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 btn-secondary-sm !py-2.5">Close</button>
              <button 
                onClick={async () => {
                  setCanceling(true);
                  try {
                    await bookingService.cancel(selectedBooking._id, { reason: cancelReason });
                    toast.success('Appointment cancelled');
                    setIsCancelModalOpen(false);
                    setRefresh(r => r + 1);
                  } catch { toast.error('Cancellation failed'); }
                  finally { setCanceling(false); }
                }}
                disabled={canceling}
                className="flex-1 btn-primary-sm !bg-red-600 !py-2.5"
              >
                {canceling ? 'Cancelling...' : 'Confirm'}
              </button>
            </div>
        </div>
      </Modal>

      {rateBooking && (
        <RateModal 
          isOpen={isRateModalOpen} 
          onClose={() => setIsRateModalOpen(false)} 
          booking={rateBooking}
          onSuccess={() => { setRefresh(r => r + 1); setIsRateModalOpen(false); }}
        />
      )}
    </PageWrapper>
  );
}

function BookingRow({ booking: b, isReviewed, onCancel, onRate, onApprovePrice, approvingId }) {
  const service = SERVICE_CONFIG[b.service];
  
  return (
    <Row className="flex-col md:flex-row gap-3 md:items-center p-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-lg shadow-sm">
            {service?.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="typo-value !text-gray-900 truncate leading-tight">{service?.label}</h4>
            <StatusPill status={b.status} className="scale-90" />
          </div>
          <p className="typo-micro font-black text-slate-400 uppercase tracking-tighter">{b.provider?.user?.name || 'Care Expert'}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 md:px-6 py-2 md:py-0 border-y md:border-y-0 md:border-x border-gray-50">
        <div className="space-y-0.5">
           <p className="typo-micro font-black text-slate-300 uppercase">Schedule</p>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 typo-micro font-bold text-gray-700">
                 <Calendar size={12} className="text-blue-500" /> {formatDate(b.scheduledAt)}
              </div>
              <div className="flex items-center gap-1.5 typo-micro font-bold text-gray-700">
                 <Clock size={12} className="text-blue-500" /> {formatDateTime(b.scheduledAt).split('at')[1]}
              </div>
           </div>
        </div>
        <div className="space-y-0.5">
           <p className="typo-micro font-black text-slate-300 uppercase">Service Fee</p>
           <p className="typo-value !text-gray-900 leading-none">{formatCurrency(b.price)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          {b.status === 'pending' && (
            <button onClick={() => onCancel(b)} className="btn-secondary-sm !px-4 !py-2 !text-red-500 border-red-100 hover:bg-red-50">Cancel</button>
          )}
          {b.status === 'completed' && !isReviewed && (
            <button onClick={() => onRate(b)} className="btn-primary-sm !px-6 !py-2">Rate</button>
          )}
          {b.status === 'confirmed' && !b.priceApprovedByPatient && b.price > 0 && (
            <button 
              onClick={() => onApprovePrice(b._id)} 
              disabled={approvingId === b._id}
              className="btn-primary-sm !px-6 !py-2 !bg-emerald-600"
            >
              Approve Fee
            </button>
          )}
          <button className="btn-icon">
            <MoreHorizontal size={14} />
          </button>
      </div>
    </Row>
  );
}
