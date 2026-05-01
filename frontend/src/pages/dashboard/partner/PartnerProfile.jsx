import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Clock, 
  Globe, Shield, Image as ImageIcon,
  CheckCircle2, AlertCircle, Save,
  Navigation, Radio, Zap
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';

export default function PartnerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await labService.getProfile();
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await labService.updateProfile(profile);
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Building size={160} />
        </div>
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white relative group cursor-pointer overflow-hidden shadow-2xl">
             <Building size={40} />
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon size={20} />
             </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{profile.labName}</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Verified Lab
               </span>
               <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5">
                  <MapPin size={14} /> {profile.addressDetails?.city}, {profile.addressDetails?.state}
               </span>
            </div>
          </div>
        </div>
        <div className="relative z-10">
           <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-sm transition-all ${
             profile.availabilityStatus === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
           }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${profile.availabilityStatus === 'open' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              Currently {profile.availabilityStatus.toUpperCase()}
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-6">General Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Lab Official Name</label>
                    <input 
                      type="text" 
                      value={profile.labName}
                      onChange={(e) => setProfile({ ...profile, labName: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Accreditations (NABL, etc)</label>
                    <input 
                      type="text" 
                      value={profile.accreditations?.join(', ')}
                      onChange={(e) => setProfile({ ...profile, accreditations: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">About the Lab</label>
                 <textarea 
                   rows="4"
                   value={profile.about}
                   onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                   className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                   placeholder="Describe your lab facilities and expertise..."
                 />
              </div>
           </div>

           {/* OPERATIONAL SETUP */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-6">Operational Setup</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {/* COVERAGE */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <Navigation className="text-blue-600" size={20} />
                       <h4 className="font-black text-slate-900">Service Coverage</h4>
                    </div>
                    <div className="space-y-4">
                       <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Home Collection Radius</p>
                          <div className="flex items-center gap-4">
                             <input 
                               type="range" 
                               min="1" max="50"
                               value={profile.serviceRadius || 10}
                               onChange={(e) => setProfile({ ...profile, serviceRadius: parseInt(e.target.value) })}
                               className="flex-1 h-2 bg-blue-100 rounded-full appearance-none cursor-pointer"
                             />
                             <span className="text-xl font-black text-slate-900 w-16 text-right">{profile.serviceRadius} KM</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* TIMINGS */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <Clock className="text-indigo-600" size={20} />
                       <h4 className="font-black text-slate-900">Operating Hours</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Open</label>
                          <input 
                            type="time" 
                            value={profile.timings?.open || '08:00'}
                            onChange={(e) => setProfile({ ...profile, timings: { ...profile.timings, open: e.target.value } })}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Close</label>
                          <input 
                            type="time" 
                            value={profile.timings?.close || '20:00'}
                            onChange={(e) => setProfile({ ...profile, timings: { ...profile.timings, close: e.target.value } })}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold outline-none"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS */}
        <div className="space-y-8">
           
           {/* STATUS TOGGLE */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">Live Status</h3>
              <div className="space-y-3">
                 {[
                   { id: 'open', label: 'Open for Bookings', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Zap },
                   { id: 'busy', label: 'Busy (Expect Delays)', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
                   { id: 'closed', label: 'Closed for Today', color: 'text-slate-400', bg: 'bg-slate-50', icon: AlertCircle },
                 ].map((opt) => (
                   <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, availabilityStatus: opt.id })}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                      profile.availabilityStatus === opt.id 
                        ? `border-slate-900 ${opt.bg}` 
                        : 'border-slate-50 hover:border-slate-100'
                    }`}
                   >
                     <div className="flex items-center gap-3">
                        <opt.icon size={18} className={profile.availabilityStatus === opt.id ? opt.color : 'text-slate-300'} />
                        <span className={`text-sm font-black ${profile.availabilityStatus === opt.id ? 'text-slate-900' : 'text-slate-400'}`}>
                           {opt.label}
                        </span>
                     </div>
                     {profile.availabilityStatus === opt.id && <CheckCircle2 size={18} className="text-slate-900" />}
                   </button>
                 ))}
              </div>
           </div>

           {/* SAVE BUTTON */}
           <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-200">
                 <Shield size={32} />
              </div>
              <div className="space-y-2">
                 <h4 className="text-white font-black">Profile Safety</h4>
                 <p className="text-indigo-200 text-xs font-medium">Your changes are reviewed by the Rivo Labs safety team.</p>
              </div>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full bg-white text-slate-900 rounded-2xl py-5 h-auto font-black shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? 'Updating...' : <><Save size={20} /> Save All Changes</>}
              </Button>
           </div>

        </div>

      </form>

    </div>
  );
}
