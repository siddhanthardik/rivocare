import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Eye, ExternalLink, ChevronDown, ChevronUp, User, AlertTriangle, Filter } from 'lucide-react';
import { adminService } from '../../../services';

const STATUS_TABS = [
  { key: 'PENDING_VERIFICATION', label: 'Awaiting Review' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'DRAFT', label: 'Incomplete' },
];

const statusColors = {
  INCOMPLETE: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-amber-50 text-amber-700',
  PENDING_VERIFICATION: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
  PENDING: 'bg-amber-50 text-amber-600',
  VERIFIED: 'bg-emerald-50 text-emerald-700',
};

const DOC_TYPE_LABELS = {
  MEDICAL_REGISTRATION: 'Medical Registration',
  NURSING_REGISTRATION: 'Nursing Registration',
  DEGREE_CERTIFICATE: 'Degree Certificate',
  EXPERIENCE_PROOF: 'Experience Proof',
  POLICE_VERIFICATION: 'Police Verification',
  OTHER: 'Other',
};

function DocBadge({ status }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function DocViewer({ url, label }) {
  if (!url) return <span className="text-xs text-gray-400 italic">Not uploaded</span>;
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
    >
      <ExternalLink size={11} /> {label || 'View Document'}
    </a>
  );
}

function ProviderCard({ provider, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const u = provider.user || {};
  const kyc = provider.kycDetails || {};
  const docs = provider.professionalDocs || [];

  const doAction = async (action, extra = {}) => {
    setActionLoading(true);
    try {
      await onAction(provider._id, { action, rejectionNotes, ...extra });
    } finally {
      setActionLoading(false);
      setShowRejectInput(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
          {u.avatar
            ? <img src={u.avatar} alt={u.name} className="h-12 w-12 rounded-full object-cover" />
            : <User size={22} className="text-indigo-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 truncate">{u.name || 'Unknown'}</p>
          <p className="text-xs text-gray-400 truncate">{u.email} · {u.phone || '—'}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[provider.onboardingStatus] || 'bg-gray-100 text-gray-500'}`}>
              {provider.onboardingStatus?.replace('_', ' ')}
            </span>
            {provider.profession && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {provider.profession}
              </span>
            )}
            {kyc.status === 'VERIFIED' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">KYC ✓</span>
            )}
            {provider.policeVerificationStatus === 'VERIFIED' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Police ✓</span>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(p => !p)} className="p-2 rounded-lg hover:bg-gray-50 text-gray-400">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 space-y-4">
          {/* KYC Section */}
          <div>
            <div className="flex items-center justify-between mt-3 mb-2">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">KYC Documents</h4>
              <DocBadge status={kyc.status || 'PENDING'} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Aadhaar', url: kyc.aadhaarUrl },
                { label: 'PAN Card', url: kyc.panUrl },
                { label: 'Cancelled Cheque', url: kyc.chequeUrl },
              ].map(d => (
                <div key={d.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">{d.label}</p>
                  <DocViewer url={d.url} label="View" />
                </div>
              ))}
            </div>
            {kyc.bankAccount && (
              <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                <span className="font-semibold text-gray-600">Bank A/C:</span> {kyc.bankAccount} &nbsp;|&nbsp;
                <span className="font-semibold text-gray-600">IFSC:</span> {kyc.ifsc}
              </div>
            )}
            {kyc.status !== 'VERIFIED' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => doAction('VERIFY_KYC')} disabled={actionLoading} className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  Verify KYC
                </button>
                <button onClick={() => doAction('REJECT_KYC')} disabled={actionLoading} className="flex-1 rounded-lg bg-red-100 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50">
                  Reject KYC
                </button>
              </div>
            )}
          </div>

          {/* Professional Docs */}
          {docs.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Professional Documents</h4>
              <div className="space-y-2">
                {docs.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</p>
                      <DocViewer url={doc.fileUrl} label="View Document" />
                    </div>
                    <div className="flex items-center gap-2">
                      <DocBadge status={doc.status} />
                      {doc.status === 'PENDING' && (
                        <>
                          <button onClick={() => doAction('VERIFY_DOC', { docIndex: i })} disabled={actionLoading} className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">✓</button>
                          <button onClick={() => doAction('REJECT_DOC', { docIndex: i })} disabled={actionLoading} className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100">✗</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Police Verification */}
          {provider.policeVerificationUrl && (
            <div>
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Police Verification</h4>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <DocViewer url={provider.policeVerificationUrl} label="View Police Certificate" />
                <div className="flex items-center gap-2">
                  <DocBadge status={provider.policeVerificationStatus} />
                  {provider.policeVerificationStatus === 'PENDING' && (
                    <button onClick={() => doAction('VERIFY_POLICE')} disabled={actionLoading} className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100">Verify</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Declaration */}
          {provider.declaration?.accepted && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle size={13} /> Declaration accepted on {new Date(provider.declaration.acceptedAt).toLocaleDateString()}
            </div>
          )}

          {/* Notes */}
          {provider.rejectionNotes && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              <strong>Admin Notes:</strong> {provider.rejectionNotes}
            </div>
          )}

          {/* Main Actions */}
          {provider.onboardingStatus !== 'ACTIVE' && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Admin Actions</h4>
              {showRejectInput ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={rejectionNotes}
                    onChange={e => setRejectionNotes(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => doAction('REJECT')} disabled={actionLoading || !rejectionNotes.trim()} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50">
                      {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
                    </button>
                    <button onClick={() => setShowRejectInput(false)} className="rounded-xl border border-gray-200 px-4 text-sm text-gray-500 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => doAction('ACTIVATE')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle size={15} /> {actionLoading ? 'Activating…' : 'Activate Provider'}
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              )}
              {provider.onboardingStatus === 'ACTIVE' || (
                <button
                  onClick={() => doAction('SUSPEND')}
                  disabled={actionLoading}
                  className="w-full rounded-xl border border-orange-200 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50"
                >
                  Suspend Provider
                </button>
              )}
            </div>
          )}
          {provider.onboardingStatus === 'ACTIVE' && (
            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <button onClick={() => doAction('SUSPEND')} disabled={actionLoading} className="rounded-xl border border-orange-200 px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50">
                Suspend
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProviderVerification() {
  const [activeTab, setActiveTab] = useState('PENDING_VERIFICATION');
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (status) => {
    setLoading(true);
    try {
      const res = await adminService.getOnboardingProviders(status);
      setProviders(res.data.data.providers || []);
      setTotal(res.data.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const handleAction = async (providerId, body) => {
    await adminService.verifyProvider(providerId, body);
    await load(activeTab);
  };

  const filtered = search
    ? providers.filter(p =>
        p.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.profession?.toLowerCase().includes(search.toLowerCase())
      )
    : providers;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Provider Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review onboarding documents and activate/reject provider applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email or profession…"
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Summary */}
      <p className="text-xs text-gray-400 font-semibold">{total} provider(s) — showing {filtered.length}</p>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield size={40} className="text-gray-200 mb-3" />
          <p className="font-semibold text-gray-400">No providers in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <ProviderCard key={p._id} provider={p} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}
