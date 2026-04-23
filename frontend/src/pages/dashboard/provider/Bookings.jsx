import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import CountdownTimer from '../../../components/ui/CountdownTimer';
import { Flame, IndianRupee, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function PriceBreakdown({ booking }) {
  const base = booking.basePrice || 0;
  const markup = booking.providerMarkup || 0;
  const estimated = booking.estimatedPrice || booking.totalAmount || 0;
  const final = booking.finalPrice;
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
        <IndianRupee size={12} className="text-slate-500" /> Price Breakdown
      </p>
      <div className="flex justify-between text-slate-600">
        <span>Base Price</span><span>₹{base}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>Your Markup</span><span>₹{markup}</span>
      </div>
      <div className="border-t border-slate-200 pt-1 flex justify-between font-semibold text-slate-800">
        <span>Estimated</span><span>₹{estimated}</span>
      </div>
      {final && (
        <div className="flex justify-between font-bold text-indigo-700 bg-indigo-50 rounded px-2 py-1 mt-1">
          <span>Updated Price</span><span>₹{final}</span>
        </div>
      )}
      {booking.pricingType === 'OVERRIDE' && (
        <div className="flex justify-between font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded px-2 py-1 mt-1">
          <span className="flex items-center gap-1">👑 Admin Override</span><span>₹{booking.overridePrice}</span>
        </div>
      )}
      {booking.overrideReason && booking.pricingType === 'OVERRIDE' && (
        <p className="text-xs text-purple-600 italic px-1 mt-0.5">Reason: {booking.overrideReason}</p>
      )}
      {booking.priceUpdated && !booking.priceApprovedByPatient && (
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1">
          <Clock size={11} /> <span>Awaiting patient approval</span>
        </div>
      )}
      {booking.priceUpdated && booking.priceApprovedByPatient && (
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 rounded px-2 py-1 mt-1">
          <CheckCircle size={11} /> <span>Patient approved</span>
        </div>
      )}
    </div>
  );
}

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  // Price Update Modal
  const [priceModal, setPriceModal] = useState(false);
  const [priceTarget, setPriceTarget] = useState(null);
  const [priceForm, setPriceForm] = useState({ newFinalPrice: '', reason: '' });
  const [savingPrice, setSavingPrice] = useState(false);

  // Auto-poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => setRefresh(r => r + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bookingService.getAll({ limit: 50, ...(filter !== 'all' && { status: filter }) })
      .then((res) => setBookings(res.data.data.bookings))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [refresh, filter]);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await bookingService.updateStatus(id, { status });
      toast.success(`Booking ${status}`);
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
      reason: '',
    });
    setPriceModal(true);
  };

  const submitPriceUpdate = async () => {
    const val = Number(priceForm.newFinalPrice);
    if (!val || val <= 0) return toast.error('Enter a valid price');
    setSavingPrice(true);
    try {
      await bookingService.updatePrice(priceTarget._id, {
        newFinalPrice: val,
        reason: priceForm.reason || 'Price updated by provider',
      });
      toast.success('Price updated! Patient has been notified.');
      setPriceModal(false);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Price update failed');
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading && bookings.length === 0) return <PageLoader />;

  const canUpdatePrice = (b) =>
    ['confirmed', 'in-progress'].includes(b.status) &&
    !(b.priceUpdated && !b.priceApprovedByPatient); // block if already pending approval

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Booking Requests</h1>
          <p className="text-slate-500">Manage incoming requests and your schedule.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          {['all', 'pending', 'confirmed', 'in-progress', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${filter === f ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {bookings.length === 0 ? (
          <EmptyState title={`No ${filter !== 'all' ? filter : ''} bookings`} description="No bookings match the selected filter." />
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((b) => (
              <div
                key={b._id}
                className={`p-5 sm:p-6 flex flex-col sm:flex-row justify-between gap-6 transition-colors
                  ${b.status === 'pending' ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50'}
                  ${b.priceUpdated && !b.priceApprovedByPatient ? 'border-l-4 border-amber-400' : ''}
                `}
              >
                {/* Left */}
                <div className="flex gap-4 sm:gap-6 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${SERVICE_CONFIG[b.service].color}`}>
                    {SERVICE_CONFIG[b.service].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-lg text-slate-800">{b.patient.name}</h4>
                      <Badge status={b.status} />
                      {b.status === 'pending' && (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                          <Flame size={12} /> New
                        </span>
                      )}
                      {b.pricingType === 'OVERRIDE' && (
                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-purple-200">
                          👑 Admin Adjusted
                        </span>
                      )}
                      {b.priceUpdated && !b.priceApprovedByPatient && b.pricingType !== 'OVERRIDE' && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <AlertCircle size={11} /> Awaiting Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-0.5">{SERVICE_CONFIG[b.service].label}</p>
                    <p className="text-sm text-slate-500 mb-2">
                      {formatDateTime(b.scheduledAt)} • {b.durationHours} hr{b.durationHours > 1 ? 's' : ''}
                    </p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><strong>Location:</strong> {b.address}, {b.pincode}</p>
                      <p className="flex items-center flex-wrap gap-2">
                        <span><strong>Phone:</strong> {b.patient.phone}</span>
                        {b.status === 'pending' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-xs font-medium">Hidden until accepted</span>
                        )}
                      </p>
                      {b.notes && <p><strong>Notes:</strong> {b.notes}</p>}
                      {b.priceUpdateReason && b.priceUpdated && (
                        <p className="text-indigo-600"><strong>Price reason:</strong> {b.priceUpdateReason}</p>
                      )}
                    </div>

                    {/* Price breakdown */}
                    {['confirmed', 'in-progress', 'completed'].includes(b.status) && (
                      <PriceBreakdown booking={b} />
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-start sm:items-end justify-between gap-4 shrink-0 border-t sm:border-none pt-4 sm:pt-0 min-w-[200px]">
                  <div className="flex flex-col items-start sm:items-end w-full">
                    <span className="text-sm font-medium text-slate-500 mb-0.5">You earn:</span>
                    <span className="text-3xl font-black text-emerald-600 mb-1">
                      {formatCurrency((b.finalPrice || b.estimatedPrice || b.totalAmount) * 0.8)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Total: {formatCurrency(b.finalPrice || b.estimatedPrice || b.totalAmount)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full">
                    {b.status === 'pending' && (
                      <div className="w-full flex justify-start sm:justify-end">
                        <CountdownTimer expiresAt={b.expiresAt} onExpire={() => setRefresh(r => r + 1)} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 w-full justify-start sm:justify-end">
                      {b.status === 'pending' && (
                        <>
                          <Button variant="danger" size="sm" loading={updatingId === b._id} onClick={() => handleStatusUpdate(b._id, 'cancelled')}>Decline</Button>
                          <Button
                            variant="success" size="sm"
                            disabled={b.expiresAt && new Date() > new Date(b.expiresAt)}
                            loading={updatingId === b._id}
                            onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <Button size="sm" loading={updatingId === b._id} onClick={() => handleStatusUpdate(b._id, 'in-progress')}>
                          Mark In Progress
                        </Button>
                      )}
                      {b.status === 'in-progress' && (
                        <Button
                          variant="success" size="sm"
                          loading={updatingId === b._id}
                          disabled={b.priceUpdated && !b.priceApprovedByPatient}
                          title={b.priceUpdated && !b.priceApprovedByPatient ? 'Waiting for patient to approve updated price' : ''}
                          onClick={() => handleStatusUpdate(b._id, 'completed')}
                        >
                          {b.priceUpdated && !b.priceApprovedByPatient ? '⏳ Awaiting Approval' : 'Complete Service'}
                        </Button>
                      )}

                      {/* Update Price button */}
                      {canUpdatePrice(b) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => openPriceModal(b)}
                        >
                          <TrendingUp size={13} />
                          Update Price
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Price Modal */}
      <Modal
        isOpen={priceModal}
        onClose={() => !savingPrice && setPriceModal(false)}
        title="Update Service Price"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPriceModal(false)} disabled={savingPrice}>Cancel</Button>
            <Button onClick={submitPriceUpdate} loading={savingPrice}>Send Update to Patient</Button>
          </>
        }
      >
        {priceTarget && (
          <div className="space-y-5">
            {/* Context */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 space-y-1">
              <p className="font-semibold text-slate-800">Booking for: {priceTarget.patient?.name}</p>
              <p>Service: <strong>{SERVICE_CONFIG[priceTarget.service]?.label}</strong></p>
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between"><span>Base Price</span><span>₹{priceTarget.basePrice}</span></div>
                <div className="flex justify-between"><span>Your Markup</span><span>₹{priceTarget.providerMarkup}</span></div>
                <div className="flex justify-between font-semibold"><span>Estimated Total</span><span>₹{priceTarget.estimatedPrice}</span></div>
              </div>
            </div>

            {/* Information */}
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p>The patient will be notified and must <strong>approve</strong> before the booking can be completed.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                New Final Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  className="input-base pl-8"
                  placeholder={`e.g. ${priceTarget.estimatedPrice}`}
                  value={priceForm.newFinalPrice}
                  onChange={(e) => setPriceForm(f => ({ ...f, newFinalPrice: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Reason <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                className="input-base"
                rows={3}
                placeholder="e.g. Extra time required, additional care provided..."
                value={priceForm.reason}
                onChange={(e) => setPriceForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
