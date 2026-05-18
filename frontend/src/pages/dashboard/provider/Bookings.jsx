import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService } from '../../../services';
import { formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { BOOKING_STATUS, normalizeBookingStatus, PAYMENT_STATUS, normalizePaymentStatus } from '../../../constants/bookingStatus';
import { formatCurrency } from '../../../utils/format';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import CountdownTimer from '../../../components/ui/CountdownTimer';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { requestNotificationPermission, showNotification, playNotificationSound } from '../../../utils/notifications';
import { Flame, AlertCircle, CheckCircle, Clock, Search, MapPin, User, Timer, Zap, TrendingUp } from 'lucide-react';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../../components/ui/Layout';
import { calculateEndTime, checkAvailabilityConflict, getDistanceKm, getSmartScore } from '../../../utils/providerHelpers';

// calculateEndTime and getTimeFromScheduledAt now imported from providerHelpers

const getTimeFromScheduledAt = (scheduledAt) => {
  if (!scheduledAt) return '—';
  try { return new Date(scheduledAt).toTimeString().slice(0, 5); } catch { return '—'; }
};

const getDateFromScheduledAt = (scheduledAt) => {
  if (!scheduledAt) return '—';
  try {
    return new Date(scheduledAt).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return '—'; }
};

// ── Price Breakdown (preserved from original) ──────────────────────────────
function PriceBreakdown({ booking }) {
  const base = booking.basePrice || 0;
  const markup = booking.providerMarkup || 0;
  const estimated = booking.estimatedPrice || booking.totalAmount || 0;
  const final = booking.finalPrice;
  return (
    <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-2">
      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Earnings Breakdown</p>
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-500">Base Rate</span>
        <span className="text-slate-800">{formatCurrency(base)}</span>
      </div>
      {markup > 0 && (
        <div className="flex justify-between text-sm font-bold">
          <span className="text-slate-500">Your Markup</span>
          <span className="text-slate-800">{formatCurrency(markup)}</span>
        </div>
      )}
      <div className="border-t border-emerald-100 pt-2 flex justify-between font-black text-lg">
        <span className="text-emerald-700">You Earn</span>
        <span className="text-emerald-700">{formatCurrency(booking.providerEarning || Math.round((final || estimated) * 0.8))}</span>
      </div>
      {booking.pricingType === 'OVERRIDE' && (
        <div className="flex justify-between text-xs font-black text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 mt-1">
          <span>👑 Admin Override</span>
          <span>{formatCurrency(booking.overridePrice)}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProviderBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [refresh, setRefresh] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const BOOKINGS_PER_PAGE = 10;

  const [priceModal, setPriceModal] = useState(false);
  const [priceTarget, setPriceTarget] = useState(null);
  const [priceForm, setPriceForm] = useState({ newFinalPrice: '', reason: '' });
  const [savingPrice, setSavingPrice] = useState(false);

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Request browser notification permission on mount
    requestNotificationPermission();

    if (!socket || !user?._id) return;

    const handleNewBooking = (data) => {
      console.log('🔥 SOCKET EVENT RECEIVED:', data);
      
      showNotification("New Booking Request!", {
        body: data.message || "You have a new care request. Action required within 30 minutes.",
      });

      playNotificationSound();
      setRefresh(r => r + 1);
      toast.success('New booking request received!', { 
        icon: '⚡',
        duration: 5000 
      });
    };

    socket.on('new-booking', handleNewBooking);

    return () => {
      socket.off('new-booking', handleNewBooking);
    };
  }, [socket, user?._id]);

  useEffect(() => {
    const interval = setInterval(() => setRefresh(r => r + 1), 10000); // 10s auto-refresh (Harden Fallback)
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    if (!user?._id) return;
    
    const fetchBookings = async () => {
      try {
        const res = await bookingService.getAll({ 
          limit: 50, 
          ...(filter !== 'all' && { status: filter }) 
        });
        setBookings(res.data?.bookings || res.bookings || []);
      } catch (err) {
        console.error('[BOOKINGS_FETCH_FAILED]', err);
        toast.error('Failed to load bookings. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [refresh, filter, user?._id]);

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user?._id) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-3">
        <PageLoader label="Loading your secure dashboard..." />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verifying Identity</p>
      </div>
    );
  }

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await bookingService.updateStatus(id, { status });
      // Friendly toasts per action
      if (status === BOOKING_STATUS.CONFIRMED) {
        toast.success('Booking accepted');
      } else if (status === BOOKING_STATUS.IN_PROGRESS) {
        toast.success('Service started');
      } else if (status === BOOKING_STATUS.COMPLETED) {
        toast.success('Service completed');
      } else {
        toast.success(`${status}`);
      }
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const openPriceModal = (booking) => {
    setPriceTarget(booking);
    setPriceForm({
      newFinalPrice: booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '',
      reason: ''
    });
    setPriceModal(true);
  };

  const handlePriceUpdate = async () => {
    if (!priceForm.newFinalPrice) return toast.error('Price is required');
    setSavingPrice(true);
    try {
      await bookingService.updatePrice(priceTarget._id, priceForm);
      toast.success('Price updated!');
      setPriceModal(false);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingPrice(false);
    }
  };

  const totalPages = Math.ceil(bookings.length / BOOKINGS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE
  );

  if (loading) return <PageLoader />;

  return (
    <PageWrapper maxWidth="900px">
      {/* ── Header ──────────────────────────────────── */}
      <Section
        title="Appointments"
        subtitle="Your incoming booking requests — accept or decline each one."
        className="mb-4"
        action={
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
            />
          </div>
        }
      />

      {/* ── Filter Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit overflow-x-auto mb-6">
        {['all', 'pending', 'confirmed', 'completed', 'collected', 'cancelled'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap",
              filter === tab ? "bg-slate-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Booking List (SINGLE COLUMN) ─────────────── */}
      {bookings.length === 0 ? (
        <Card className="p-20 text-center flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100">
            <Clock size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-gray-900">No appointments found</h3>
            <p className="text-sm text-gray-400">You have no booking requests at the moment.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {paginatedBookings?.length === 0 ? (
            <p className="text-center text-slate-400 py-6 font-black text-sm uppercase tracking-widest">
              No bookings on this page
            </p>
          ) : (
            (paginatedBookings || []).map((booking) => (
              <BookingCard
                key={booking?._id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                updatingId={updatingId}
                onUpdatePrice={openPriceModal}
                onRefresh={() => setRefresh(r => r + 1)}
              />
            ))
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                ← Prev
              </button>
              
              <div className="flex gap-1 flex-wrap justify-center">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-colors",
                      currentPage === i + 1
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Price Update Modal ────────────────────────── */}
      <Modal isOpen={priceModal} onClose={() => setPriceModal(false)} title="Update Appointment Price">
        <div className="space-y-4 p-1">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-800">Updating the price requires patient approval. Only use for legitimate extras.</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Final Price (₹)</label>
            <input
              type="number"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500/10"
              value={priceForm.newFinalPrice}
              onChange={e => setPriceForm({ ...priceForm, newFinalPrice: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 h-24"
              value={priceForm.reason}
              onChange={e => setPriceForm({ ...priceForm, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setPriceModal(false)} className="flex-1 btn-secondary-sm !py-3.5">Cancel</button>
            <button onClick={handlePriceUpdate} disabled={savingPrice} className="flex-1 btn-primary-sm !bg-blue-600 !py-3.5">
              {savingPrice ? 'Saving...' : 'Update Price'}
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}

// ── Compact Decision Card ───────────────────────────────────────────────────
function BookingCard({ booking, onStatusUpdate, updatingId, onUpdatePrice, onRefresh }) {
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(booking.finalPrice || booking.totalAmount || booking.estimatedPrice || '');
  const [cashNote, setCashNote] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const serviceSlug = typeof booking.service === 'object' ? booking.service?.slug : booking.service;
  const service = SERVICE_CONFIG[serviceSlug];
  const isUpdating = updatingId === booking._id;
  const startTime = getTimeFromScheduledAt(booking.scheduledAt);
  const endTime = calculateEndTime(startTime, booking.durationHours);
  const scheduleDate = getDateFromScheduledAt(booking.scheduledAt);
  const duration = booking.durationHours || 1;

  // normalized status for safe comparisons
  const status = normalizeBookingStatus(booking.status);
  // Smart Decision Engine
  const bookingForEngine = {
    date: booking.scheduledAt ? new Date(booking.scheduledAt).toISOString().split('T')[0] : null,
    time: startTime,
    durationHours: duration,
    totalAmount: booking.totalAmount || booking.estimatedPrice || 0,
  };
  const conflictStatus = checkAvailabilityConflict(bookingForEngine, null);
  const smartScore = parseFloat(getSmartScore(bookingForEngine, null, null));
  const scoreColor = smartScore >= 0.6 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : smartScore >= 0.3 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-500 bg-red-50 border-red-200';

  const isLongShift = duration > 8;
  const isUrgent = booking.isUrgent || (() => {
    if (!booking.scheduledAt) return false;
    return (new Date(booking.scheduledAt) - new Date()) < 12 * 60 * 60 * 1000;
  })();

  const earnings = booking.providerEarning || Math.round((booking.finalPrice || booking.estimatedPrice || booking.totalAmount || 0) * 0.8);

    return (
    <>
      <Card className={cn(
        "rounded-2xl overflow-hidden border transition-all",
        status === BOOKING_STATUS.REQUESTED ? "border-blue-200 shadow-md shadow-blue-900/5" : "border-slate-100"
      )}>

        {/* ── Compact Header ─────────────────────────── */}
        <div className={cn(
          "px-4 py-3 flex items-center justify-between",
          status === BOOKING_STATUS.REQUESTED ? "bg-slate-900" : "bg-slate-100"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base", service?.color || 'bg-blue-500/20')}>
              {service?.icon || '🩺'}
            </div>
            <div>
              <p className={cn("text-sm font-black leading-tight", status === BOOKING_STATUS.REQUESTED ? "text-white" : "text-slate-800")}>
                {service?.label || booking.service?.label || booking.service?.name || "Service"}
              </p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", status === BOOKING_STATUS.REQUESTED ? "text-slate-500" : "text-slate-400")}>
                #{booking._id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Right side badges */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <StatusPill status={booking.status} className="scale-75 origin-right" />
            {booking.paymentMethod === 'CASH' && (normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.COLLECTED) && (
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase">CASH COLLECTED</span>
            )}
            {normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID ? (
              <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase">PAID</span>
            ) : null}
            {status === BOOKING_STATUS.REQUESTED && (
              <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase", scoreColor)}>
                ⚡{smartScore.toFixed(2)}
              </span>
            )}
            {isUrgent && (
              <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">
                🔴 Urgent
              </span>
            )}
            {isLongShift && (
              <span className="text-[9px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded uppercase">
                ⏳ Long
              </span>
            )}
          </div>
        </div>

        {/* ── Compact Body ───────────────────────────── */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400">👤</span>
              <span className="font-bold text-slate-900">{booking.patient?.name || '—'}</span>
            </div>
            {status === BOOKING_STATUS.REQUESTED && (
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-md border uppercase",
                conflictStatus === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                conflictStatus === 'CONFLICT' ? 'bg-red-50 text-red-500 border-red-200' :
                'bg-amber-50 text-amber-600 border-amber-200'
              )}>
                {conflictStatus === 'AVAILABLE' ? '✓ Open' : conflictStatus === 'CONFLICT' ? '✕ Clash' : '⚠ Shift'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>📅 {scheduleDate}</span>
            <span className="text-slate-300">•</span>
            <span>⏱ {startTime} → {endTime}</span>
            <span className="text-slate-300">•</span>
            <span>{duration}h</span>
          </div>

          <p className="text-xs text-slate-500 truncate">📍 {booking.address || '—'}{booking.pincode ? ` · ${booking.pincode}` : ''}</p>

          <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">You Earn</span>
            <span className="text-base font-black text-emerald-600">₹{earnings.toLocaleString('en-IN')}</span>
          </div>

          {status === BOOKING_STATUS.REQUESTED && booking.expiresAt && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 font-black bg-red-50 py-1.5 px-3 rounded-lg border border-red-100">
              <Flame size={12} className="animate-pulse" />
              <CountdownTimer deadline={booking.expiresAt} onExpire={() => {}} />
            </div>
          )}
        </div>

        {/* ── Compact Action Footer ───────────────────── */}
        <div className="px-4 pb-4">
          {status === BOOKING_STATUS.REQUESTED && (
            <div className="flex gap-2">
              <button onClick={() => onStatusUpdate(booking._id, BOOKING_STATUS.CONFIRMED)} disabled={isUpdating} className="flex-1 text-sm font-black py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white transition-all">
                {isUpdating ? '...' : '✓ Accept'}
              </button>
              <button onClick={() => onStatusUpdate(booking._id, BOOKING_STATUS.CANCELLED)} disabled={isUpdating} className="flex-1 text-sm font-black py-2.5 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all">
                {isUpdating ? '...' : '✕ Decline'}
              </button>
            </div>
          )}

          {status === BOOKING_STATUS.CONFIRMED && (
            <div className="flex gap-2">
              <button onClick={() => onStatusUpdate(booking._id, BOOKING_STATUS.IN_PROGRESS)} disabled={isUpdating} className="flex-1 text-sm font-black py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white transition-all">
                {isUpdating ? '...' : '▶ Start Service'}
              </button>
              <button onClick={() => onUpdatePrice(booking)} className="text-sm font-black py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all">₹ Edit</button>
            </div>
          )}

          {status === BOOKING_STATUS.IN_PROGRESS && (
            <div className="flex gap-2">
              <button onClick={() => onStatusUpdate(booking._id, BOOKING_STATUS.COMPLETED)} disabled={isUpdating} className="flex-1 text-sm font-black py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white transition-all">
                {isUpdating ? '...' : (() => { const end = booking.scheduledAt ? new Date(new Date(booking.scheduledAt).getTime() + (booking.durationHours || 1) * 3600000) : null; return (end && new Date() > end) ? 'Mark Completed (Late)' : 'Mark Completed'; })()}
              </button>
            </div>
          )}

          {/* ── COMPLETED + COD: show Collect Cash button ────────────── */}
          {status === BOOKING_STATUS.COMPLETED && booking.paymentMethod === 'CASH' && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.PAID && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.PENDING_CONFIRMATION && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.COLLECTED && (
            <div className="flex gap-2 mb-2">
              <button onClick={() => setCashModalOpen(true)} disabled={collecting} className="flex-1 text-sm font-black py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white transition-all">{collecting ? '...' : 'Collect Cash'}</button>
            </div>
          )}

          {/* ── COLLECTED: awaiting patient confirmation ──────────────── */}
          {status === BOOKING_STATUS.COLLECTED && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg mt-0.5">⏳</span>
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wide">Cash Collected — Awaiting Patient Confirmation</p>
                <p className="text-[11px] text-amber-600 mt-0.5">You'll be credited once the patient confirms the amount (₹{booking.collectedAmount || booking.totalAmount}). This usually takes a few minutes.</p>
              </div>
            </div>
          )}

          {(status === BOOKING_STATUS.COMPLETED || status === BOOKING_STATUS.CANCELLED) && booking.paymentMethod !== 'CASH' && (
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-black bg-slate-50 border border-slate-100 py-2.5 rounded-xl">
              <CheckCircle size={13} className="text-slate-300" /> Archived
            </div>
          )}
        </div>
      </Card>

      {/* Cash Collection Modal */}
      {cashModalOpen && (
        <Modal isOpen={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Collect Cash">
          <div className="space-y-4 p-1">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</label>
              <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xl font-black outline-none focus:ring-2 focus:ring-blue-500/10" value={cashAmount} onChange={e => setCashAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Note (optional)</label>
              <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 h-24" value={cashNote} onChange={e => setCashNote(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCashModalOpen(false)} className="flex-1 btn-secondary-sm !py-3.5">Cancel</button>
              <button onClick={async () => { if (collecting) return; setCollecting(true); try { await bookingService.collectCash(booking._id, { amount: cashAmount, note: cashNote }); toast.success('Cash collected'); setCashModalOpen(false); onRefresh && onRefresh(); } catch (err) { toast.error(err.response?.data?.message || 'Collect failed'); } finally { setCollecting(false); } }} disabled={!cashAmount || collecting} className="flex-1 btn-primary-sm !bg-amber-500 !py-3.5 text-white">{collecting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}


