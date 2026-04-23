import { useState, useEffect } from 'react';
import { kycService } from '../../../services';
import { Upload, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

export default function ProviderKYC() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // PENDING, VERIFIED, REJECTED, or null
  const [kycData, setKycData] = useState(null);

  const [form, setForm] = useState({
    registrationNumber: '',
    councilType: 'NURSING',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  const [files, setFiles] = useState({
    govtId: null,
    degree: null,
    cheque: null,
  });

  const loadStatus = async () => {
    try {
      const { data } = await kycService.getKYCStatus();
      if (data.data) {
        setStatus(data.data.status);
        setKycData(data.data);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Failed to load KYC status');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      return toast.error('File must be less than 5MB');
    }
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.govtId || !files.degree || !files.cheque) {
      return toast.error('Please upload all required documents');
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('registrationNumber', form.registrationNumber);
    formData.append('councilType', form.councilType);
    formData.append('accountNumber', form.accountNumber);
    formData.append('ifscCode', form.ifscCode);
    formData.append('accountHolderName', form.accountHolderName);
    
    formData.append('govtId', files.govtId);
    formData.append('degree', files.degree);
    formData.append('cheque', files.cheque);

    try {
      await kycService.submitKYC(formData);
      toast.success('KYC Submitted Successfully');
      loadStatus(); // Reload to show PENDING state
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (status === 'VERIFIED') {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto mt-8 border-green-100 bg-green-50/50">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Verification Complete</h2>
        <p className="text-green-700">Your profile is fully verified. You now show a Verified Badge to patients!</p>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="card p-8 text-center max-w-2xl mx-auto mt-8 border-yellow-100 bg-yellow-50/50">
        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-yellow-800 mb-2">Verification In Progress</h2>
        <p className="text-yellow-700">Our admin team is currently reviewing your documents. Please allow up to 48 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Provider Verification (KYC)</h1>
        <p className="text-slate-500">Upload your credentials and bank details for verification.</p>
      </div>

      {status === 'REJECTED' && (
        <div className="card p-6 mb-8 border-red-200 bg-red-50 flex items-start space-x-4">
          <XCircle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Your previous application was rejected</h3>
            <p className="text-red-700 text-sm mt-1">Reason: {kycData?.rejectedReason}</p>
            <p className="text-red-700 text-sm mt-2 font-medium">Please fix the issues and submit a fresh application below.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Professional Details Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" /> Professional Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Registration Number" required value={form.registrationNumber} onChange={e => setForm({...form, registrationNumber: e.target.value})} placeholder="e.g. MED12345" />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 block">Council Type</label>
              <select className="w-full h-11 px-4 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:border-primary-500 focus:bg-white transition-all text-sm"
                value={form.councilType} onChange={e => setForm({...form, councilType: e.target.value})}>
                <option value="NURSING">Nursing Council</option>
                <option value="MEDICAL">Medical Council</option>
                <option value="OTHER">Other Professional Body</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Government ID (Aadhaar/PAN)</label>
              <div className="flex items-center space-x-2">
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'govtId')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Degree / Certification</label>
              <div className="flex items-center space-x-2">
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'degree')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-primary-600" /> Payout Banking Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Account Holder Name" required value={form.accountHolderName} onChange={e => setForm({...form, accountHolderName: e.target.value})} />
            <Input label="IFSC Code" className="uppercase" required value={form.ifscCode} onChange={e => setForm({...form, ifscCode: e.target.value.toUpperCase()})} />
            <Input label="Account Number" type="password" required value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} hint="Stored securely using AES-256 encryption." />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Cancelled Cheque or Passbook</label>
              <div className="flex items-center space-x-2">
                <input type="file" accept="image/*,.pdf" onChange={e => handleFileChange(e, 'cheque')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting} size="lg">Submit Verification Request</Button>
        </div>
      </form>
    </div>
  );
}
