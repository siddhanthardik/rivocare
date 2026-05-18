import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Globe2,
  Languages,
  LogOut,
  MapPin,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { authService, providerService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import { cn } from '../../../utils';

const initialForm = {
  name: '',
  phone: '',
  bio: '',
  experience: 0,
  qualification: '',
  specializations: '',
  languages: '',
  services: [],
  pincodesServed: '',
  fullAddress: '',
  city: '',
  locality: '',
};

function safeJsonParse(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function initials(name) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'PR'
  );
}

function toCommaSeparated(values) {
  return Array.isArray(values) ? values.join(', ') : '';
}

function toList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProviderProfile() {
  const { user, updateUser, logout } = useAuth();
  const avatarInputRef = useRef(null);
  const detailsRef = useRef(null);

  const [providerProfile, setProviderProfile] = useState(null);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!user?._id) return;

    const loadProfile = async () => {
      try {
        const [meResponse, servicesResponse] = await Promise.all([
          authService.getMe(),
          providerService.getServices(),
        ]);

        const accountUser = meResponse.data.user;
        const provider = meResponse.data.providerProfile;
        const services = servicesResponse.data.services;
        const notes = safeJsonParse(provider.notes, {});
        const professional = notes.professional || {};

        setProviderProfile(provider);
        setServiceOptions(services);
        setForm({
          name: accountUser.name,
          phone: accountUser.phone || '',
          bio: provider.bio || '',
          experience: provider.experience || 0,
          qualification: professional.qualification || '',
          specializations: toCommaSeparated(professional.specializations),
          languages: toCommaSeparated(professional.languages),
          services: Array.isArray(provider.services)
            ? provider.services.map((service) => (typeof service === 'string' ? service : service?._id)).filter(Boolean)
            : [],
          pincodesServed: toCommaSeparated(provider.pincodesServed || []),
          fullAddress: accountUser.address || '',
          city: accountUser.city || professional.city || '',
          locality: accountUser.locality || professional.locality || '',
        });
      } catch (error) {
        console.error('[PROVIDER_PROFILE_LOAD_FAILED]', error);
        toast.error('Unable to load provider profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?._id]);

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleService = (serviceId) => {
    setForm((current) => ({
      ...current,
      services: current.services.includes(serviceId)
        ? current.services.filter((id) => id !== serviceId)
        : [...current.services, serviceId],
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload JPG, PNG, or WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile photo...');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await authService.uploadAvatar(formData);
      updateUser(response.data.user);
      toast.success('Profile photo updated', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Full name is required');
    if (!form.phone.trim()) return toast.error('Phone number is required');
    if (form.services.length === 0) return toast.error('Select at least one service');

    const validPincodes = toList(form.pincodesServed).filter((pincode) => /^\d{6}$/.test(pincode));
    if (validPincodes.length === 0) return toast.error('Add at least one valid 6-digit pincode');

    setSaving(true);
    try {
      const currentNotes = safeJsonParse(providerProfile?.notes, {});
      const professional = {
        qualification: form.qualification.trim(),
        specializations: toList(form.specializations),
        languages: toList(form.languages),
        city: form.city.trim(),
        locality: form.locality.trim(),
      };

      const authResponse = await authService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.fullAddress.trim(),
        pincode: validPincodes[0],
        city: form.city.trim(),
        locality: form.locality.trim(),
      });

      updateUser(authResponse.data.user);

      const providerResponse = await providerService.updateProfile({
        bio: form.bio.trim(),
        experience: Number(form.experience) || 0,
        services: form.services,
        pincodesServed: validPincodes,
        notes: JSON.stringify({
          ...currentNotes,
          professional,
        }),
      });

      setProviderProfile(providerResponse.data.provider);
      toast.success('Provider profile saved successfully');
    } catch (error) {
      console.error('[PROVIDER_PROFILE_SAVE_FAILED]', error);
      toast.error(error.response?.data?.message || 'Unable to save provider profile');
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
        <PageLoader label="Loading provider profile..." />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Preparing your dashboard</p>
      </div>
    );
  }

  if (!providerProfile) {
    return <div className="p-6">Unable to load provider profile right now.</div>;
  }

  const selectedServices = serviceOptions.filter((service) => form.services.includes(service._id));
  const profileNeedsAttention = !providerProfile?.isProfileComplete;
  const serviceAreaList = toList(form.pincodesServed);
  const isTopProvider = (providerProfile?.rating || 0) >= 4.7 && (providerProfile?.completedBookings || 0) >= 5;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 pb-28">
      {profileNeedsAttention && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-800">Complete your provider profile</p>
              <p className="mt-1 text-sm text-amber-700">
                Patients will not see a fully trustworthy provider card until your professional details and service areas are saved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Fill mandatory fields
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  initials(form.name || user?.name)
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                title="Update profile photo"
              >
                <Camera size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-slate-900">{form.name || user?.name}</h2>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    providerProfile?.isVerified
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  <BadgeCheck size={13} />
                  {providerProfile?.isVerified ? 'Verified' : 'Verification Pending'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  CARE EXPERT
                </span>
                {isTopProvider && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <Sparkles size={13} />
                    Top Provider
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {selectedServices.map((service) => service.name).join(', ') || 'Select your care services'} • {Number(form.experience) || 0} yrs experience
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <PenSquare size={16} />
            Edit Profile
          </button>
        </div>
      </section>

      <section ref={detailsRef} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Professional Details</h3>
          <p className="text-sm text-slate-500">
            Editable provider identity only. Performance, earnings, and scheduling live in their own dedicated modules.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FieldCard label="Qualification" icon={ShieldCheck}>
            <input
              className={inputClass}
              value={form.qualification}
              onChange={(event) => handleFieldChange('qualification', event.target.value)}
              placeholder="BPT, MPT, GNM, B.Sc Nursing"
            />
          </FieldCard>

          <FieldCard label="Experience" icon={Briefcase}>
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.experience}
              onChange={(event) => handleFieldChange('experience', event.target.value)}
              placeholder="5"
            />
          </FieldCard>

          <FieldCard label="Specializations" icon={Stethoscope}>
            <input
              className={inputClass}
              value={form.specializations}
              onChange={(event) => handleFieldChange('specializations', event.target.value)}
              placeholder="Neuro rehab, Stroke, Elder care"
            />
          </FieldCard>

          <FieldCard label="Languages" icon={Globe2}>
            <input
              className={inputClass}
              value={form.languages}
              onChange={(event) => handleFieldChange('languages', event.target.value)}
              placeholder="English, Hindi"
            />
          </FieldCard>

          <FieldCard label="Full Name" icon={Sparkles}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              placeholder="Provider full name"
            />
          </FieldCard>

          <FieldCard label="Phone" icon={Languages}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(event) => handleFieldChange('phone', event.target.value)}
              placeholder="+91 98XXXXXXXX"
            />
          </FieldCard>
        </div>

        <div className="mt-5 space-y-3">
          <Label>Service Specialties</Label>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((service) => {
              const selected = form.services.includes(service._id);
              return (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => toggleService(service._id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    selected
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {service.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label>Professional Bio</Label>
          <textarea
            className={cn(inputClass, 'min-h-[120px] resize-none')}
            value={form.bio}
            onChange={(event) => handleFieldChange('bio', event.target.value)}
            placeholder="Describe your expertise, patient approach, and the kind of care experience you provide."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Service Areas</h3>
          <p className="text-sm text-slate-500">
            Define where you provide care. Scheduling details belong in the Availability module.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Service Area Pincodes</Label>
            <input
              className={inputClass}
              value={form.pincodesServed}
              onChange={(event) => handleFieldChange('pincodesServed', event.target.value)}
              placeholder="110074, 110068, 110030"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceAreaList.map((pincode) => (
                <span
                  key={pincode}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {pincode}
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label>City</Label>
            <input
              className={inputClass}
              value={form.city}
              onChange={(event) => handleFieldChange('city', event.target.value)}
              placeholder="New Delhi"
            />
          </div>

          <div>
            <Label>Locality</Label>
            <input
              className={inputClass}
              value={form.locality}
              onChange={(event) => handleFieldChange('locality', event.target.value)}
              placeholder="Saket"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Dispatch Address</Label>
            <textarea
              className={cn(inputClass, 'min-h-[90px] resize-none')}
              value={form.fullAddress}
              onChange={(event) => handleFieldChange('fullAddress', event.target.value)}
              placeholder="Full practice or dispatch address"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Account actions</h3>
          <p className="text-sm text-slate-500">Keep your provider account secure and current.</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function FieldCard({ label, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon size={14} />
        </div>
        <Label>{label}</Label>
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <p className="text-xs font-medium text-slate-500">{children}</p>;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
