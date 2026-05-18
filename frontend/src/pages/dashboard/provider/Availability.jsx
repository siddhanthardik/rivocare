import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { providerService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { PageWrapper, Card, Row, Section } from '@/components/ui/Layout';
import { PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import { Ban, CheckCircle, Navigation, Save, X } from 'lucide-react';
import { cn } from '@/utils';
import { formatDate } from '@/utils/format';

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

const DEFAULT_CONFIG = {
  isAvailable: true,
  workingDays: [],
  startTime: '09:00',
  endTime: '19:00',
  shiftType: 'custom',
  blockedSlots: [],
  quickSlots: [],
};

export default function ProviderAvailability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockTime, setNewBlockTime] = useState('');

  useEffect(() => {
    if (!user?._id) return;

    const loadAvailability = async () => {
      try {
        const response = await providerService.getAvailability();
        setConfig(response.data.availability);
      } catch (error) {
        console.error('Availability error', error);
        setConfig(DEFAULT_CONFIG);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user?._id]);

  const toggleDay = (id) => {
    setConfig((current) => ({
      ...current,
      workingDays: current.workingDays.includes(id)
        ? current.workingDays.filter((day) => day !== id)
        : [...current.workingDays, id],
    }));
  };

  const addBlockedSlot = () => {
    if (!newBlockDate || !newBlockTime) {
      toast.error('Select both date and time');
      return;
    }

    const nextSlot = `${newBlockDate}T${newBlockTime}`;
    if (config.blockedSlots.includes(nextSlot)) {
      toast.error('Slot already blocked');
      return;
    }

    setConfig((current) => ({
      ...current,
      blockedSlots: [...current.blockedSlots, nextSlot].sort(),
    }));
    setNewBlockDate('');
    setNewBlockTime('');
  };

  const removeBlockedSlot = (slot) => {
    setConfig((current) => ({
      ...current,
      blockedSlots: current.blockedSlots.filter((value) => value !== slot),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await providerService.updateAvailability(config);
      toast.success('Availability schedule saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  if (loading || !user?._id) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-3">
        <PageLoader label="Loading availability settings..." />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying identity</p>
      </div>
    );
  }

  return (
    <PageWrapper maxWidth="800px">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Availability</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scheduling only. Control working days, shift timing, and blocked visits here.
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} className="gap-2 shadow-sm">
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        <Card
          noPadding
          className={cn(
            'overflow-hidden transition-colors',
            config.isAvailable ? 'border-emerald-200' : 'border-red-200'
          )}
        >
          <Row className={cn('!p-4', config.isAvailable ? 'bg-emerald-50/50' : 'bg-red-50/50')}>
            <div className="flex-1">
              <h3 className="typo-value flex items-center gap-2 font-black">
                {config.isAvailable ? (
                  <CheckCircle className="text-emerald-500" size={18} />
                ) : (
                  <Ban className="text-red-500" size={18} />
                )}
                Taking Bookings
              </h3>
              <p className="typo-micro mt-1 text-slate-600">
                Toggle this off if you want to pause fresh requests without changing your professional profile.
              </p>
            </div>
            <label className="relative ml-4 inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={config.isAvailable}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    isAvailable: event.target.checked,
                  }))
                }
              />
              <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-['']" />
            </label>
          </Row>
        </Card>

        {config.isAvailable && (
          <>
            <Section title="Working Days" subtitle="Pick the weekdays when patients can request you">
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm font-bold transition-all',
                        config.workingDays.includes(day.id)
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </Card>
            </Section>

            <Section title="Shift Timings" subtitle="Define the window in which you accept visits">
              <Card noPadding className="divide-y divide-slate-100">
                <div className="flex flex-wrap gap-6 bg-slate-50 p-4">
                  {[
                    { id: '12h', label: '12 Hours (9-9)', start: '09:00', end: '21:00' },
                    { id: '24h', label: '24 Hours', start: '00:00', end: '23:59' },
                    { id: 'custom', label: 'Custom' },
                  ].map((type) => (
                    <label key={type.id} className="group flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="shiftType"
                        value={type.id}
                        checked={config.shiftType === type.id}
                        onChange={() =>
                          setConfig((current) => ({
                            ...current,
                            shiftType: type.id,
                            startTime: type.start || current.startTime,
                            endTime: type.end || current.endTime,
                          }))
                        }
                        className="h-4 w-4 cursor-pointer accent-slate-900"
                      />
                      <span
                        className={cn(
                          'text-sm font-bold transition-colors',
                          config.shiftType === type.id
                            ? 'text-slate-900'
                            : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      >
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>

                {config.shiftType === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 p-4">
                    <div>
                      <label className="typo-label mb-1.5 block text-slate-500">Start Time</label>
                      <input
                        type="time"
                        value={config.startTime}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            startTime: event.target.value,
                          }))
                        }
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="typo-label mb-1.5 block text-slate-500">End Time</label>
                      <input
                        type="time"
                        value={config.endTime}
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            endTime: event.target.value,
                          }))
                        }
                        className="input-base"
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Section>

            <Section title="Blocked Slots" subtitle="Reserve exceptions and remove overlaps before they become issues">
              <Card noPadding className="divide-y divide-slate-100">
                <div className="grid grid-cols-1 items-end gap-3 bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <label className="typo-label mb-1.5 block text-slate-500">Date</label>
                    <input
                      type="date"
                      value={newBlockDate}
                      onChange={(event) => setNewBlockDate(event.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="typo-label mb-1.5 block text-slate-500">Time</label>
                    <input
                      type="time"
                      value={newBlockTime}
                      onChange={(event) => setNewBlockTime(event.target.value)}
                      className="input-base"
                    />
                  </div>
                  <Button variant="outline" onClick={addBlockedSlot} className="border-slate-300">
                    Add Block
                  </Button>
                </div>
                <div className="p-4">
                  {config.blockedSlots.length === 0 ? (
                    <p className="typo-body py-4 text-center italic text-slate-400">No blocked slots.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {config.blockedSlots.map((slot) => (
                        <div
                          key={slot}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 font-bold text-red-700"
                        >
                          <Ban size={12} />
                          {formatDate(slot.split('T')[0])} at {slot.split('T')[1]}
                          <button onClick={() => removeBlockedSlot(slot)} className="ml-1 hover:text-red-900">
                            <X size={14} />
                          </button>
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
