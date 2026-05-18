import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Search, MoreHorizontal,
  Clock
} from 'lucide-react';
import { bookingService, reviewService, paymentService } from '../../../services';
import useCheckout from '../../../hooks/useCheckout';
import { BOOKING_STATUS, normalizeBookingStatus, PAYMENT_STATUS, normalizePaymentStatus } from '../../../constants/bookingStatus';
import { formatDateTime, SERVICE_CONFIG, cn, formatDate } from '../../../utils';
import { formatCurrency } from '../../../utils/format';
import { PageLoader } from '../../../components/ui/Feedback';
import Modal from '../../../components/ui/Modal';
import RateModal from '../../../components/ui/RateModal';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../../components/ui/Layout';

export default function PatientBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refresh, setRefresh]           = useState(0);
  const [reviewedMap, setReviewedMap]   = useState({});
  const [activeTab, setActiveTab]       = useState('all');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking]     = useState(null);
  const [cancelReason, setCancelReason]           = useState('');
  const [canceling, setCanceling]                 = useState(false);

  // Rate Modal
  const [rateBooking, setRateBooking]       = useState(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const res = await bookingService.getAll({ limit: 100 });
      const bks = res.data.bookings;
      setBookings(bks);

      const completedIds = bks.filter((b) => normalizeBookingStatus(b.status) === BOOKING_STATUS.COMPLETED).map((b) => b._id);
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

  useEffect(() => { 
    loadBookings(); 
  }, [refresh, loadBookings]);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return normalizeBookingStatus(b.status) === BOOKING_STATUS.REQUESTED || normalizeBookingStatus(b.status) === BOOKING_STATUS.CONFIRMED;
    if (activeTab === 'collected') return normalizeBookingStatus(b.status) === BOOKING_STATUS.COLLECTED;
    if (activeTab === 'completed') return normalizeBookingStatus(b.status) === BOOKING_STATUS.COMPLETED || normalizeBookingStatus(b.status) === BOOKING_STATUS.PAID;
    if (activeTab === 'cancelled') return normalizeBookingStatus(b.status) === BOOKING_STATUS.CANCELLED;
    return true;
  });

  // Show a pending-confirmation badge count for attention
  const pendingConfirmCount = bookings.filter(b => normalizeBookingStatus(b.status) === BOOKING_STATUS.COLLECTED).length;

  if (loading) return <PageLoader />;

  return (
    <PageWrapper maxWidth="1200px">
      {/* ── Wallet KPI ───────────────────────────────── */}
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
          {['all', 'upcoming', 'collected', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg typo-label transition-all whitespace-nowrap relative",
                activeTab === tab ? "bg-slate-900 text-white font-black shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
              {tab === 'collected' && pendingConfirmCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-black bg-amber-500 text-white rounded-full">{pendingConfirmCount}</span>
              )}
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
                onRefresh={() => setRefresh(r => r + 1)}
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

function BookingRow({ booking: b, isReviewed, onCancel, onRate, onRefresh }) {
  const service = SERVICE_CONFIG[b.service];
  const { open, isInitializing } = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeText, setDisputeText] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);

  const status = normalizeBookingStatus(b.status);
  const paymentStatus = normalizePaymentStatus(b.paymentStatus);
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID;
  const isCollected = status === BOOKING_STATUS.COLLECTED;
  const isDisputed = paymentStatus === PAYMENT_STATUS.DISPUTED;
  const isConfirmed = status === BOOKING_STATUS.CONFIRMED;

  const handleConfirmCash = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      await paymentService.confirmCash(b._id);
      toast.success('Payment confirmed! Thank you.');
      onRefresh && onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReportIssue = async () => {
    if (isDisputing || !disputeText.trim()) return;
    setIsDisputing(true);
    try {
      await paymentService.reportCashIssue(b._id, { issue: disputeText });
      toast.success('Dispute reported. Admin will follow up.');
      setDisputeOpen(false);
      onRefresh && onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setIsDisputing(false);
    }
  };

  const handlePayNow = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      await open({
        createOrderFn: async () => {
          console.log(`[PAYMENT] Creating order for booking: ${b._id}`);
          return paymentService.createOrder(b._id);
        },
        verifyFn: async (data) => {
          console.log(`[PAYMENT] Verifying payment for booking: ${b._id}`, {
            payload: data,
            token: localStorage.getItem('accessToken') ? 'PRESENT' : 'MISSING'
          });
          return await paymentService.verifyPayment(data);
        },
        payload: { bookingId: b._id },
        onSuccess: async () => {
          toast.success('Payment successful');
          console.log(`[PAYMENT] Success for booking: ${b._id}`);
          // Explicitly wait for refresh to ensure UI updates
          if (onRefresh) await onRefresh();
          setIsProcessing(false);
        },
        onError: (err) => {
          console.error(`[PAYMENT] Error for booking: ${b._id}`, err);
          const msg = err?.response?.data?.message || err?.message || 'Payment failed';
          toast.error(msg);
          setIsProcessing(false);
        }
      });
    } catch (err) {
      console.error(`[PAYMENT] Initiation failed for booking: ${b._id}`, err);
      toast.error(err?.response?.data?.message || err?.message || 'Payment initiation failed');
      setIsProcessing(true);
    }
  };

  return (
    <>
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
           <div className="flex items-center gap-2">
             <p className="typo-value !text-gray-900 leading-none">{formatCurrency(b.finalPrice || b.finalAmount || b.totalAmount || 0)}</p>
             {isPaid && (
               <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-black uppercase tracking-tighter border border-green-100">
                 Paid
               </span>
             )}
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          {normalizeBookingStatus(b.status) === BOOKING_STATUS.REQUESTED && (
            <button onClick={() => onCancel(b)} className="btn-secondary-sm !px-4 !py-2 !text-red-500 border-red-100 hover:bg-red-50">Cancel</button>
          )}

          {isConfirmed && !isPaid && (
            <div className="flex gap-2">
              <button
                onClick={handlePayNow}
                disabled={isInitializing || isProcessing}
                className={cn(
                  "btn-primary-sm !px-4 !py-2 flex items-center gap-2",
                  (isInitializing || isProcessing) && "opacity-70 cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  isInitializing ? 'Loading...' : 'Pay Now'
                )}
              </button>
              <button
                disabled={isProcessing}
                onClick={async () => {
                  try {
                    // Only update the payment preference. Do NOT change booking lifecycle status.
                    await bookingService.update(b._id, { paymentMethod: 'CASH' });
                    toast.success('Cash payment selected');
                    onRefresh && onRefresh();
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to set payment method');
                  }
                }}
                className="btn-secondary-sm !px-4 !py-2"
              >
                Pay Cash After Service
              </button>
            </div>
          )}

          {isPaid && isConfirmed && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="typo-micro font-black uppercase tracking-tighter">Ready for Service</span>
            </div>
          )}

          {normalizeBookingStatus(b.status) === BOOKING_STATUS.COMPLETED && !isReviewed && (
            <button onClick={() => onRate(b)} className="btn-primary-sm !px-6 !py-2">Rate</button>
          )}
          <button className="btn-icon">
            <MoreHorizontal size={14} />
          </button>
      </div>
    </Row>

      {/* COD Confirmation Card (below the row) */}
      {isCollected && !isDisputed && (
        <div className="mx-3 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⏳</span>
            <div>
              <p className="text-sm font-black text-amber-800">Provider marked ₹{b.collectedAmount || b.totalAmount} collected in cash</p>
              <p className="text-xs text-amber-600 mt-0.5">Does this match what you paid? Please confirm or report an issue.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              id={`confirm-cash-${b._id}`}
              onClick={handleConfirmCash}
              disabled={isConfirming}
              className="flex-1 py-2 text-sm font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
            >
              {isConfirming ? 'Confirming...' : '✓ Confirm Payment'}
            </button>
            <button
              id={`dispute-cash-${b._id}`}
              onClick={() => setDisputeOpen(true)}
              className="flex-1 py-2 text-sm font-black rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Report Issue
            </button>
          </div>
        </div>
      )}

      {isDisputed && (
        <div className="mx-3 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-red-500">⚠️</span>
          <div>
            <p className="text-xs font-black text-red-700">Dispute Raised</p>
            <p className="text-[11px] text-red-500">Admin is reviewing this payment. We'll follow up within 24h.</p>
          </div>
        </div>
      )}

      {disputeOpen && (
        <Modal isOpen={disputeOpen} onClose={() => setDisputeOpen(false)} title="Report Payment Issue">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-800">Provider reported ₹{b.collectedAmount || b.totalAmount} was collected. Please describe the actual amount or issue below.</p>
            </div>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none h-24 focus:ring-2 focus:ring-red-500/10"
              placeholder="e.g. Provider only collected ₹200, not ₹500"
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setDisputeOpen(false)} className="flex-1 btn-secondary-sm !py-2.5">Cancel</button>
              <button
                onClick={handleReportIssue}
                disabled={!disputeText.trim() || isDisputing}
                className="flex-1 btn-primary-sm !bg-red-600 !py-2.5 disabled:opacity-50"
              >
                {isDisputing ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
