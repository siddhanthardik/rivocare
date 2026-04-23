import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { IndianRupee, Pencil, TrendingUp, ShieldCheck, Info } from 'lucide-react';

const SERVICE_ICONS = {
  nurse: '🏥',
  physiotherapist: '🧘',
  doctor: '👨‍⚕️',
  caretaker: '🤝',
};

const SERVICE_LABELS = {
  nurse: 'Nurse',
  physiotherapist: 'Physiotherapist',
  doctor: 'Doctor',
  caretaker: 'Caretaker',
};

export default function AdminServicePricing() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ basePrice: '', maxMarkupAllowed: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminService.getServicePricing();
      setServices(res.data.data.services || []);
    } catch {
      toast.error('Failed to load service pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (svc) => {
    setEditTarget(svc);
    setForm({ basePrice: svc.basePrice, maxMarkupAllowed: svc.maxMarkupAllowed });
  };

  const handleSave = async () => {
    const base = Number(form.basePrice);
    const maxMarkup = Number(form.maxMarkupAllowed);
    if (!base || base < 0) return toast.error('Enter a valid base price');
    if (maxMarkup < 0) return toast.error('Max markup cannot be negative');
    setSaving(true);
    try {
      await adminService.updateServicePricing(editTarget._id, { basePrice: base, maxMarkupAllowed: maxMarkup });
      toast.success(`${SERVICE_LABELS[editTarget.name]} pricing updated!`);
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Service Pricing</h1>
        <p className="text-slate-500">Control base rates and provider markup limits for each service type.</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How pricing works</p>
          <p>
            <strong>Base Price</strong> is set by admin per service (per hour).{' '}
            <strong>Provider Markup</strong> is an additional amount providers can charge (capped by Max Markup Allowed).{' '}
            The patient sees: <code className="bg-blue-100 px-1 rounded">Estimated = Base + Markup</code>.
          </p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {services.map((svc) => (
          <div key={svc._id} className="card p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{SERVICE_ICONS[svc.name] || '🏥'}</span>
                <div>
                  <p className="font-bold text-slate-800 capitalize">{SERVICE_LABELS[svc.name] || svc.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${svc.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {svc.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <IndianRupee size={14} />
                  <span>Base Price / hr</span>
                </div>
                <span className="font-bold text-slate-900 text-lg">₹{svc.basePrice}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <TrendingUp size={14} />
                  <span>Max Markup</span>
                </div>
                <span className="font-bold text-amber-800 text-lg">₹{svc.maxMarkupAllowed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-700 text-sm">
                  <ShieldCheck size={14} />
                  <span>Max Total</span>
                </div>
                <span className="font-bold text-indigo-800 text-lg">₹{svc.basePrice + svc.maxMarkupAllowed}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-1.5 mt-auto"
              onClick={() => openEdit(svc)}
            >
              <Pencil size={14} />
              Edit Pricing
            </Button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => !saving && setEditTarget(null)}
        title={editTarget ? `Edit ${SERVICE_LABELS[editTarget.name]} Pricing` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700">
              <p>Updating pricing for <strong className="capitalize">{SERVICE_LABELS[editTarget.name]}</strong>.</p>
              <p className="mt-1 text-slate-500">Changes apply to all <em>new</em> bookings immediately.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Base Price (₹ per hour) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  className="input-base pl-8"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) => setForm(f => ({ ...f, basePrice: e.target.value }))}
                  placeholder="e.g. 300"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Max Markup Allowed (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                <input
                  type="number"
                  className="input-base pl-8"
                  min="0"
                  value={form.maxMarkupAllowed}
                  onChange={(e) => setForm(f => ({ ...f, maxMarkupAllowed: e.target.value }))}
                  placeholder="e.g. 500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Provider markup is capped at this amount on top of base price.
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1.5 text-sm">
              <p className="font-semibold text-indigo-800 mb-2">Price Preview</p>
              <div className="flex justify-between text-slate-700">
                <span>Base Price</span>
                <span className="font-medium">₹{Number(form.basePrice) || 0}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>+ Max Markup</span>
                <span className="font-medium">₹{Number(form.maxMarkupAllowed) || 0}</span>
              </div>
              <div className="border-t border-indigo-200 pt-1.5 flex justify-between text-indigo-900 font-bold">
                <span>Max Possible Price / hr</span>
                <span>₹{(Number(form.basePrice) || 0) + (Number(form.maxMarkupAllowed) || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
