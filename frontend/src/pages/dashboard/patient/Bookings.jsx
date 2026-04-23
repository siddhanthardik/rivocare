import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService, reviewService, paymentService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import RateModal from '../../../components/ui/RateModal';
import StarRating from '../../../components/ui/StarRating';
import {
  Star, CreditCard, CheckCircle, IndianRupee,
  TrendingUp, AlertCircle, ThumbsUp, ThumbsDown, ShieldAlert,
} from 'lucide-react';
import useRazorpay from '../../../hooks/useRazorpay';

// ── Price Breakdown card shown on every booking ──────────────────
function PriceBreakdownCard({ booking }) {
  const base     = booking.basePrice       || 0;
  const markup   = booking.providerMarkup  || 0;
  const estimated = booking.estimatedPrice || booking.totalAmount || 0;
  const final    = booking.finalPrice;

  return (
    <div className="mt-3 p-3 rounded-xl border bg-white text-xs space-y-1.5">
      <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
        <IndianRupee size={12} className="text-slate-500" /> Price Breakdown
      </p>
      <div className="flex justify-between text-slate-500">
        <span>Base Price</span><span>₹{base}</span>
      </div>
      <div className="flex justify-between text-slate-500">
        <span>Provider Markup</span><span>₹{markup}</span>
      </div>
      <div className="border-t border-slate-200 pt-1.5 flex justify-between font-semibold text-slate-800">
        <span>Estimated Total</span><span>₹{estimated}</span>
      </div>
      {final > 0 && final !== estimated && booking.pricingType !== 'OVERRIDE' && (
        <div className="flex justify-between font-bold text-indigo-700 bg-indigo-50 px-2 py-1.5 rounded-lg mt-1">
          <span>Updated Price</span><span>₹{final}</span>
        </div>
      )}
      {booking.pricingType === 'OVERRIDE' && (
        <div className="flex justify-between font-bold text-purple-700 bg-purple-50 px-2 py-1.5 rounded-lg mt-1 border border-purple-100">
          <span className="flex items-center gap-1">👑 Admin Override</span><span>₹{booking.overridePrice}</span>
        </div>
      )}
      {booking.overrideReason && booking.pricingType === 'OVERRIDE' && (
        <p className="text-xs text-purple-600 italic px-1 mt-0.5">Reason: {booking.overrideReason}</p>
      )}
    </div>
  );
}

// ── Price Update Approval Banner (shown when provider updated price) ──
function PriceApprovalBanner({ booking, onApprove, onReject, approving, rejecting }) {
  if (!booking.priceUpdated || booking.priceApprovedByPatient) return null;

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 text-sm">Provider updated the price</p>
          <p className="text-amber-700 text-xs mt-0.5">
            New price: <strong>₹{booking.finalPrice}</strong> (was ₹{booking.estimatedPrice})
          </p>
          {booking.priceUpdateReason && (
            <p className="text-amber-700 text-xs mt-1">
              <strong>Reason:</strong> {booking.priceUpdateReason}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-amber-700 flex-1">Do you agree to the updated price?</p>
        <Button
          size="sm"
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-1"
          onClick={onReject}
          loading={rejecting}
          disabled={approving}
        >
          <ThumbsDown size={13} /> Reject
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
          onClick={onApprove}
          loading={approving}
          disabled={rejecting}
        >
          <ThumbsUp size={13} /> Approve
        </Button>
      </div>
    </div>
  );
}

export default function PatientBookings() {
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refresh, setRefresh]           = useState(0);
  const [reviewedMap, setReviewedMap]   = useState({});

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

  useEffect(() => { loadBookings(); }, [refresh, loadBookings]);

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

    // Block payment if price updated but not yet approved
    if (booking.priceUpdated && !booking.priceApprovedByPatient) {
      return toast.error('Please approve or reject the updated price before paying.');
    }

    setProcessingPayment(booking._id);
    try {
      const res = await paymentService.createOrder(booking._id);
      const { order } = res.data.data;

      // Use finalPrice if approved, else estimatedPrice
      const displayAmount = booking.finalPrice && booking.priceApprovedByPatient
        ? booking.finalPrice
        : booking.estimatedPrice || booking.totalAmount;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummykey',
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Bookings</h1>
        <p className="text-slate-500">Manage your past and upcoming consultations.</p>
      </div>

      {/* Pending price approvals banner */}
      {bookings.some(b => b.priceUpdated && !b.priceApprovedByPatient) && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-5 py-3">
          <ShieldAlert size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            You have <strong>{bookings.filter(b => b.priceUpdated && !b.priceApprovedByPatient).length}</strong> booking(s) with an updated price awaiting your approval.
          </p>
        </div>
      )}

      <div className="card">
        {bookings.length === 0 ? (
          <EmptyState title="No bookings found" description="You haven't made any bookings yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => {
              const effectivePrice = (b.priceUpdated && b.priceApprovedByPatient && b.finalPrice)
                ? b.finalPrice
                : b.estimatedPrice || b.totalAmount;

              return (
                <div
                  key={b._id}
                  className={`p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-6 transition-colors hover:bg-slate-50
                    ${b.priceUpdated && !b.priceApprovedByPatient ? 'border-l-4 border-amber-400 bg-amber-50/10' : ''}
                  `}
                >
                  {/* Left: details */}
                  <div className="flex gap-4 sm:gap-6 flex-1 min-w-0">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${SERVICE_CONFIG[b.service].color}`}>
                      {SERVICE_CONFIG[b.service].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-semibold text-lg text-slate-800">{SERVICE_CONFIG[b.service].label}</h4>
                        <Badge status={b.status} />
                        {b.pricingType === 'OVERRIDE' && (
                          <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold border border-purple-200">
                            👑 Admin Priced
                          </span>
                        )}
                        {b.priceUpdated && !b.priceApprovedByPatient && b.pricingType !== 'OVERRIDE' && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            <AlertCircle size={11} /> Price Updated
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-0.5">{b.provider?.user?.name}</p>
                      <p className="text-sm text-slate-500 mb-2">
                        {formatDateTime(b.scheduledAt)} • {b.durationHours} hr{b.durationHours > 1 ? 's' : ''}
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p><strong>Location:</strong> {b.address}, {b.pincode}</p>
                        {b.notes && <p><strong>Notes:</strong> {b.notes}</p>}
                        {b.status === 'cancelled' && b.cancelReason && (
                          <p className="text-red-600"><strong>Cancel Reason:</strong> {b.cancelReason}</p>
                        )}
                        {b.paymentStatus === 'PAID' && (
                          <p className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> PAID ONLINE
                          </p>
                        )}
                      </div>

                      {/* Price breakdown */}
                      {['pending', 'confirmed', 'in-progress', 'completed'].includes(b.status) && (
                        <PriceBreakdownCard booking={b} />
                      )}

                      {/* Price Approval Banner */}
                      <PriceApprovalBanner
                        booking={b}
                        onApprove={() => handleApprovePrice(b._id)}
                        onReject={() => handleRejectPrice(b._id)}
                        approving={approvingId === b._id}
                        rejecting={rejectingId === b._id}
                      />

                      {/* Completion verification */}
                      {b.status === 'completed' && b.patientVerifiedCompletion === null && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 justify-between animate-fade-in">
                          <p className="text-sm font-medium text-blue-800">Did the provider complete this service?</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleVerifyCompletion(b._id, false)}>No</Button>
                            <Button size="sm" onClick={() => handleVerifyCompletion(b._id, true)}>Yes</Button>
                          </div>
                        </div>
                      )}

                      {/* Already reviewed */}
                      {b.status === 'completed' && reviewedMap[b._id] && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <StarRating value={5} size="sm" />
                          <span className="text-xs text-emerald-600 font-medium">Reviewed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: price + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-800 block">{formatCurrency(effectivePrice)}</span>
                      {b.priceUpdated && b.priceApprovedByPatient && b.finalPrice !== b.estimatedPrice && (
                        <span className="text-xs line-through text-slate-400">₹{b.estimatedPrice} est.</span>
                      )}
                    </div>

                    {/* Cancel */}
                    {b.status === 'pending' && (
                      <Button variant="danger" size="sm" onClick={() => handleCancelClick(b)}>Cancel</Button>
                    )}

                    {/* Pay Now */}
                    {b.status === 'confirmed' && b.paymentStatus !== 'PAID' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayment(b)}
                        loading={processingPayment === b._id}
                        disabled={b.priceUpdated && !b.priceApprovedByPatient}
                        title={b.priceUpdated && !b.priceApprovedByPatient ? 'Approve the updated price first' : ''}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                      >
                        <CreditCard size={14} />
                        Pay ₹{effectivePrice}
                      </Button>
                    )}

                    {/* Rate */}
                    {b.status === 'completed' && b.patientVerifiedCompletion === true && !reviewedMap[b._id] && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleRateClick(b)}
                        className="flex items-center gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50"
                      >
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        Rate Now
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !canceling && setIsCancelModalOpen(false)}
        title="Cancel Booking"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={canceling}>Close</Button>
            <Button variant="danger" onClick={submitCancel} loading={canceling}>Confirm Cancel</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to cancel your{' '}
            {selectedBooking && SERVICE_CONFIG[selectedBooking.service].label} appointment with{' '}
            {selectedBooking?.provider?.user?.name}?
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-base"
              rows={3}
              placeholder="Please let us know why you are cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Rate Modal */}
      <RateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        booking={rateBooking}
        onSuccess={handleRateSuccess}
      />
    </div>
  );
}
