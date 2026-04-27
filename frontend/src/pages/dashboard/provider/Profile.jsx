import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  Info, 
  ShieldCheck, 
  Calendar, 
  Globe, 
  Navigation,
  CreditCard,
  Lock,
  LogOut,
  Map as MapIcon,
  Search
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService, providerService } from '../../../services';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import Badge from '../../../components/ui/Badge';
import { cn } from '../../../utils';
import ProfilePhotoUploader from '../../../components/dashboard/ProfilePhotoUploader';

export default function ProviderProfile() {
  const { user, updateUser, logout } = useAuth();
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    // User fields
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob ? new Date(user?.dob).toISOString().split('T')[0] : '',
    
    // Provider fields
    bio: '',
    experience: 0,
    role: '',
    qualification: '',
    regNumber: '',
    languages: [],
    serviceRadius: 10,
    consultationMode: 'BOTH',
    
    // Address fields
    addressType: 'HOME',
    pincode: user?.pincode || '',
    city: '',
    state: '',
    locality: '',
    landmark: '',
    houseNumber: '',
    fullAddress: user?.address || '',
    latitude: null,
    longitude: null,
    
    // Bank fields
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: ''
  });

  const roles = [
    'Physiotherapist',
    'Nurse',
    'Caregiver',
    'Doctor',
    'Attendant',
    'Nanny',
    'Elder Care Expert'
  ];

  useEffect(() => {
    authService.getMe()
      .then((res) => {
        const u = res.data.data.user;
        const p = res.data.data.providerProfile;
        setProviderProfile(p);
        setForm(prev => ({
          ...prev,
          name: u.name || '',
          phone: u.phone || '',
          gender: u.gender || '',
          dob: u.dob ? new Date(u.dob).toISOString().split('T')[0] : '',
          pincode: u.pincode || '',
          fullAddress: u.address || '',
          
          bio: p?.bio || '',
          experience: p?.experience || 0,
          role: p?.role || roles[0],
          qualification: p?.qualification || '',
          regNumber: p?.regNumber || '',
          languages: p?.languages || [],
          serviceRadius: p?.serviceRadius || 10,
          consultationMode: p?.consultationMode || 'BOTH',
          
          city: p?.addressDetails?.city || '',
          state: p?.addressDetails?.state || '',
          locality: p?.addressDetails?.locality || '',
          landmark: p?.addressDetails?.landmark || '',
          houseNumber: p?.addressDetails?.houseNumber || '',
          latitude: p?.location?.coordinates?.[1] || null,
          longitude: p?.location?.coordinates?.[0] || null,
          
          bankName: p?.bankDetails?.bankName || '',
          accountHolder: p?.bankDetails?.accountHolder || '',
          accountNumber: p?.bankDetails?.accountNumber || '',
          ifsc: p?.bankDetails?.ifsc || ''
        }));
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // 1. Update User
      const { data: userRes } = await authService.updateProfile({
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        address: form.fullAddress,
        pincode: form.pincode
      });
      updateUser(userRes.data.user);

      // 2. Update Provider
      const { data: provRes } = await providerService.updateProfile({
        bio: form.bio,
        experience: Number(form.experience),
        role: form.role,
        qualification: form.qualification,
        regNumber: form.regNumber,
        languages: form.languages,
        serviceRadius: Number(form.serviceRadius),
        consultationMode: form.consultationMode,
        addressDetails: {
          city: form.city,
          state: form.state,
          locality: form.locality,
          landmark: form.landmark,
          houseNumber: form.houseNumber
        },
        location: form.latitude ? {
          type: 'Point',
          coordinates: [form.longitude, form.latitude]
        } : undefined,
        bankDetails: {
          bankName: form.bankName,
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          ifsc: form.ifsc
        }
      });
      setProviderProfile(provRes.data.provider);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };



  const handleUseLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm(f => ({ ...f, latitude, longitude }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const a = data.address;
          setForm(f => ({
            ...f,
            pincode: a.postcode || f.pincode,
            city: a.city || a.town || a.village || '',
            state: a.state || '',
            locality: a.suburb || a.neighbourhood || '',
            fullAddress: data.display_name || ''
          }));
          toast.success('Location fetched!');
        } catch (err) {
          toast.error('Coordinates set, but address lookup failed.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error('Permission denied');
        setLocating(false);
      }
    );
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* ── Sticky Header ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl py-6 border-b border-slate-100 -mx-6 px-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your professional identity and service settings.</p>
        </div>
        <Button 
          onClick={handleUpdate} 
          loading={saving} 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-2xl shadow-xl shadow-emerald-500/20 font-black"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        
        {/* ── SECTION 1: Personal Details ─────────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <User size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Profile Details</h2>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Avatar Section */}
            <ProfilePhotoUploader />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Full Name" 
                icon={User} 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-2xl"
              />
              <Input 
                label="Email Address" 
                type="email" 
                icon={Globe} 
                value={user.email} 
                disabled 
                hint="Contact support to change email"
                className="rounded-2xl bg-slate-50/50"
              />
              <Input 
                label="Phone Number" 
                icon={Phone} 
                value={form.phone} 
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="rounded-2xl"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-black text-slate-700 ml-1">Gender</label>
                <div className="flex gap-3 mt-1">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={cn(
                        "flex-1 py-3 rounded-2xl text-sm font-bold border transition-all",
                        form.gender === g ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <Input 
                label="Date of Birth" 
                type="date" 
                icon={Calendar} 
                value={form.dob} 
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Professional Details ────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Briefcase size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Professional Profile</h2>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-black text-slate-700 ml-1">Primary Role</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <Input 
                label="Experience (Years)" 
                type="number" 
                icon={TrendingUp} 
                value={form.experience} 
                onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                className="rounded-2xl"
              />
              <Input 
                label="Highest Qualification" 
                icon={ShieldCheck} 
                value={form.qualification} 
                onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                placeholder="e.g. B.Sc Nursing, BPT"
                className="rounded-2xl"
              />
              <Input 
                label="Registration Number" 
                icon={Lock} 
                value={form.regNumber} 
                onChange={e => setForm(f => ({ ...f, regNumber: e.target.value }))}
                placeholder="State council number"
                className="rounded-2xl"
              />
              <Input 
                label="Service Radius (km)" 
                type="number" 
                icon={Navigation} 
                value={form.serviceRadius} 
                onChange={e => setForm(f => ({ ...f, serviceRadius: e.target.value }))}
                className="rounded-2xl"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-black text-slate-700 ml-1">Consultation Mode</label>
                <div className="flex gap-3">
                  {['HOME_VISIT', 'ONLINE', 'BOTH'].map(m => (
                    <button
                      key={m}
                      onClick={() => setForm(f => ({ ...f, consultationMode: m }))}
                      className={cn(
                        "flex-1 py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all",
                        form.consultationMode === m ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300"
                      )}
                    >
                      {m.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-700 ml-1">About / Short Bio</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                rows={4}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Describe your expertise and approach to patient care..."
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Service Address (GPS) ────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <MapPin size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Service Address</h2>
            </div>
            <button 
              onClick={handleUseLocation}
              disabled={locating}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Navigation size={14} className={locating ? 'animate-spin' : ''} />
              {locating ? 'Locating...' : 'Use Current Location'}
            </button>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="flex flex-wrap gap-3">
              {['HOME', 'CLINIC', 'OFFICE', 'OTHER'].map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, addressType: t }))}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black tracking-widest border transition-all",
                    form.addressType === t ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Pincode" 
                icon={Search} 
                value={form.pincode} 
                onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                maxLength={6}
                className="rounded-2xl"
              />
              <Input 
                label="City" 
                value={form.city} 
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="rounded-2xl"
              />
              <Input 
                label="Locality / Area" 
                value={form.locality} 
                onChange={e => setForm(f => ({ ...f, locality: e.target.value }))}
                className="rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="House / Building / Landmark" 
                value={form.houseNumber} 
                onChange={e => setForm(f => ({ ...f, houseNumber: e.target.value }))}
                className="rounded-2xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" value={form.latitude || ''} disabled className="rounded-2xl bg-slate-50/50" />
                <Input label="Longitude" value={form.longitude || ''} disabled className="rounded-2xl bg-slate-50/50" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-700 ml-1">Full Service Address</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                rows={3}
                value={form.fullAddress}
                onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))}
                placeholder="Complete address details..."
              />
            </div>

            {/* Map Preview Placeholder */}
            {form.latitude && (
              <div className="relative rounded-[2.5rem] border border-slate-200 h-64 overflow-hidden shadow-inner group">
                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                  <MapIcon size={48} className="mb-2 opacity-50" />
                  <p className="text-sm font-bold">Map Preview Active</p>
                  <p className="text-xs">{form.latitude}, {form.longitude}</p>
                </div>
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black shadow-lg border border-slate-100">Change Pin</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg">Open in Maps</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 4: Bank Details ────────────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <CreditCard size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Payout Settings</h2>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Account Holder Name" 
              value={form.accountHolder} 
              onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))}
              className="rounded-2xl"
            />
            <Input 
              label="Bank Name" 
              value={form.bankName} 
              onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
              className="rounded-2xl"
            />
            <Input 
              label="Account Number" 
              type="password"
              value={form.accountNumber} 
              onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
              className="rounded-2xl"
              hint="Masked for security"
            />
            <Input 
              label="IFSC Code" 
              value={form.ifsc} 
              onChange={e => setForm(f => ({ ...f, ifsc: e.target.value }))}
              className="rounded-2xl uppercase"
            />
          </div>
        </div>

        {/* ── SECTION 5: Account Settings ────────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-7 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Settings</h2>
          </div>
          
          <div className="p-8 flex flex-col sm:flex-row gap-4">
            <button className="flex-1 px-8 py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
              <Lock size={16} /> Change Password
            </button>
            <button 
              onClick={logout}
              className="flex-1 px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out from Everywhere
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
