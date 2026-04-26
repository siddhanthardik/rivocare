import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Search, Filter, MoreHorizontal, ChevronRight, 
  MapPin, Clock, Star, IndianRupee,
  AlertCircle, ThumbsUp, ThumbsDown, ShieldCheck, 
  UserCheck, MessageCircle, HelpCircle, X, Plus,
  CheckCircle2, Activity
} from 'lucide-react';
import { bookingService, reviewService, paymentService, walletService } from '../../../services';
import { formatDateTime, SERVICE_CONFIG, cn, formatDate } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import RateModal from '../../../components/ui/RateModal';
import useRazorpay from '../../../hooks/useRazorpay';

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

  // Payment
  const isRazorpayLoaded = useRazorpay();
  const [processingPayment, setProcessingPayment] = useState(null);

  // Rate Modal
  const [rateBooking, setRateBooking]       = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Price Approval
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      const res = await bookingService.getAll({ limit: 100 });
      const bks = res.data.data.bookings;
      setBookings(bks);

      const completedIds = bks.filter((b) => b.status === 'completed').map((b) => b._id);
      if (completedIds.length > 0) {
        const checks = await Promise.allSettled(completedIds.map((id) => reviewService.getBookingReview(id)));
        const map = {};
        completedIds.forEach((id, i) => {
          const result = checks[i];
          if (result.status === 'fulfilled' && result.value.data.data !== null) map[id] = true;
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
      setWalletBalance(res.data.data.wallet.balance);
    } catch (err) {
      console.error('Failed to load wallet', err);
    }
  }, []);

  useEffect(() => { 
    loadBookings(); 
    loadWallet();
  }, [refresh, loadBookings, loadWallet]);

  // ── Approve price ──────────────────────────────────────────────
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

  // ── Reject price ───────────────────────────────────────────────
  const handleRejectPrice = async (bookingId) => {
    setRejectingId(bookingId);
    try {
      await bookingService.rejectPrice(bookingId);
      toast.success('Price rejected.');
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setRejectingId(null);
    }
  };

  // ── Cancel booking ─────────────────────────────────────────────
  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a reason');
    setCanceling(true);
    try {
      await bookingService.updateStatus(selectedBooking._id, { status: 'cancelled', cancelReason });
      toast.success('Booking cancelled');
      setIsCancelModalOpen(false);
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCanceling(false);
    }
  };

  // ── Rate ───────────────────────────────────────────────────────
  const handleRateClick = (booking) => { setRateBooking(booking); setIsRateModalOpen(true); };
  const handleRateSuccess = () => {
    setReviewedMap((prev) => ({ ...prev, [rateBooking._id]: true }));
    toast.success('Review submitted!');
  };

  // ── Verify completion ──────────────────────────────────────────
  const handleVerifyCompletion = async (bookingId, isVerified) => {
    try {
      await bookingService.verifyCompletion(bookingId, isVerified);
      toast.success(isVerified ? 'Completion confirmed!' : 'Flag raised.');
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, patientVerifiedCompletion: isVerified } : b));
    } catch {
      toast.error('Failed to verify completion');
    }
  };

  // ── Payment ────────────────────────────────────────────────────
  const handlePayment = async (booking) => {
    if (!isRazorpayLoaded) return toast.error('Payment gateway is loading...');

    const effectivePrice = (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice)
      ? booking.finalPrice
      : booking.estimatedPrice || booking.totalAmount;

    const canPayWithWallet = walletBalance >= effectivePrice;

    if (canPayWithWallet) {
      const confirmWallet = window.confirm(`Pay ₹${effectivePrice} using your wallet balance (₹${walletBalance})?`);
      if (confirmWallet) {
        setProcessingPayment(booking._id);
        try {
          await paymentService.payWithWallet(booking._id);
          toast.success('Paid successfully using wallet!');
          setRefresh((r) => r + 1);
          return;
        } catch (err) {
          toast.error(err.response?.data?.message || 'Wallet payment failed.');
        } finally {
          setProcessingPayment(null);
        }
      }
    }

    setProcessingPayment(booking._id);
    try {
      const res = await paymentService.createOrder(booking._id);
      const { order, keyId } = res.data.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RIVO Healthcare',
        description: `Payment for ${SERVICE_CONFIG[booking.service].label}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            setRefresh((r) => r + 1);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: booking.patient.name,
          email: booking.patient.email,
          contact: booking.patient.phone,
        },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return ['pending', 'confirmed', 'in-progress'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">Care Timeline</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 font-medium mt-2">View and manage all your appointments and medical services.</p>
        </div>
      </div>

      {/* Stats Chips Row */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        <StatChip icon={<Activity size={16} className="text-blue-500" />} label="Total" value={stats.total} className="bg-blue-50/50 border-blue-100/50" />
        <StatChip icon={<Calendar size={16} className="text-purple-500" />} label="Upcoming" value={stats.upcoming} className="bg-purple-50/50 border-purple-100/50" />
        <StatChip icon={<CheckCircle2 size={16} className="text-emerald-500" />} label="Completed" value={stats.completed} className="bg-emerald-50/50 border-emerald-100/50" />
        <StatChip icon={<X size={16} className="text-red-500" />} label="Cancelled" value={stats.cancelled} className="bg-red-50/50 border-red-100/50" />
      </div>

      {/* Controls Row: Tabs & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {tab === 'all' ? 'All Bookings' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:border-blue-300 transition-all">
            <Calendar size={14} className="text-slate-400" />
            All Dates
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:border-blue-300 transition-all">
            <Filter size={14} className="text-slate-400" />
            Advanced Filter
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
              <Calendar size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">No bookings found</h3>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">You don't have any appointments in this category. Schedule your next care session now.</p>
            <Link to="/dashboard/patient/book">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 py-4 shadow-xl shadow-blue-500/20 font-black text-lg">
                Book a Service
              </Button>
            </Link>
          </div>
        ) : (
          filteredBookings.map((b) => (
            <BookingCard 
              key={b._id} 
              booking={b} 
              reviewed={reviewedMap[b._id]}
              onPayment={() => handlePayment(b)}
              onCancel={() => handleCancelClick(b)}
              onRate={() => handleRateClick(b)}
              onApprovePrice={() => handleApprovePrice(b._id)}
              onRejectPrice={() => handleRejectPrice(b._id)}
              onVerify={(v) => handleVerifyCompletion(b._id, v)}
              approving={approvingId === b._id}
              rejecting={rejectingId === b._id}
              processingPayment={processingPayment === b._id}
              walletBalance={walletBalance}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !canceling && setIsCancelModalOpen(false)}
        title="Cancel Appointment"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={canceling} className="rounded-xl font-bold">Close</Button>
            <Button variant="danger" onClick={submitCancel} loading={canceling} className="rounded-xl px-8 font-black">Confirm Cancellation</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-4">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 font-medium">
              Cancelling a confirmed appointment might incur a small fee if done less than 2 hours before the start time.
            </p>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Are you sure you want to cancel your <strong>{selectedBooking && SERVICE_CONFIG[selectedBooking.service].label}</strong> appointment?
          </p>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Reason for cancellation</label>
            <textarea
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[120px] font-medium"
              placeholder="Please tell us why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <RateModal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} booking={rateBooking} onSuccess={handleRateSuccess} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function StatChip({ icon, label, value, className }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-6 py-3 rounded-full border border-slate-100 bg-white transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default shrink-0",
      className
    )}>
      <div className="shrink-0">{icon}</div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function BookingCard({ 
  booking: b, reviewed, onPayment, onCancel, onRate, 
  onApprovePrice, onRejectPrice, onVerify,
  approving, rejecting, processingPayment, walletBalance 
}) {
  const service = SERVICE_CONFIG[b.service];
  const effectivePrice = (b.priceUpdated && b.priceApprovedByPatient && b.finalPrice)
    ? b.finalPrice
    : b.estimatedPrice || b.totalAmount;

  return (
    <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
      {/* Visual Accent */}
      <div className={cn(
        "absolute top-0 left-0 w-2 h-full",
        b.status === 'confirmed' ? "bg-emerald-500" :
        b.status === 'pending' ? "bg-amber-500" :
        b.status === 'completed' ? "bg-blue-600" : "bg-slate-300"
      )} />

      <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
        {/* Left: Provider Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <img 
              src={b.provider?.user?.profileImage || `https://ui-avatars.com/api/?name=${b.provider?.user?.name || 'Assigning'}&background=6366f1&color=fff`} 
              alt="Provider" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm"
            />
            {b.status === 'confirmed' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="text-lg font-black text-slate-900 tracking-tight">{service.label}</h4>
              <Badge status={b.status} className="scale-75 origin-left" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{b.provider?.user?.name || 'Assigning Expert...'}</p>
            {b.paymentStatus === 'PAID' && (
              <span className="inline-flex mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded uppercase tracking-widest border border-emerald-100/50">
                Paid
              </span>
            )}
          </div>
        </div>

        {/* Center: Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-50 lg:px-10">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Schedule</p>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Calendar size={14} className="text-blue-500" /> {formatDate(b.scheduledAt)}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Clock size={14} className="text-blue-500" /> {formatDateTime(b.scheduledAt).split('at')[1]}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-lg font-black text-slate-900">
                <IndianRupee size={16} className="text-blue-600" /> {effectivePrice}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <MapPin size={14} className="text-blue-500" /> {b.pincode}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
          {/* Price Approval Actions */}
          {b.priceUpdated && !b.priceApprovedByPatient && b.status !== 'cancelled' && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 mb-1">
              <p className="text-[9px] font-bold text-amber-800 mb-2 uppercase text-center tracking-wider font-black">Price: ₹{b.finalPrice}</p>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black py-1.5" onClick={onApprovePrice} loading={approving}>Approve</Button>
                <Button size="sm" variant="ghost" className="flex-1 text-red-600 hover:bg-red-50 rounded-lg text-[9px] font-black py-1.5" onClick={onRejectPrice} loading={rejecting}>Reject</Button>
              </div>
            </div>
          )}

          {/* Payment Action */}
          {b.status === 'confirmed' && b.paymentStatus !== 'PAID' && (
            <Button
              onClick={onPayment}
              loading={processingPayment}
              disabled={b.priceUpdated && !b.priceApprovedByPatient}
              className={cn(
                "w-full rounded-xl py-3 text-xs font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest",
                walletBalance >= effectivePrice ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              )}
            >
              {walletBalance >= effectivePrice ? 'Pay via Wallet' : `Pay ₹${effectivePrice}`}
            </Button>
          )}

          {/* Verification Actions */}
          {b.status === 'completed' && b.patientVerifiedCompletion === undefined && (
            <div className="flex gap-2">
              <Button onClick={() => onVerify(true)} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-[10px] font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 uppercase tracking-widest">Confirm</Button>
              <Button onClick={() => onVerify(false)} variant="ghost" className="flex-1 text-red-600 bg-red-50 rounded-xl py-2.5 text-[10px] font-black hover:bg-red-100 uppercase tracking-widest">Issue</Button>
            </div>
          )}

          {/* Rate Action */}
          {b.status === 'completed' && !reviewed && (
            <Button 
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-xs font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest" 
              onClick={onRate}
            >Rate Service</Button>
          )}

          {b.status === 'completed' && reviewed && (
            <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <CheckCircle2 size={14} /> Rated ✓
            </div>
          )}

          {['pending', 'confirmed'].includes(b.status) && (
            <Button 
              variant="ghost" 
              className="w-full text-red-600 bg-red-50 hover:bg-red-100 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={onCancel}
            >Cancel Booking</Button>
          )}
        </div>
      </div>

      <button className="absolute top-5 right-5 p-1.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}


