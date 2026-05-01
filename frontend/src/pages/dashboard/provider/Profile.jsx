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
  Search,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService, providerService } from '../../../services';
import Button from '../../../components/ui/Button';
import ProfilePhotoUploader from '../../../components/dashboard/ProfilePhotoUploader';
import { cn } from '../../../utils';
import { PageWrapper, Card, Row } from '../../../components/ui/Layout';

export default function ProviderProfile() {
  const { user, updateUser, logout } = useAuth();
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    dob: user?.dob ? new Date(user?.dob).toISOString().split('T')[0] : '',
    bio: '',
    experience: 0,
    role: '',
    qualification: '',
    regNumber: '',
    languages: [],
    serviceRadius: 10,
    consultationMode: 'BOTH',
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
        const u = res.data.user;
        const p = res.data.providerProfile;
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
      .catch(() => toast.error('Profile load failed'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await authService.updateMe({
        name: form.name,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
        pincode: form.pincode,
        address: form.fullAddress
      });
      const provRes = await providerService.updateProfile({
        bio: form.bio,
        experience: form.experience,
        role: form.role,
        qualification: form.qualification,
        regNumber: form.regNumber,
        languages: form.languages,
        serviceRadius: form.serviceRadius,
        consultationMode: form.consultationMode,
        location: {
          type: 'Point',
          coordinates: [form.longitude, form.latitude]
        },
        addressDetails: {
          city: form.city,
          state: form.state,
          locality: form.locality,
          landmark: form.landmark,
          houseNumber: form.houseNumber
        },
        bankDetails: {
          bankName: form.bankName,
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          ifsc: form.ifsc
        }
      });
      setProviderProfile(provRes.data.provider);
      toast.success('Profile updated successfully!');
    } catch (err) { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
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
        } catch (err) { toast.error('Coordinates set.'); }
        finally { setLocating(false); }
      },
      () => {
        toast.error('Permission denied');
        setLocating(false);
      }
    );
  };

  if (loading) return <PageLoader />;

  return (
    <PageWrapper maxWidth="800px">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="typo-title">My Profile</h1>
          <p className="typo-body">Manage your expert identity and service settings.</p>
        </div>
        <button 
          onClick={handleUpdate} 
          disabled={saving}
          className="btn-primary-sm !px-6 !py-2.5 !bg-blue-600"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="space-y-4">
        
        {/* ── Personal Info ────────────────── */}
        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <User size={20} />
            </div>
            <h3 className="typo-value !text-gray-900">Personal Details</h3>
          </div>

          <div className="flex items-center gap-6 pb-2">
            <ProfilePhotoUploader />
            <div className="flex-1 min-w-0">
               <h3 className="typo-value !text-gray-900">{user.name}</h3>
               <p className="typo-micro font-bold text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Full Name</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Phone</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
               <label className="typo-label !text-gray-400">Gender</label>
               <div className="flex gap-2 mt-1">
                 {['Male', 'Female', 'Other'].map(g => (
                   <button
                     key={g}
                     onClick={() => setForm(f => ({ ...f, gender: g }))}
                     className={cn( "flex-1 py-2.5 rounded-xl typo-label transition-all", form.gender === g ? "bg-slate-900 text-white font-black shadow-md" : "bg-gray-50 text-gray-400" )}
                   >
                     {g}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </Card>

        {/* ── Professional ─────────────── */}
        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Briefcase size={20} />
            </div>
            <h3 className="typo-value !text-gray-900">Expertise</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="typo-label !text-gray-400">Primary Role</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Years of Experience</label>
               <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
               <label className="typo-label !text-gray-400">Bio</label>
               <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none h-24 resize-none focus:ring-2 focus:ring-blue-500/10" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
        </Card>

        {/* ── Location ─────────────────── */}
        <Card className="space-y-6">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <MapPin size={20} />
              </div>
              <h3 className="typo-value !text-gray-900">Service Area</h3>
            </div>
            <button onClick={handleUseLocation} disabled={locating} className="typo-label !text-blue-600 font-black flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
               <Navigation size={14} className={locating ? 'animate-spin' : ''} /> Auto-Detect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Pincode</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">City</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
               <label className="typo-label !text-gray-400">Full Service Address</label>
               <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none h-20 resize-none focus:ring-2 focus:ring-blue-500/10" value={form.fullAddress} onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))} />
            </div>
          </div>
        </Card>

        {/* ── Settlements ───────────────────── */}
        <Card className="space-y-6">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <CreditCard size={20} />
            </div>
            <h3 className="typo-value !text-gray-900">Settlements</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Account Holder</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.accountHolder} onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Bank Name</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Account Number</label>
               <input type="password" placeholder="••••••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">IFSC Code</label>
               <input className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10" value={form.ifsc} onChange={e => setForm(f => ({ ...f, ifsc: e.target.value }))} />
            </div>
          </div>
        </Card>

        {/* ── Security ────────────────── */}
        <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="typo-value !text-gray-900">Security</h3>
              <p className="typo-micro font-bold text-gray-400">Active sessions & password</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 btn-secondary-sm !px-6 !py-2.5">Security</button>
            <button onClick={logout} className="flex-1 btn-secondary-sm !px-6 !py-2.5 !text-red-500 border-red-100">Logout</button>
          </div>
        </Card>
      </div>

      <div className="lg:hidden h-24" /> {/* Spacing for mobile fixed button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50">
        <button onClick={handleUpdate} disabled={saving} className="w-full btn-primary-sm !py-3.5 !bg-blue-600 shadow-xl">
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>
    </PageWrapper>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}
