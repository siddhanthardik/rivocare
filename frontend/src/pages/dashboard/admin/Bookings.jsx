import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { bookingService, adminService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { ShieldAlert, IndianRupee, AlertCircle, CheckCircle, Crown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Price source badge ────────────────────────────────────────
function PriceSourceBadge({ booking }) {
  if (booking.pricingType === 'OVERRIDE') {
    return (
      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200">
        <Crown size={11} /> Admin Override
      </span>
    );
  }
  if (booking.priceSetBy === 'PROVIDER' || booking.priceUpdated) {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
        Provider Updated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
      Standard
    </span>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Override Modal
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ overridePrice: '', reason: '' });
  const [saving, setSaving] = useState(false);

  // Detail Modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    bookingService.getAll({ 
      page, 
      limit: 10, 
      status: filter !== 'all' ? filter : undefined,
      q: debouncedSearch || undefined
    })
      .then((res) => {
        setBookings(res.data.bookings || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [refresh, filter, page, debouncedSearch]);

  const openOverride = (booking) => {
    setOverrideTarget(booking);
    setOverrideForm({
      overridePrice: booking.finalPrice || booking.estimatedPrice || booking.totalAmount || '',
      reason: booking.overrideReason || '',
    });
    setOverrideModal(true);
  };

  const submitOverride = async () => {
    const price = Number(overrideForm.overridePrice);
    if (!price || price <= 0) return toast.error('Enter a valid price greater than 0');
    if (!overrideForm.reason.trim()) return toast.error('Reason is required for admin override');
    setSaving(true);
    try {
      await adminService.setAdminPrice(overrideTarget._id, {
        overridePrice: price,
        reason: overrideForm.reason.trim(),
      });
      toast.success(`Admin price override applied: ₹${price}`);
      setOverrideModal(false);
      setRefresh((r) => r + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally {
      setSaving(false);
    }
  };

  // Which bookings can be overridden (not paid, not cancelled)
  const canOverride = (b) =>
    b.paymentStatus !== 'PAID' && !['cancelled'].includes(b.status);

  if (loading && bookings.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Bookings</h1>
          <p className="text-slate-500">Monitor and manage all platform consultation requests.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search ID, Patient, Provider..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 py-2 text-sm w-full sm:w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
            {['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filter === f ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {bookings.length === 0 ? (
          <EmptyState title="No bookings found" description="No platform bookings match the selected filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">ID & Date</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Patient & Provider</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Pricing</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => {
                    const effectivePrice = b.pricingType === 'OVERRIDE'
                      ? b.overridePrice
                      : (b.finalAmount || b.amount || b.totalAmount || 0);

                    return (
                      <tr
                        key={b._id}
                        onClick={() => { setDetailTarget(b); setDetailModal(true); }}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${b.pricingType === 'OVERRIDE' ? 'bg-purple-50/30' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs text-slate-400 mb-1" title={b._id}>...{b._id.slice(-6)}</p>
                          <p className="font-medium text-slate-800 whitespace-nowrap">{formatDateTime(b.scheduledAt)}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span>{SERVICE_CONFIG[b.service]?.icon}</span>
                            <span className="font-medium text-slate-800">{SERVICE_CONFIG[b.service]?.label}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{b.durationHours} hr{b.durationHours > 1 ? 's' : ''}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="mb-2">
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">👤 Patient</span>
                            <p className="font-medium text-slate-800">{b.patient?.name}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">⚕️ Provider</span>
                            <p className="font-medium text-slate-800">{b.provider?.user?.name}</p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <Badge status={b.status} />
                          {b.paymentStatus === 'PAID' && (
                            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                              <CheckCircle size={11} /> Paid
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <PriceSourceBadge booking={b} />
                          <div className="mt-2 text-xs space-y-0.5 text-slate-500">
                            <p>Base: ₹{b.basePrice || 0}</p>
                            <p>Markup: ₹{b.providerMarkup || 0}</p>
                            <p>Estimated: ₹{b.estimatedPrice || b.totalAmount}</p>
                            {b.pricingType === 'OVERRIDE' && (
                              <p className="text-purple-700 font-semibold">Override: ₹{b.overridePrice}</p>
                            )}
                            {b.overrideReason && (
                              <p className="text-purple-600 italic truncate max-w-[160px]" title={b.overrideReason}>
                                "{b.overrideReason}"
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className={`font-bold text-lg ${b.pricingType === 'OVERRIDE' ? 'text-purple-700' : 'text-slate-800'}`}>
                            {formatCurrency(effectivePrice)}
                          </span>
                          {b.pricingType === 'OVERRIDE' && b.estimatedPrice !== effectivePrice && (
                            <p className="text-xs text-slate-400 line-through text-right">
                              ₹{b.estimatedPrice}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {canOverride(b) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 ml-auto"
                              onClick={(e) => { e.stopPropagation(); openOverride(b); }}
                            >
                              <Crown size={13} />
                              Set Price
                            </Button>
                          )}
                          {b.paymentStatus === 'PAID' && (
                            <span className="text-xs text-slate-400 italic">Paid — locked</span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="text-xs text-slate-400 italic">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`h-8 w-8 text-xs font-bold rounded-lg transition-colors ${
                              page === p ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                      if (p === page - 2 || p === page + 2) {
                        return <span key={p} className="text-slate-400 text-xs px-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Price Override Modal */}
      <Modal
        isOpen={overrideModal}
        onClose={() => !saving && setOverrideModal(false)}
        title="Set Custom Price (Admin Override)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOverrideModal(false)} disabled={saving}>Cancel</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={submitOverride}
              loading={saving}
            >
              Apply Override
            </Button>
          </>
        }
      >
        {overrideTarget && (
          <div className="space-y-5">
            {/* Context */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm space-y-1">
              <p className="font-semibold text-slate-800">
                {SERVICE_CONFIG[overrideTarget.service]?.icon} {SERVICE_CONFIG[overrideTarget.service]?.label}
              </p>
              <p className="text-slate-600">Patient: <strong>{overrideTarget.patient?.name}</strong></p>
              <p className="text-slate-600">Provider: <strong>{overrideTarget.provider?.user?.name}</strong></p>
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-0.5">
                <p>Base Price: ₹{overrideTarget.basePrice}</p>
                <p>Provider Markup: ₹{overrideTarget.providerMarkup}</p>
                <p className="font-semibold text-slate-700">
                  Current Price: ₹{overrideTarget.finalPrice || overrideTarget.estimatedPrice || overrideTarget.totalAmount}
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm text-purple-800">
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
              <p>
                This <strong>Admin Override</strong> bypasses standard pricing. The new price will be applied <strong>immediately</strong> and both patient and provider will be notified.
              </p>
            </div>

            {/* Override price input */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Custom Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                <input
                  type="number"
                  min="1"
                  className="input-base pl-8"
                  placeholder="e.g. 750"
                  value={overrideForm.overridePrice}
                  onChange={(e) => setOverrideForm((f) => ({ ...f, overridePrice: e.target.value }))}
                />
              </div>
            </div>

            {/* Reason (required) */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-base"
                rows={3}
                placeholder="e.g. Special patient case, government scheme, correction of error..."
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm((f) => ({ ...f, reason: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Reason is mandatory and will be shown to the patient.
              </p>
            </div>

            {/* Preview */}
            {overrideForm.overridePrice > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm">
                <p className="font-semibold text-purple-800 mb-1">Override Preview</p>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Standard Estimated</span>
                  <span className="line-through">₹{overrideTarget.estimatedPrice || overrideTarget.totalAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-purple-700 mt-1">
                  <span>Admin Override Price</span>
                  <span>₹{overrideForm.overridePrice}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Admin Booking Detail Modal */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="Booking Pricing Details"
      >
        {detailTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Service</p>
                <p className="font-semibold text-slate-800">{SERVICE_CONFIG[detailTarget.service]?.label || 'Unknown'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Duration</p>
                <p className="font-semibold text-slate-800">{detailTarget.durationHours || 1} hour(s)</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Pricing Source</p>
                <p className="font-semibold text-slate-800 capitalize">{detailTarget.pricingSource || 'Legacy / Service'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Plan</p>
                <p className="font-semibold text-slate-800">{detailTarget.plan ? 'Yes (Attached)' : 'None'}</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-4">
              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">Financial Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Base Service Price</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(detailTarget.basePrice || 0)}</span>
                </div>
                {detailTarget.pricingSource === 'plan' && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Plan Price</span>
                    <span className="font-bold text-emerald-900">{formatCurrency(detailTarget.planPrice || 0)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200 flex justify-between font-black text-lg text-emerald-900">
                  <span>Final Fixed Amount</span>
                  <span>{formatCurrency(detailTarget.finalAmount || detailTarget.amount || detailTarget.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
