import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, Phone, Mail, MapPin, Calendar, 
  ChevronDown, Home, 
  Briefcase, Heart, Map as MapIcon, 
  Navigation, Lock, LogOut, CheckCircle2,
  Save, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

import { cn } from '../../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePhotoUploader from '../../../components/dashboard/ProfilePhotoUploader';

export default function PatientProfile() {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    addressType: user?.addressType || 'Home',
    pincode: user?.pincode || '',
    city: user?.city || '',
    locality: user?.locality || '',
    landmark: user?.landmark || '',
    houseNo: user?.houseNo || '',
    address: user?.address || '',
    coords: {
      lat: user?.coords?.lat || null,
      lng: user?.coords?.lng || null,
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const isDifferent = JSON.stringify(form) !== JSON.stringify({
      name: user?.name || '',
      phone: user?.phone || '',
      dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      gender: user?.gender || '',
      addressType: user?.addressType || 'Home',
      pincode: user?.pincode || '',
      city: user?.city || '',
      locality: user?.locality || '',
      landmark: user?.landmark || '',
      houseNo: user?.houseNo || '',
      address: user?.address || '',
      coords: {
        lat: user?.coords?.lat || null,
        lng: user?.coords?.lng || null,
      }
    });
    setIsChanged(isDifferent);
  }, [form, user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Invalid mobile number';
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = 'Invalid pincode';
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please check the form for errors');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated successfully');
      setIsChanged(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        handleInputChange('coords', { lat: latitude, lng: longitude });
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            setForm(prev => ({
              ...prev,
              pincode: addr.postcode || prev.pincode,
              city: addr.city || addr.town || addr.village || prev.city,
              locality: addr.suburb || addr.neighbourhood || addr.residential || prev.locality,
              address: data.display_name || prev.address
            }));
            toast.success('Address auto-filled!');
          }
        } catch (err) {
          toast.success('Coordinates captured.');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast.error('Location access denied');
      }
    );
  };

  if (!user) return <PageLoader />;

  return (
    <div className="page-container font-['Inter',_system-ui,_sans-serif] max-w-4xl mx-auto">
      
      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="typo-label !text-gray-400">Account</span>
          </div>
          <h1 className="typo-title">Profile Settings</h1>
          <p className="typo-body">Manage your personal information and address.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isChanged && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="hidden md:flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl typo-label !font-bold border border-amber-100"
              >
                <AlertCircle size={14} className="animate-pulse" /> Unsaved
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            onClick={handleSave}
            loading={loading}
            className="bg-slate-900 text-white rounded-xl px-6 py-2.5 typo-label !text-white !font-bold shadow-lg active:scale-95"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="section-block">
        
        {/* Section 1: Profile Details */}
        <div className="compact-card p-6 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <ProfilePhotoUploader />
            <div className="flex-1 space-y-1">
               <h3 className="typo-value !text-[18px] !text-gray-900 font-bold">{user.name}</h3>
               <p className="typo-body !text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Full Name</label>
               <input 
                 className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                 value={form.name} 
                 onChange={(e) => handleInputChange('name', e.target.value)} 
               />
               {errors.name && <p className="typo-micro text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1 opacity-60 cursor-not-allowed">
               <label className="typo-label !text-gray-400">Email (Read Only)</label>
               <input className="w-full px-4 py-2.5 bg-gray-100 border border-transparent rounded-xl typo-body outline-none" value={user.email} disabled />
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Phone Number</label>
               <input 
                 className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                 value={form.phone} 
                 onChange={(e) => handleInputChange('phone', e.target.value)} 
               />
               {errors.phone && <p className="typo-micro text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-1">
               <label className="typo-label !text-gray-400">Date of Birth</label>
               <input 
                 type="date"
                 className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                 value={form.dob} 
                 onChange={(e) => handleInputChange('dob', e.target.value)}
               />
            </div>
            <div className="space-y-1">
              <label className="typo-label !text-gray-400">Gender</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none"
                  value={form.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Saved Service Address */}
        <div className="compact-card p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <MapPin size={20} />
              </div>
              <h3 className="typo-value !text-[16px] !text-gray-900 font-bold">Service Address</h3>
            </div>
            <button 
              onClick={useCurrentLocation}
              disabled={geoLoading}
              className="flex items-center gap-2 typo-label !text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <Navigation size={14} className={geoLoading ? 'animate-spin' : ''} /> Auto-detect
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="typo-label !text-gray-400">Address Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'Home', icon: Home },
                  { id: 'Work', icon: Briefcase },
                  { id: 'Parents', icon: Heart },
                  { id: 'Other', icon: MapPin }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleInputChange('addressType', type.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl typo-label transition-all",
                      form.addressType === type.id 
                        ? "bg-slate-900 text-white font-bold shadow-md" 
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <type.icon size={14} /> {type.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                 <label className="typo-label !text-gray-400">Pincode</label>
                 <input 
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                   value={form.pincode} 
                   onChange={(e) => handleInputChange('pincode', e.target.value)} 
                   maxLength={6}
                 />
              </div>
              <div className="space-y-1">
                <label className="typo-label !text-gray-400">City</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none"
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  >
                    <option value="">Select City</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gurgaon">Gurgaon</option>
                    <option value="Noida">Noida</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                 <label className="typo-label !text-gray-400">Locality / Area</label>
                 <input 
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                   value={form.locality} 
                   onChange={(e) => handleInputChange('locality', e.target.value)} 
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="typo-label !text-gray-400">Nearby Landmark</label>
                 <input 
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                   value={form.landmark} 
                   onChange={(e) => handleInputChange('landmark', e.target.value)} 
                 />
              </div>
              <div className="space-y-1">
                 <label className="typo-label !text-gray-400">House / Flat / Building</label>
                 <input 
                   className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                   value={form.houseNo} 
                   onChange={(e) => handleInputChange('houseNo', e.target.value)} 
                 />
              </div>
            </div>

            <div className="space-y-1">
              <label className="typo-label !text-gray-400">Full Address</label>
              <textarea 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl typo-body outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all h-24 resize-none"
                placeholder="Street name, landmark, and building details..."
                value={form.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Map Preview Card */}
        <div className="compact-card overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon size={16} className="text-blue-600" />
              <span className="typo-label !text-gray-900 !font-bold">Location Pin 📍</span>
            </div>
            {form.coords.lat && (
              <span className="typo-micro !text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase">Precise GPS Captured</span>
            )}
          </div>
          <div className="h-64 bg-gray-100 relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i15!2i18880!3i12534!2m3!1e0!2sm!3i668043697!3m8!2sen!3sin!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425!23i4111425')] bg-cover" />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
                <MapPin size={24} />
              </div>
              {form.coords.lat ? (
                <div className="space-y-2">
                  <p className="typo-body font-bold text-gray-900">{form.locality || 'Verified Location'}</p>
                  <p className="typo-micro text-gray-500">{form.city}, {form.pincode}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="typo-micro text-gray-500 max-w-[240px]">Enable GPS to pin your service location for faster care delivery.</p>
                  <button onClick={useCurrentLocation} className="px-6 py-2 bg-blue-600 text-white rounded-lg typo-label !text-white !font-bold">Enable GPS Pin</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Account Settings */}
        <div className="compact-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center border border-gray-100">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="typo-value !text-[16px] !text-gray-900 font-bold">Account Settings</h3>
                <p className="typo-micro text-gray-400">Manage your password and security.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl typo-label !font-bold hover:bg-blue-100 transition-all">Change Password</button>
              <button onClick={logout} className="px-6 py-2.5 bg-red-50 text-red-500 rounded-xl typo-label !font-bold hover:bg-red-100 transition-all">Logout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Save */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
        <Button 
          className="w-full bg-slate-900 text-white rounded-xl py-3.5 typo-label !text-white !font-bold shadow-2xl flex items-center justify-center gap-2"
          loading={loading}
          onClick={handleSave}
        >
          <Save size={18} /> Save All Changes
        </Button>
      </div>
    </div>
  );
}
