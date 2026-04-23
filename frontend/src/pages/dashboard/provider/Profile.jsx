import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Phone, MapPin, Briefcase, TrendingUp, IndianRupee, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService, providerService } from '../../../services';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';

export default function ProviderProfile() {
  const { user, updateUser } = useAuth();
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  const [userForm, setUserForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    pincode: user?.pincode || '',
  });

  const [providerForm, setProviderForm] = useState({
    bio: '',
    experience: 0,
    services: [],
    markup: 0,
  });

  const availableServices = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'physiotherapist', label: 'Physiotherapist' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'caretaker', label: 'Caretaker' },
  ];

  useEffect(() => {
    authService.getMe()
      .then((res) => {
        const p = res.data.data.providerProfile;
        setProviderProfile(p);
        setProviderForm({
          bio: p?.bio || '',
          experience: p?.experience || 0,
          services: p?.services || [],
          markup: p?.markup || 0,
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.phone.trim()) return toast.error('Name and phone are required');
    setSavingUser(true);
    try {
      const { data } = await authService.updateProfile(userForm);
      updateUser(data.data.user);
      toast.success('Personal info updated');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSavingUser(false);
    }
  };

  const handleProviderUpdate = async (e) => {
    e.preventDefault();
    if (providerForm.services.length === 0) return toast.error('Select at least one service');
    setSavingProvider(true);
    try {
      const { data } = await providerService.updateProfile({
        ...providerForm,
        experience: Number(providerForm.experience),
        markup: Number(providerForm.markup) || 0,
      });
      setProviderProfile(data.data.provider);
      toast.success('Professional profile updated');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSavingProvider(false);
    }
  };

  const toggleService = (service) => {
    setProviderForm(prev => {
      const current = new Set(prev.services);
      if (current.has(service)) current.delete(service);
      else current.add(service);
      return { ...prev, services: Array.from(current) };
    });
  };

  if (loading) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Profile Settings</h1>
        <p className="text-slate-500">Manage your personal and professional information.</p>
      </div>

      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar name={user.name} size="xl" className="w-24 h-24 text-2xl border-4 border-white shadow-sm" />
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            {providerProfile?.isVerified ? (
              <Badge status="confirmed" label="Verified Professional" />
            ) : (
              <Badge status="pending" label="Pending Verification" />
            )}
          </div>
          <p className="text-slate-500 mb-4">{user.email}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <span className="badge bg-primary-50 text-primary-700">⭐ {providerProfile?.rating.toFixed(1)} Rating</span>
            <span className="badge bg-purple-50 text-purple-700">{providerProfile?.completedBookings} Bookings</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="section-title">Professional Details</h3>
        </div>
        <form onSubmit={handleProviderUpdate} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Services Offered</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {availableServices.map((svc) => (
                <button
                  key={svc.value}
                  type="button"
                  onClick={() => toggleService(svc.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    providerForm.services.includes(svc.value)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {svc.label}
                </button>
              ))}
            </div>
            {providerForm.services.length === 0 && <p className="text-xs text-red-500 mt-1">Please select at least one service.</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input 
              label="Years of Experience" 
              type="number" 
              icon={Briefcase} 
              min={0}
              value={providerForm.experience} 
              onChange={(e) => setProviderForm(f => ({ ...f, experience: e.target.value }))} 
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                Your Markup (₹ per hour)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={providerForm.markup}
                  onChange={(e) => setProviderForm(f => ({ ...f, markup: e.target.value }))}
                  className="input-base pl-8"
                  placeholder="e.g. 150"
                />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info size={11} /> Added on top of admin base price. Subject to platform cap.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Professional Bio</label>
            <textarea
              className="input-base"
              rows={4}
              placeholder="Tell patients about your background, certification, and approach to care..."
              value={providerForm.bio}
              onChange={(e) => setProviderForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={savingProvider} size="lg">
              Save Professional Info
            </Button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="section-title">Personal Information</h3>
        </div>
        <form onSubmit={handleUserUpdate} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Full Name" icon={User} value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email" type="email" value={user.email} disabled hint="Email cannot be changed" />
            <Input label="Phone Number" icon={Phone} value={userForm.phone} onChange={(e) => setUserForm(f => ({ ...f, phone: e.target.value }))} hint="10-digit mobile number" />
            <Input label="Pincode" icon={MapPin} value={userForm.pincode} onChange={(e) => setUserForm(f => ({ ...f, pincode: e.target.value }))} maxLength={6} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Home Address</label>
            <textarea
              className="input-base"
              rows={2}
              placeholder="House, street area..."
              value={userForm.address}
              onChange={(e) => setUserForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" loading={savingUser} size="lg">
              Save Personal Info
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
