import { useState, useEffect } from 'react';
import { MapPin, Plus, Power, ShieldAlert } from 'lucide-react';
import { adminService } from '../../../services';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function ServiceAreas() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pincode: '',
    areaName: '',
    city: '',
    state: '',
    isActive: true
  });

  useEffect(() => {
    fetchPincodes();
  }, []);

  const fetchPincodes = async () => {
    try {
      const res = await adminService.getPincodes();
      setPincodes(res.data.data.pincodes);
    } catch (err) {
      toast.error('Failed to load service areas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await adminService.togglePincode(id);
      setPincodes(prev => prev.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
      toast.success(`Pincode ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(formData.pincode)) {
      return toast.error('Pincode must be exactly 6 digits');
    }
    if (!formData.areaName || !formData.city || !formData.state) {
      return toast.error('Area Name, City, and State are required');
    }

    setSubmitting(true);
    try {
      const res = await adminService.addPincode(formData);
      setPincodes(prev => [res.data.data.pincode, ...prev]);
      toast.success('Service area added successfully');
      setModalOpen(false);
      setFormData({ pincode: '', areaName: '', city: '', state: '', isActive: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add service area');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MapPin className="text-primary-600" /> Service Areas
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Manage authorized pincodes where the platform is available.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="shrink-0 flex items-center gap-1.5 whitespace-nowrap">
          <Plus size={16} /> Add Pincode
        </Button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin text-primary-600">⌛</div></div>
        ) : pincodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
              <MapPin size={24} />
            </div>
            <p className="text-slate-600 font-medium">No service areas found</p>
            <p className="text-sm text-slate-400 mt-1">Add pincodes to allow bookings in specific regions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Pincode</th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Area Name</th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-sm">City & State</th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-sm">Status</th>
                  <th className="py-4 px-6 font-semibold text-slate-700 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pincodes.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 font-mono bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">
                        <MapPin size={12} className="text-slate-500" />
                        {p.pincode}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="font-medium text-slate-800">{p.areaName || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-800">{p.city}</p>
                      <p className="text-xs text-slate-500">{p.state}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={p.isActive ? 'success' : 'warning'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggle(p._id, p.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          p.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        <Power size={14} />
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Service Area" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 flex gap-3 items-start text-sm">
            <ShieldAlert className="shrink-0 mt-0.5" size={16} />
            <p>Only users within active service areas can request bookings. Ensure the pincode is valid.</p>
          </div>

          <Input
            label="Pincode (6 digits)"
            placeholder="e.g. 400001"
            value={formData.pincode}
            onChange={e => setFormData({ ...formData, pincode: e.target.value })}
            required
            maxLength={6}
          />
          <Input
            label="Area Name"
            placeholder="e.g. South Delhi, Andheri West"
            value={formData.areaName}
            onChange={e => setFormData({ ...formData, areaName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Input
              label="State"
              placeholder="e.g. Maharashtra"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Set as Active immediately
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Add Region</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
