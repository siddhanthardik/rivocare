import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Info, 
  ShieldCheck, 
  Navigation,
  CreditCard,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService, providerService, pricingService } from '../../../services';
import Button from '../../../components/ui/Button';
import ProfilePhotoUploader from '../../../components/dashboard/ProfilePhotoUploader';
import { cn } from '../../../utils';
import { PageWrapper, Card } from '../../../components/ui/Layout';
import { PageLoader } from '../../../components/ui/Feedback';

export default function ProviderProfile() {
  const { user, logout } = useAuth();
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [services, setServices] = useState([]);

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

  useEffect(() => {
    // Load services for roles
    pricingService.getServices().then(res => setServices(res.data || []));

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
          role: p?.role || '',
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your expert identity and service settings.</p>
        </div>
        <Button onClick={handleUpdate} loading={saving} className="bg-blue-600 text-white rounded-xl px-8">
          Save Profile
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <User size={20} />
            </div>
            <h3 className="font-black text-slate-900">Personal Details</h3>
          </div>

          <div className="flex items-center gap-6 pb-2">
            <ProfilePhotoUploader />
            <div className="flex-1 min-w-0">
               <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
               <p className="text-xs font-bold text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
               <input className="input-base" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</label>
               <input className="input-base" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Briefcase size={20} />
            </div>
            <h3 className="font-black text-slate-900">Expertise</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Primary Role</label>
              <select 
                className="input-base"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="">-- Select Role --</option>
                {services.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Years of Experience</label>
               <input type="number" className="input-base" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Bio</label>
               <textarea className="input-base h-24 resize-none" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <MapPin size={20} />
              </div>
              <h3 className="font-black text-slate-900">Service Area</h3>
            </div>
            <button onClick={handleUseLocation} disabled={locating} className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2">
               <Navigation size={14} className={locating ? 'animate-spin' : ''} /> Auto-Detect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pincode</label>
               <input className="input-base" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Address</label>
               <textarea className="input-base h-20 resize-none" value={form.fullAddress} onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))} />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Security</h3>
              <p className="text-xs text-slate-400">Logout and manage account</p>
            </div>
          </div>
          <button onClick={logout} className="px-6 py-2 border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">Logout</button>
        </Card>
      </div>
    </PageWrapper>
  );
}
