import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, ChevronRight, ChevronLeft, User, FileText, Shield, ClipboardCheck, AlertCircle } from 'lucide-react';
import { providerService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';

const STEPS = [
  { id: 'profile', label: 'Basic Profile', icon: User },
  { id: 'kyc', label: 'KYC & Bank', icon: Shield },
  { id: 'documents', label: 'Professional Docs', icon: FileText },
  { id: 'declaration', label: 'Declaration & Submit', icon: ClipboardCheck },
];

const PROFESSIONS = ['Doctor', 'Nurse', 'Physiotherapist', 'Caretaker', 'Dietitian', 'Ayurvedic Practitioner', 'Other'];
const LANGUAGES = ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];
const DOC_TYPES = [
  { value: 'MEDICAL_REGISTRATION', label: 'Medical Registration Certificate' },
  { value: 'NURSING_REGISTRATION', label: 'Nursing Registration' },
  { value: 'DEGREE_CERTIFICATE', label: 'Degree / Diploma Certificate' },
  { value: 'EXPERIENCE_PROOF', label: 'Experience Proof Letter' },
  { value: 'POLICE_VERIFICATION', label: 'Police Verification Certificate (Optional)' },
  { value: 'OTHER', label: 'Other Document' },
];

const statusColors = {
  INCOMPLETE: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-amber-50 text-amber-700',
  PENDING_VERIFICATION: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
};

function ProgressBar({ percent }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-slate-600">Onboarding Progress</span>
        <span className="text-sm font-bold text-indigo-600">{percent}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-medium text-gray-400">
        <span>Profile</span><span>KYC</span><span>Documents</span><span>Declaration</span><span>Activated</span>
      </div>
    </div>
  );
}

function StepNav({ currentStep, setCurrentStep }) {
  return (
    <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const active = currentStep === step.id;
        return (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}
          >
            <Icon size={15} />
            {step.label}
          </button>
        );
      })}
    </div>
  );
}

function FileUploadBox({ label, name, accept = 'image/*,application/pdf', onChange, existing }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {existing && (
        <a href={existing} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 mb-2 hover:underline">
          <CheckCircle size={12} /> View uploaded file
        </a>
      )}
      <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 bg-gray-50 hover:bg-indigo-50 transition-all p-4">
        <Upload size={20} className="text-gray-400 mb-1" />
        <span className="text-xs text-gray-500">Tap to upload — JPG, PNG, PDF (max 5MB)</span>
        <span className="text-xs text-gray-400 mt-0.5">Camera upload works on mobile</span>
        <input type="file" name={name} accept={accept} className="hidden" capture="environment" onChange={onChange} />
      </label>
    </div>
  );
}

// ─── STEP 1: Basic Profile ────────────────────────────────────────────────────
function ProfileStep({ data, onChange, onSave, saving }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-gray-900">Basic Profile</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Dr. Anita Sharma' },
          { label: 'Mobile Number', key: 'phone', type: 'tel', placeholder: '10-digit mobile' },
          { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com', disabled: true },
          { label: 'City', key: 'city', type: 'text', placeholder: 'Delhi' },
          { label: 'Years of Experience', key: 'experience', type: 'number', placeholder: '5' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={data[f.key] || ''}
              disabled={f.disabled}
              onChange={e => onChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
          <select value={data.gender || ''} onChange={e => onChange('gender', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Select gender</option>
            {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Profession / Category</label>
          <select value={data.profession || ''} onChange={e => onChange('profession', e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Select profession</option>
            {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Languages Spoken</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                const arr = data.languages || [];
                onChange('languages', arr.includes(lang) ? arr.filter(l => l !== lang) : [...arr, lang]);
              }}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                (data.languages || []).includes(lang)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Short Bio / About You</label>
        <textarea
          rows={3}
          value={data.bio || ''}
          onChange={e => onChange('bio', e.target.value)}
          placeholder="Brief description about your experience, specialization..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save & Continue →'}
      </button>
    </div>
  );
}

// ─── STEP 2: KYC ─────────────────────────────────────────────────────────────
function KYCStep({ data, kycDetails, onFieldChange, onSubmit, saving }) {
  const [files, setFiles] = useState({});
  const handleFile = (key, file) => setFiles(p => ({ ...p, [key]: file }));
  const handleSubmit = () => onSubmit(files, data);
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-gray-900">KYC & Bank Details</h2>
      <p className="text-sm text-gray-500">Upload identity and bank documents. All files are stored securely and only reviewed by Carely admins.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileUploadBox label="Aadhaar Card (Front & Back)" name="aadhaar" onChange={e => handleFile('aadhaar', e.target.files[0])} existing={kycDetails?.aadhaarUrl} />
        <FileUploadBox label="PAN Card" name="pan" onChange={e => handleFile('pan', e.target.files[0])} existing={kycDetails?.panUrl} />
        <FileUploadBox label="Cancelled Cheque / Passbook" name="cheque" onChange={e => handleFile('cheque', e.target.files[0])} existing={kycDetails?.chequeUrl} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Bank Account Number', key: 'bankAccount', type: 'text' },
          { label: 'IFSC Code', key: 'ifsc', type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={data[f.key] || ''}
              onChange={e => onFieldChange(f.key, e.target.value)}
              placeholder={f.key === 'ifsc' ? 'SBIN0001234' : ''}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
            />
          </div>
        ))}
      </div>
      {kycDetails?.status && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${statusColors[kycDetails.status] || 'bg-gray-100 text-gray-600'}`}>
          <Shield size={15} /> KYC Status: {kycDetails.status}
        </div>
      )}
      <button onClick={handleSubmit} disabled={saving} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 transition disabled:opacity-60">
        {saving ? 'Uploading…' : 'Save KYC & Continue →'}
      </button>
    </div>
  );
}

// ─── STEP 3: Professional Docs ────────────────────────────────────────────────
function DocsStep({ docs, onUpload, saving }) {
  const [docType, setDocType] = useState('DEGREE_CERTIFICATE');
  const [file, setFile] = useState(null);
  const handleUpload = () => { if (file) onUpload(docType, file); };
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-gray-900">Professional Documents</h2>
      <p className="text-sm text-gray-500">Upload any documents that prove your professional qualifications. You can upload multiple documents.</p>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
        <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
      <FileUploadBox label="Upload Document" name="document" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={saving || !file} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-700 transition disabled:opacity-60">
        {saving ? 'Uploading…' : 'Upload Document'}
      </button>
      {docs && docs.length > 0 && (
        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-bold text-gray-700">Uploaded Documents</h3>
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-gray-800">{DOC_TYPES.find(d => d.value === doc.documentType)?.label || doc.documentType}</p>
                <p className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' : doc.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {doc.status}
                </span>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">View</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STEP 4: Declaration ──────────────────────────────────────────────────────
const DECLARATIONS = [
  'All submitted documents are genuine and belong to me.',
  'I have no criminal record or pending criminal cases.',
  'I agree to maintain professional conduct with all patients.',
  'I agree to adhere to patient safety and privacy policies.',
  'I agree to Carely\'s Terms of Service and Code of Conduct.',
];

function DeclarationStep({ accepted, onAccept, onSubmit, saving, onboardingStatus }) {
  const [checks, setChecks] = useState(Array(DECLARATIONS.length).fill(false));
  const allChecked = checks.every(Boolean);
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-black text-gray-900">Declaration & Submit</h2>
      <p className="text-sm text-gray-500">Please read and agree to the following declarations before submitting your application.</p>
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        {DECLARATIONS.map((text, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[i]}
              onChange={() => setChecks(p => { const c = [...p]; c[i] = !c[i]; return c; })}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span className="text-sm text-gray-700">{text}</span>
          </label>
        ))}
      </div>
      {accepted && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
          <CheckCircle size={15} /> Declaration already accepted
        </div>
      )}
      {onboardingStatus === 'PENDING_VERIFICATION' && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
          <AlertCircle size={15} /> Your application is under review. We'll notify you within 24 hours.
        </div>
      )}
      {onboardingStatus !== 'PENDING_VERIFICATION' && onboardingStatus !== 'ACTIVE' && (
        <button
          onClick={() => { onAccept(); onSubmit(); }}
          disabled={!allChecked || saving}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? 'Submitting…' : '✓ Accept Declaration & Submit for Review'}
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [onboardingData, setOnboardingData] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [kycForm, setKycForm] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    providerService.getOnboardingStatus().then(res => {
      const { provider, progress: pct, nextStep } = res.data.data;
      setOnboardingData(provider);
      setProgress(pct);
      setProfileForm({
        name: provider.user?.name || '',
        email: provider.user?.email || '',
        phone: provider.user?.phone || '',
        bio: provider.bio || '',
        experience: provider.experience || '',
        profession: provider.profession || '',
        languages: provider.languages || [],
        gender: provider.gender || '',
        city: provider.user?.city || '',
      });
      setKycForm({ bankAccount: provider.kycDetails?.bankAccount || '', ifsc: provider.kycDetails?.ifsc || '' });
      if (nextStep && nextStep !== 'pending_review') setCurrentStep(nextStep);
    }).catch(console.error);
  }, []);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 4000); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await providerService.saveOnboardingProfile(profileForm);
      setProgress(res.data.data.progress);
      setOnboardingData(res.data.data.provider);
      showMsg('Profile saved!');
      setCurrentStep('kyc');
    } catch (e) { showMsg(e.response?.data?.message || 'Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  const handleSubmitKYC = async (files, fields) => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (files.aadhaar) fd.append('aadhaar', files.aadhaar);
      if (files.pan) fd.append('pan', files.pan);
      if (files.cheque) fd.append('cheque', files.cheque);
      fd.append('bankAccount', fields.bankAccount || '');
      fd.append('ifsc', fields.ifsc || '');
      const res = await providerService.submitKYC(fd);
      setProgress(res.data.data.progress);
      setOnboardingData(res.data.data.provider);
      showMsg('KYC documents saved!');
      setCurrentStep('documents');
    } catch (e) { showMsg(e.response?.data?.message || 'Failed to upload KYC', 'error'); }
    finally { setSaving(false); }
  };

  const handleUploadDoc = async (docType, file) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('documentType', docType);
      const res = await providerService.submitDocument(fd);
      setProgress(res.data.data.progress);
      setOnboardingData(res.data.data.provider);
      showMsg('Document uploaded!');
    } catch (e) { showMsg(e.response?.data?.message || 'Failed to upload document', 'error'); }
    finally { setSaving(false); }
  };

  const handleSubmitDeclaration = async () => {
    setSaving(true);
    try {
      const res = await providerService.submitDeclaration();
      setProgress(res.data.data.progress);
      setOnboardingData(res.data.data.provider);
      showMsg('Application submitted! You will be notified within 24 hours.');
    } catch (e) { showMsg(e.response?.data?.message || 'Failed to submit', 'error'); }
    finally { setSaving(false); }
  };

  const status = onboardingData?.onboardingStatus || 'INCOMPLETE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Provider Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Complete all steps to start receiving bookings. Activation within 24 hours.</p>
        </div>

        {msg && (
          <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {msg.text}
          </div>
        )}

        <ProgressBar percent={progress} />
        <StepNav currentStep={currentStep} setCurrentStep={setCurrentStep} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {currentStep === 'profile' && (
            <ProfileStep
              data={profileForm}
              onChange={(k, v) => setProfileForm(p => ({ ...p, [k]: v }))}
              onSave={handleSaveProfile}
              saving={saving}
            />
          )}
          {currentStep === 'kyc' && (
            <KYCStep
              data={kycForm}
              kycDetails={onboardingData?.kycDetails}
              onFieldChange={(k, v) => setKycForm(p => ({ ...p, [k]: v }))}
              onSubmit={handleSubmitKYC}
              saving={saving}
            />
          )}
          {currentStep === 'documents' && (
            <DocsStep
              docs={onboardingData?.professionalDocs}
              onUpload={handleUploadDoc}
              saving={saving}
            />
          )}
          {currentStep === 'declaration' && (
            <DeclarationStep
              accepted={onboardingData?.declaration?.accepted}
              onboardingStatus={status}
              onAccept={() => {}}
              onSubmit={handleSubmitDeclaration}
              saving={saving}
            />
          )}
        </div>

        {/* Trust Badges */}
        {onboardingData && (
          <div className="mt-6 flex flex-wrap gap-2">
            {onboardingData.kycDetails?.status === 'VERIFIED' && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                <Shield size={12} /> KYC Verified
              </span>
            )}
            {onboardingData.professionalDocs?.some(d => d.status === 'VERIFIED') && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle size={12} /> Professional Verified
              </span>
            )}
            {onboardingData.policeVerificationStatus === 'VERIFIED' && (
              <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Shield size={12} /> Police Verified
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
