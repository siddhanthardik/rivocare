import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import { formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import ProviderDetailsModal from '../../../components/admin/ProviderDetailsModal';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, unverified
  const [refresh, setRefresh] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingProviderId, setViewingProviderId] = useState(null);

  useEffect(() => {
    const params = { limit: 50 };
    if (filter === 'verified') params.verified = true;
    if (filter === 'unverified') params.verified = false;

    adminService.getProviders(params)
      .then((res) => setProviders(res.data.data.providers))
      .catch((err) => toast.error('Failed to load providers'))
      .finally(() => setLoading(false));
  }, [refresh, filter]);

  const toggleVerification = async (provider) => {
    setUpdatingId(provider._id + '_verify');
    try {
      await adminService.verifyProvider(provider._id, { isVerified: !provider.isVerified });
      toast.success(`Provider ${!provider.isVerified ? 'verified' : 'unverified'} successfully`);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error('Failed to update provider verification');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOnboarding = async (providerId, newStatus) => {
    setUpdatingId(providerId + '_onboard');
    try {
      await adminService.updateProviderOnboarding(providerId, { onboardingStatus: newStatus });
      toast.success(`Onboarding status updated to ${newStatus}`);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error('Failed to update onboarding status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && providers.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Provider Verification</h1>
          <p className="text-slate-500">Review and verify applicant credentials.</p>
          <div className="mt-2 text-sm text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 inline-block">
            For document-based reviews (Aadhaar, Degree, Bank Details), please use the new <strong className="font-semibold">KYC Approvals</strong> tab.
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start mt-4 sm:mt-0">
          {['all', 'unverified', 'verified'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${filter === f ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {providers.length === 0 ? (
          <EmptyState title="No providers found" description="No providers match the selected filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Services</th>
                  <th className="px-6 py-4">Experience & Rate</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{p.user?.name}</p>
                      <p className="text-xs text-slate-500">{p.user?.email}</p>
                      <p className="text-xs text-slate-400 mt-1">Joined {new Date(p.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.services.length === 0 ? <span className="text-slate-400 italic">None selected</span> : p.services.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            {SERVICE_CONFIG[s]?.label || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{p.experience} Years</p>
                      <p className="text-primary-600 font-medium">{formatCurrency(p.pricePerHour)} / hr</p>
                    </td>
                    <td className="px-6 py-4">
                      {p.isVerified ? (
                        <span className="inline-block badge bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">Legacy Verified</span>
                      ) : (
                        <span className="inline-block badge bg-amber-50 text-amber-700 border border-amber-200 mb-1">Unverified</span>
                      )}
                      
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.onboardingStatus === 'ACTIVE' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                          p.onboardingStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          p.onboardingStatus === 'KYC_PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.onboardingStatus || 'INCOMPLETE'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col gap-2 items-end">
                        <select 
                          className="text-xs border border-slate-200 rounded p-1 bg-white disabled:opacity-50"
                          value={p.onboardingStatus || 'INCOMPLETE'}
                          disabled={updatingId === p._id + '_onboard'}
                          onChange={(e) => updateOnboarding(p._id, e.target.value)}
                        >
                          <option value="INCOMPLETE">Incomplete</option>
                          <option value="KYC_PENDING">KYC Pending</option>
                          <option value="VERIFIED">Verified</option>
                          <option value="ACTIVE">Active</option>
                        </select>
                        <Button
                          variant={p.isVerified ? 'outline' : 'success'}
                          size="sm"
                          className="py-1 px-2 h-auto text-xs"
                          loading={updatingId === p._id + '_verify'}
                          onClick={() => toggleVerification(p)}
                        >
                          {p.isVerified ? 'Revoke Legacy' : 'Approve Legacy'}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="py-1 px-2 h-auto text-xs"
                          onClick={() => setViewingProviderId(p._id)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProviderDetailsModal 
        isOpen={!!viewingProviderId} 
        onClose={() => setViewingProviderId(null)} 
        providerId={viewingProviderId} 
      />
    </div>
  );
}
