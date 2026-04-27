import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  User, Phone, Mail, MapPin, Calendar, 
  ChevronDown, Home, 
  Briefcase, Heart, Map as MapIcon, 
  Navigation, Lock, LogOut, CheckCircle2,
  Save
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

  // Monitor changes
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
      updateUser(data.data.user);
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
          // Reverse geocoding using Nominatim (free/open)
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
            toast.success('Address auto-filled from your location!');
          }
        } catch (err) {
          console.error('Reverse geocoding failed', err);
          toast.success('Coordinates captured. Please fill address details manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        toast.error('Location access denied');
      }
    );
  };

  if (!user) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-24 px-4 lg:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-600 font-medium mt-2">
            Manage your personal information and saved address.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isChanged && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="hidden md:flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Unsaved Changes
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            onClick={handleSave}
            loading={loading}
            className="bg-blue-600 text-white rounded-2xl px-10 py-4 font-black shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all active:scale-95"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Profile Details */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-10">
          <ProfilePhotoUploader />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <Input 
              label="Full Name" 
              icon={User} 
              value={form.name} 
              onChange={(e) => handleInputChange('name', e.target.value)} 
              error={errors.name}
              className="bg-slate-50 border-none h-16 rounded-2xl"
            />
            <Input 
              label="Email Address" 
              icon={Mail} 
              value={user.email} 
              disabled 
              className="bg-slate-50 border-none h-16 rounded-2xl opacity-60"
            />
            <Input 
              label="Phone Number" 
              icon={Phone} 
              value={form.phone} 
              onChange={(e) => handleInputChange('phone', e.target.value)} 
              error={errors.phone}
              className="bg-slate-50 border-none h-16 rounded-2xl"
            />
            <Input 
              label="Date of Birth" 
              type="date"
              icon={Calendar} 
              value={form.dob} 
              onChange={(e) => handleInputChange('dob', e.target.value)}
              className="bg-slate-50 border-none h-16 rounded-2xl"
            />
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
              <div className="relative group">
                <select 
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-slate-700 appearance-none transition-all outline-none"
                  value={form.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
            <Button variant="secondary" className="px-8 rounded-xl font-bold" onClick={() => setForm({...user, dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''})}>Cancel</Button>
            <Button className="px-8 rounded-xl font-black bg-blue-600 text-white" loading={loading} onClick={handleSave}>Save Profile</Button>
          </div>
        </div>

        {/* Section 2: Saved Service Address */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Saved Service Address</h3>
            </div>
            <Button 
              onClick={useCurrentLocation}
              loading={geoLoading}
              className="hidden md:flex items-center gap-2 bg-white text-blue-600 border-2 border-blue-600/10 hover:border-blue-600/30 px-6 py-3 rounded-2xl font-black transition-all"
            >
              <Navigation size={18} /> Use Current Location
            </Button>
          </div>

          <div className="space-y-10">
            {/* Address Type */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Address Type</label>
              <div className="flex flex-wrap gap-3">
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
                      "flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm transition-all",
                      form.addressType === type.id 
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <type.icon size={18} /> {type.id}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={useCurrentLocation}
              loading={geoLoading}
              className="md:hidden w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border-2 border-blue-600/10 py-4 rounded-2xl font-black"
            >
              <Navigation size={18} /> Use Current Location (GPS)
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Input 
                label="Pincode" 
                value={form.pincode} 
                onChange={(e) => handleInputChange('pincode', e.target.value)} 
                maxLength={6}
                error={errors.pincode}
                className="bg-slate-50 border-none h-16 rounded-2xl"
              />
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                <div className="relative group">
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-slate-700 appearance-none transition-all outline-none"
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
                  <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
                </div>
              </div>
              <Input 
                label="Locality / Area" 
                value={form.locality} 
                onChange={(e) => handleInputChange('locality', e.target.value)} 
                className="bg-slate-50 border-none h-16 rounded-2xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input 
                label="Nearby Landmark" 
                value={form.landmark} 
                onChange={(e) => handleInputChange('landmark', e.target.value)} 
                className="bg-slate-50 border-none h-16 rounded-2xl"
              />
              <Input 
                label="House / Flat / Building" 
                value={form.houseNo} 
                onChange={(e) => handleInputChange('houseNo', e.target.value)} 
                className="bg-slate-50 border-none h-16 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
              <textarea 
                className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-6 text-sm font-bold text-slate-700 transition-all outline-none min-h-[140px] resize-none focus:bg-white focus:ring-4 focus:ring-blue-500/5"
                placeholder="Street name, landmark, and building details..."
                value={form.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-6">
              <Button className="px-10 rounded-2xl font-black bg-blue-600 text-white py-4 shadow-lg shadow-blue-500/20" loading={loading} onClick={handleSave}>
                Save Address
              </Button>
            </div>
          </div>
        </div>

        {/* Map Preview Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <MapIcon size={20} className="text-blue-600" />
              <span className="text-base font-black text-slate-900">Saved Location 📍</span>
            </div>
            {form.coords.lat && (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-3 py-1.5 rounded-full uppercase tracking-wider">Precise GPS Captured</span>
            )}
          </div>
          <div className="h-72 bg-slate-100 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i15!2i18880!3i12534!2m3!1e0!2sm!3i668043697!3m8!2sen!3sin!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0!23i4111425!23i4111425')] bg-cover" />
            
            <div className="relative z-10 flex flex-col items-center gap-6 text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 animate-bounce-slow">
                <MapPin size={32} />
              </div>
              
              {form.coords.lat ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-black text-slate-900">{form.locality || 'Verified Location'}</p>
                    <p className="text-xs font-bold text-slate-500">{form.city}, {form.pincode}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" size="sm" onClick={useCurrentLocation} className="bg-white/90 backdrop-blur-sm border-none shadow-sm font-bold">Change Location</Button>
                    <a 
                      href={`https://www.google.com/maps?q=${form.coords.lat},${form.coords.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-500 max-w-[280px]">Enable GPS to pin your service location for faster care delivery.</p>
                  <Button onClick={useCurrentLocation} className="bg-blue-600 text-white px-8 rounded-xl font-black">Enable GPS Pin</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Account Settings */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Account Settings</h3>
                <p className="text-sm text-slate-500 font-medium">Manage your password and security.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-2xl px-8 py-4 font-black transition-all">
                <Lock size={18} className="mr-2" /> Change Password
              </Button>
              <Button onClick={logout} className="bg-red-50 text-red-500 hover:bg-red-100 border-none rounded-2xl px-8 py-4 font-black transition-all">
                <LogOut size={18} className="mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Save */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
        <Button 
          className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-2"
          loading={loading}
          onClick={handleSave}
        >
          <Save size={20} /> Save All Changes
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}} />
    </div>
  );
}
