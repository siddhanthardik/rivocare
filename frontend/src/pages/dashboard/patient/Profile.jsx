import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { User, Phone, MapPin, Key } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Avatar from '../../../components/ui/Avatar';

export default function PatientProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    pincode: user?.pincode || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = 'Must be exactly 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await authService.updateProfile(form);
      updateUser(data.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="text-slate-500">Manage your personal information and preferences.</p>
      </div>

      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar name={user.name} size="xl" className="w-24 h-24 text-2xl border-4 border-white shadow-sm" />
        <div className="text-center sm:text-left flex-1">
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <p className="text-slate-500 mb-4">{user.email}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="badge bg-primary-50 text-primary-700 capitalize">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="section-title">Personal Information</h3>
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Full Name" icon={User} value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Email" type="email" value={user.email} disabled hint="Email cannot be changed" />
            <Input label="Phone Number" icon={Phone} value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} error={errors.phone} />
            <Input label="Pincode" icon={MapPin} value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} error={errors.pincode} maxLength={6} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Full Address</label>
            <textarea
              className="input-base"
              rows={3}
              placeholder="House, street area..."
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={loading} size="lg">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
