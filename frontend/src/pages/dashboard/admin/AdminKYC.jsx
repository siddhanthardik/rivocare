import { useState, useEffect } from 'react';
import { kycService } from '../../../services';
import { CheckCircle2, XCircle, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminKYC() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const { data } = await kycService.getPending();
      setPending(data.data);
    } catch (err) {
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const viewDetails = async (id) => {
    try {
      const { data } = await kycService.getById(id);
      setSelectedKyc(data.data);
      setRejectReason('');
    } catch (err) {
      toast.error('Failed to load full KYC details');
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await kycService.approve(selectedKyc._id);
      toast.success('Provider Verified!');
      setSelectedKyc(null);
      fetchPending();
    } catch (err) {
      toast.error('Failed to approve Provider');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason to reject');
    setProcessing(true);
    try {
      await kycService.reject(selectedKyc._id, rejectReason);
      toast.success('KYC Rejected');
      setSelectedKyc(null);
      fetchPending();
    } catch (err) {
      toast.error('Failed to reject Provider');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Approvals</h1>
          <p className="text-slate-500 text-sm mt-1">Review and verify healthcare providers</p>
        </div>
        <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-full font-medium text-sm border border-orange-200">
          {pending.length} Pending Actions
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pending List Left Pane */}
        <div className="lg:col-span-1 space-y-4">
          {pending.length === 0 ? (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              All caught up! No pending verifications.
            </div>
          ) : (
            pending.map((req) => (
              <div key={req._id} 
                onClick={() => viewDetails(req._id)}
                className={`p-4 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                  selectedKyc?._id === req._id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div>
                  <h3 className="font-semibold text-slate-800">{req.userId.name}</h3>
                  <p className="text-xs text-slate-500">{req.councilType} • {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <Search size={18} className="text-slate-400" />
              </div>
            ))
          )}
        </div>

        {/* Selected KYC Details Right Pane */}
        {selectedKyc && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Reviewing: {selectedKyc.userId.name}</h2>
                <p className="text-sm text-slate-500">{selectedKyc.userId.email} • {selectedKyc.userId.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Registration Number</p>
                <p className="font-medium text-slate-800">{selectedKyc.registrationNumber}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Council</p>
                <p className="font-medium text-slate-800">{selectedKyc.councilType}</p>
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Documents (Secure Links)</h3>
            <div className="flex space-x-3 mb-8">
              <a href={selectedKyc.govtIdUrl} target="_blank" rel="noreferrer" className="flex-1 py-3 px-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center font-medium hover:bg-blue-100 transition">
                Govt ID <ExternalLink size={16} className="ml-2" />
              </a>
              <a href={selectedKyc.degreeUrl} target="_blank" rel="noreferrer" className="flex-1 py-3 px-4 bg-teal-50 text-teal-700 rounded-lg flex items-center justify-center font-medium hover:bg-teal-100 transition">
                Degree <ExternalLink size={16} className="ml-2" />
              </a>
              <a href={selectedKyc.bankDetails.chequeUrl} target="_blank" rel="noreferrer" className="flex-1 py-3 px-4 bg-purple-50 text-purple-700 rounded-lg flex items-center justify-center font-medium hover:bg-purple-100 transition">
                Cheque <ExternalLink size={16} className="ml-2" />
              </a>
            </div>

            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2 flex items-center">
               Banking Details <span className="text-xs font-normal text-slate-400 ml-2">(Decrypted)</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
              <div><p className="text-xs text-slate-500">Account Holder</p><p className="font-medium text-slate-800">{selectedKyc.bankDetails.accountHolderName}</p></div>
              <div><p className="text-xs text-slate-500">IFSC Code</p><p className="font-medium text-slate-800">{selectedKyc.bankDetails.ifscCode}</p></div>
              <div className="col-span-2"><p className="text-xs text-slate-500">Account Number</p><p className="font-mono text-slate-800 tracking-wider bg-slate-100 px-3 py-1 rounded inline-block mt-1">{selectedKyc.bankDetails.accountNumber}</p></div>
            </div>

            <div className="pt-6 border-t flex flex-col space-y-4">
              <div className="flex space-x-3">
                <button onClick={handleApprove} disabled={processing} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition">
                  <CheckCircle2 size={18} className="mr-2" /> Approve & Verify
                </button>
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4">
                <p className="text-sm font-semibold text-red-800 mb-2 flex items-center"><XCircle size={16} className="mr-1"/> Rejection Protocol</p>
                <div className="flex items-center space-x-3">
                  <input type="text" placeholder="State reason for rejection..." disabled={processing} className="flex-1 px-4 py-2 rounded-lg border border-red-200 focus:border-red-400 outline-none text-sm" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  <button onClick={handleReject} disabled={processing || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
