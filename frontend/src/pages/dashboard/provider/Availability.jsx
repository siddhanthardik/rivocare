import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { providerService, getProviderAvailabilityConfig } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { PageWrapper, Card, Row, Section } from '@/components/ui/Layout';
import Button from '@/components/ui/Button';
import { Clock, Calendar as CalIcon, Ban, CheckCircle, Save, X } from 'lucide-react';
import { cn } from '@/utils';
import { formatDate } from '@/utils/format';

const DAYS = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' }
];

export default function ProviderAvailability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState(null);

  // Form State mapped to availability config
  const [config, setConfig] = useState({
    isAvailable: true,
    workingDays: [],
    startTime: '09:00',
    endTime: '19:00',
    shiftType: 'custom',
    blockedSlots: []
  });

  // Blocked slot input state
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockTime, setNewBlockTime] = useState('');

  useEffect(() => {
    const DEFAULT_CONFIG = {
      isAvailable: true,
      workingDays: [],
      startTime: '09:00',
      endTime: '19:00',
      shiftType: 'custom',
      blockedSlots: []
    };

    const loadAvailability = async () => {
      try {
        const data = await providerService.getProfile();
        const p = data?.data?.provider || data?.provider;
        if (p) {
          setProvider(p);
          setConfig(getProviderAvailabilityConfig(p) || DEFAULT_CONFIG);
        } else {
          setConfig(DEFAULT_CONFIG);
        }
      } catch (err) {
        // Never break the UI — always fall back to defaults
        setConfig(DEFAULT_CONFIG);
        if (import.meta.env.DEV) {
          toast.error('Failed to load availability settings');
          console.error('Availability load failed:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const toggleDay = (id) => {
    setConfig(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(id) 
        ? prev.workingDays.filter(d => d !== id) 
        : [...prev.workingDays, id]
    }));
  };

  const addBlockedSlot = () => {
    if (!newBlockDate || !newBlockTime) return toast.error('Select both date and time');
    const target = `${newBlockDate}T${newBlockTime}`;
    if (config.blockedSlots.includes(target)) return toast.error('Slot already blocked');
    
    setConfig(prev => ({ ...prev, blockedSlots: [...prev.blockedSlots, target].sort() }));
    setNewBlockDate('');
    setNewBlockTime('');
  };

  const removeBlockedSlot = (slot) => {
    setConfig(prev => ({ ...prev, blockedSlots: prev.blockedSlots.filter(s => s !== slot) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse existing notes to not overwrite assignment/other JSON data
      let existingNotes = {};
      try {
        existingNotes = JSON.parse(provider?.notes || '{}');
      } catch(e) {}

      const updatedNotes = JSON.stringify({ ...existingNotes, availability: config });

      // Note: Assumes generic profile update endpoint can accept "notes" field
      await providerService.updateProfile({ notes: updatedNotes });
      toast.success('Availability schedule saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <PageWrapper maxWidth="800px">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Availability</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your working schedule and blocks.</p>
        </div>
        <Button onClick={handleSave} loading={saving} className="gap-2 shadow-sm"><Save size={16} /> Save Changes</Button>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <Card noPadding className={cn("transition-colors overflow-hidden", config.isAvailable ? 'border-emerald-200' : 'border-red-200')}>
           <Row className={cn("!p-4", config.isAvailable ? 'bg-emerald-50/50' : 'bg-red-50/50')}>
             <div className="flex-1">
               <h3 className="typo-value font-black flex items-center gap-2">
                 {config.isAvailable ? <CheckCircle className="text-emerald-500" size={18}/> : <Ban className="text-red-500" size={18}/>} 
                 Taking Bookings
               </h3>
               <p className="typo-micro mt-1 text-slate-600">Toggle off to temporarily hide your profile from all new booking requests.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input type="checkbox" className="sr-only peer" checked={config.isAvailable} onChange={e => setConfig({...config, isAvailable: e.target.checked})} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
             </label>
           </Row>
        </Card>

        {config.isAvailable && (
          <>
            {/* Working Days */}
            <Section title="Working Days" subtitle="Select the days you are available">
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        config.workingDays.includes(day.id) 
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </Card>
            </Section>

            {/* Shift Configuration */}
            <Section title="Shift Timings" subtitle="Define your active hours">
              <Card noPadding className="divide-y divide-slate-100">
                <div className="p-4 bg-slate-50 flex flex-wrap gap-6">
                   {[
                     { id: '12h', label: '12 Hours (9-9)', start: '09:00', end: '21:00' },
                     { id: '24h', label: '24 Hours',       start: '00:00', end: '23:59' },
                     { id: 'custom', label: 'Custom' }
                   ].map(type => (
                     <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                       <input 
                        type="radio" 
                        name="shiftType" 
                        value={type.id} 
                        checked={config.shiftType === type.id} 
                        onChange={() => setConfig({
                          ...config, 
                          shiftType: type.id,
                          startTime: type.start || config.startTime,
                          endTime: type.end || config.endTime
                        })} 
                        className="accent-slate-900 w-4 h-4 cursor-pointer" 
                       />
                       <span className={cn(
                         "text-sm font-bold transition-colors",
                         config.shiftType === type.id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                       )}>{type.label}</span>
                     </label>
                   ))}
                </div>
                {config.shiftType === 'custom' && (
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="typo-label text-slate-500 block mb-1.5">Start Time</label>
                      <input type="time" value={config.startTime} onChange={e => setConfig({...config, startTime: e.target.value})} className="input-base" />
                    </div>
                    <div>
                      <label className="typo-label text-slate-500 block mb-1.5">End Time</label>
                      <input type="time" value={config.endTime} onChange={e => setConfig({...config, endTime: e.target.value})} className="input-base" />
                    </div>
                  </div>
                )}
              </Card>
            </Section>

            {/* Blocked Slots */}
            <Section title="Blocked Slots" subtitle="Add specific dates/times you are unavailable">
              <Card noPadding className="divide-y divide-slate-100">
                <div className="p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="typo-label text-slate-500 block mb-1.5">Date</label>
                    <input type="date" value={newBlockDate} onChange={e => setNewBlockDate(e.target.value)} className="input-base" />
                  </div>
                  <div>
                    <label className="typo-label text-slate-500 block mb-1.5">Time</label>
                    <input type="time" value={newBlockTime} onChange={e => setNewBlockTime(e.target.value)} className="input-base" />
                  </div>
                  <Button variant="outline" onClick={addBlockedSlot} className="border-slate-300">Add Block</Button>
                </div>
                <div className="p-4">
                  {config.blockedSlots.length === 0 ? (
                    <p className="typo-body text-slate-400 italic text-center py-4">No blocked slots.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {config.blockedSlots.map(slot => (
                        <div key={slot} className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 px-3 py-1.5 rounded-lg typo-micro font-bold">
                          <Ban size={12} />
                          {formatDate(slot.split('T')[0])} at {slot.split('T')[1]}
                          <button onClick={() => removeBlockedSlot(slot)} className="ml-1 hover:text-red-900"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Section>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
