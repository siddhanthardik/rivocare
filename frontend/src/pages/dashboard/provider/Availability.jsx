import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { providerService, authService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';

export default function ProviderAvailability() {
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isOnline, setIsOnline] = useState(false);
  const [pincodes, setPincodes] = useState('');
  const [price, setPrice] = useState(300);

  useEffect(() => {
    authService.getMe()
      .then((res) => {
        const p = res.data.data.providerProfile;
        setProvider(p);
        setIsOnline(p?.isOnline || false);
        setPincodes(p?.pincodesServed?.join(', ') || '');
        setPrice(p?.pricePerHour || 300);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async () => {
    try {
      const res = await providerService.toggleAvailability();
      setIsOnline(res.data.data.isOnline);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const pincodesArray = pincodes.split(',').map(p => p.trim()).filter(p => p.length === 6);
      await providerService.updateProfile({ pincodesServed: pincodesArray, pricePerHour: Number(price) });
      toast.success('Availability settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Availability Settings</h1>
        <p className="text-slate-500">Manage when and where you want to work.</p>
      </div>

      {/* Online/Offline Toggle */}
      <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Current Status</h2>
          <p className="text-sm text-slate-500">Toggle whether you're currently accepting new booking requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="font-medium text-slate-700">{isOnline ? 'Online - Receiving Requests' : 'Offline - Not Available'}</span>
          </div>
          <button
            onClick={toggleStatus}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="section-title">Service Details</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><MapPin size={16} /> Pincodes Served</label>
            <input
              type="text"
              className="input-base"
              placeholder="e.g. 400001, 400002"
              value={pincodes}
              onChange={(e) => setPincodes(e.target.value)}
            />
            <p className="text-xs text-slate-500">Comma-separated list of 6-digit pincodes where you offer services.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><Clock size={16} /> Hourly Rate (₹)</label>
            <input
              type="number"
              className="input-base max-w-xs"
              min={100}
              step={50}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <p className="text-xs text-slate-500">Your base rate per hour of service.</p>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={saveSettings} loading={saving} size="lg">Save Details</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
