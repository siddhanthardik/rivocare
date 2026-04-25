import { useState, useEffect, useCallback, cloneElement } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Search, Filter, MoreHorizontal, ChevronRight, 
  MapPin, Clock, Star, CreditCard, CheckCircle, IndianRupee,
  AlertCircle, ThumbsUp, ThumbsDown, ShieldAlert,
  ArrowRight, ShieldCheck, UserCheck, MessageCircle, HelpCircle,
  X, Info
} from 'lucide-react';
import { bookingService, reviewService, paymentService, walletService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG, cn, formatDate } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import RateModal from '../../../components/ui/RateModal';
import StarRating from '../../../components/ui/StarRating';
import Avatar from '../../../components/ui/Avatar';
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
      const res = await bookingService.getAll({ limit: 50 });
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
      toast.success('Price approved! The service can now be completed.');
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
      toast.success('Price rejected. Original price will be used.');
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
    toast.success('⭐ Review submitted!');
  };

  // ── Verify completion ──────────────────────────────────────────
  const handleVerifyCompletion = async (bookingId, isVerified) => {
    try {
      await bookingService.verifyCompletion(bookingId, isVerified);
      toast.success(isVerified ? 'Completion confirmed!' : 'Flag raised. Our team will review this.');
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, patientVerifiedCompletion: isVerified } : b));
    } catch {
      toast.error('Failed to verify completion');
    }
  };

  // ── Payment ────────────────────────────────────────────────────
  const handlePayment = async (booking) => {
    if (!isRazorpayLoaded) return toast.error('Payment gateway is loading. Please try again.');

    if (booking.priceUpdated && !booking.priceApprovedByPatient) {
      return toast.error('Please approve or reject the updated price before paying.');
    }

    const effectivePrice = (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice)
      ? booking.finalPrice
      : booking.estimatedPrice || booking.totalAmount;

    const canPayWithWallet = walletBalance >= effectivePrice;

    if (canPayWithWallet) {
      const confirmWallet = window.confirm(`You have ₹${walletBalance} in your wallet. Would you like to use your wallet balance to pay ₹${effectivePrice} for this booking?`);
      if (confirmWallet) {
        setProcessingPayment(booking._id);
        try {
          await paymentService.payWithWallet(booking._id);
          toast.success('🎉 Paid successfully using wallet!');
          setRefresh((r) => r + 1);
          return;
        } catch (err) {
          toast.error(err.response?.data?.message || 'Wallet payment failed. Try online payment.');
        } finally {
          setProcessingPayment(null);
        }
      }
    }

    setProcessingPayment(booking._id);
    try {
      const res = await paymentService.createOrder(booking._id);
      const { order, keyId } = res.data.data;

      const displayAmount = booking.finalPrice && booking.priceApprovedByPatient
        ? booking.finalPrice
        : booking.estimatedPrice || booking.totalAmount;

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'RIVO Healthcare',
        description: `Payment for ${SERVICE_CONFIG[booking.service].label} — ₹${displayAmount}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('🎉 Payment successful!');
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
        theme: { color: '#0284c7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => toast.error('Payment failed: ' + response.error.description));
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
    <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto px-4 lg:px-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>My Bookings</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">View and manage all your appointments and bookings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Main Content Area: Tabs and Booking Cards */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Tabs and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-sm font-bold capitalize whitespace-nowrap transition-all border-b-2",
                    activeTab === tab 
                      ? "text-blue-600 border-blue-600" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  {tab === 'all' ? 'All Bookings' : tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <Calendar size={14} className="text-slate-400" />
                All Dates
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <Filter size={14} className="text-slate-400" />
                Filter
              </div>
            </div>
          </div>

          {/* Booking Cards List */}
          <div className="space-y-6">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                  <Calendar size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No bookings found</h3>
                <p className="text-slate-500 max-w-xs mb-8">You haven't made any bookings in this category yet.</p>
                <Link to="/dashboard/patient/book">
                  <Button className="bg-blue-600 text-white rounded-2xl px-8 py-3 font-bold shadow-lg shadow-blue-500/20">
                    Book a Service Now
                  </Button>
                </Link>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const effectivePrice = (b.priceUpdated && b.priceApprovedByPatient && b.finalPrice)
                  ? b.finalPrice
                  : b.estimatedPrice || b.totalAmount;

                return (
                  <div key={b._id} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative group">
                    <button className="absolute top-8 right-8 p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <MoreHorizontal size={20} />
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_176px] gap-6 lg:gap-8 items-start">
                      
                      {/* Left: Provider Info */}
                      <div className="flex items-center lg:items-start lg:flex-col gap-4">
                        <div className="relative group/avatar">
                          <img 
                            src={b.provider?.user?.profileImage || `https://ui-avatars.com/api/?name=${b.provider?.user?.name || 'Care'}&background=random`} 
                            alt="Provider" 
                            className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] object-cover shadow-md group-hover/avatar:scale-105 transition-transform"
                          />
                          {b.status === 'confirmed' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                              <CheckCircle size={10} className="text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="lg:mt-3 lg:text-center">
                          <h4 className="font-bold text-slate-900 text-base truncate max-w-[150px]">{b.provider?.user?.name || 'Assigning...'}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{SERVICE_CONFIG[b.service].label.split(' ')[0]}</p>
                        </div>
                      </div>

                      {/* Center: Booking Details */}
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{SERVICE_CONFIG[b.service].label}</h3>
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            b.status === 'confirmed' ? "bg-emerald-100 text-emerald-600" : 
                            b.status === 'pending' ? "bg-orange-100 text-orange-600" :
                            b.status === 'cancelled' ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            {b.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                          <DetailItem icon={<Calendar size={16} />} text={formatDate(b.scheduledAt)} label={new Date(b.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short' })} />
                          <DetailItem icon={<Clock size={16} />} text={formatDateTime(b.scheduledAt).split('at')[1]} label="Time Slot" />
                          <DetailItem icon={<MapPin size={16} />} text="At Home" label={b.address.length > 20 ? b.address.substring(0, 20) + '...' : b.address} />
                          <DetailItem icon={<UserCheck size={16} />} text={SERVICE_CONFIG[b.service].label} label="Provider Expert" />
                        </div>

                        <div className="flex items-center gap-2 pt-2 text-xl font-black text-slate-900">
                          <IndianRupee size={20} />
                          {effectivePrice}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-3 self-end">
                        <Button 
                          className="w-full bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-xs transition-all active:scale-95"
                          onClick={() => toast.success('Booking details are being loaded...')}
                        >
                          View Details
                        </Button>
                        
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <Button 
                            className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs transition-all active:scale-95"
                            onClick={() => toast('Please contact support to reschedule.', { icon: '📅' })}
                          >
                            Reschedule
                          </Button>
                        )}

                        {b.status === 'pending' && (
                          <Button 
                            variant="danger" 
                            className="w-full rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95" 
                            onClick={() => handleCancelClick(b)}
                          >
                            Cancel Booking
                          </Button>
                        )}

                        {b.status === 'completed' && !reviewedMap[b._id] && (
                          <Button 
                            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95" 
                            onClick={() => handleRateClick(b)}
                          >
                            Rate Service
                          </Button>
                        )}

                        {b.status === 'confirmed' && b.paymentStatus !== 'PAID' && (
                          <Button
                            onClick={() => handlePayment(b)}
                            loading={processingPayment === b._id}
                            disabled={b.priceUpdated && !b.priceApprovedByPatient}
                            className={cn(
                              "w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95",
                              walletBalance >= effectivePrice ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                            )}
                          >
                            {walletBalance >= effectivePrice ? 'Pay via Wallet' : `Pay ₹${effectivePrice}`}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Booking Summary */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Booking Summary</h3>
            <div className="space-y-4">
              <SummaryRow icon={<Calendar className="text-blue-600" />} label="Total Bookings" value={stats.total} />
              <SummaryRow icon={<Clock className="text-indigo-600" />} label="Upcoming" value={stats.upcoming} />
              <SummaryRow icon={<CheckCircle className="text-emerald-600" />} label="Completed" value={stats.completed} />
              <SummaryRow icon={<X className="text-red-500" />} label="Cancelled" value={stats.cancelled} />
            </div>
          </div>

          {/* Rebook Card */}
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Calendar size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Need to book again?</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-6">Rebook your previous service in just one click.</p>
              <Link to="/dashboard/patient/book">
                <Button className="w-full bg-white text-blue-600 font-bold rounded-2xl py-3 text-sm hover:bg-blue-50 transition-colors">
                  Book Again
                </Button>
              </Link>
            </div>
          </div>

          {/* Important Info */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Important Information</h3>
            <div className="space-y-6">
              <InfoItem icon={<Clock size={16} className="text-blue-600" />} text="Please be available 15 mins before the scheduled time." />
              <InfoItem icon={<ShieldCheck size={16} className="text-blue-600" />} text="Our expert will carry necessary equipment for your care." />
              <InfoItem icon={<HelpCircle size={16} className="text-blue-600" />} text="Need to reschedule or cancel? Do it at least 2 hours in advance." />
            </div>
            <Link to="/dashboard/patient/support" className="mt-8 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all">
              View Booking Policy <ArrowRight size={16} />
            </Link>
          </div>

          {/* Have questions? */}
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center">
            <img src="https://i.pravatar.cc/100?img=68" alt="Support" className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-white shadow-md" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Have questions?</h3>
            <p className="text-slate-500 text-xs mb-6">We're here to help you.</p>
            <Button className="w-full bg-slate-900 text-white rounded-2xl py-3 font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <MessageCircle size={16} /> Contact Support
            </Button>
          </div>
        </div>
      </div>

      {/* Modals from original code logic */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !canceling && setIsCancelModalOpen(false)}
        title="Cancel Booking"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={canceling}>Close</Button>
            <Button variant="danger" onClick={submitCancel} loading={canceling} className="rounded-xl px-6">Confirm Cancel</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel your{' '}
            <strong>{selectedBooking && SERVICE_CONFIG[selectedBooking.service].label}</strong> appointment?
          </p>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5">
              Reason for cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              rows={3}
              placeholder="e.g., I'm not available at this time..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <RateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        booking={rateBooking}
        onSuccess={handleRateSuccess}
      />

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

// Helper Components
function DetailItem({ icon, text, label }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 leading-tight">{text}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between p-1">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
          {cloneElement(icon, { size: 16 })}
        </div>
        <span className="text-sm font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-lg font-black text-slate-900">{value}</span>
    </div>
  );
}

function InfoItem({ icon, text }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
        {icon}
      </div>
      <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
