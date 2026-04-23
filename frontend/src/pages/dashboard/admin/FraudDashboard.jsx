import { useState, useEffect } from 'react';
import { ShieldAlert, UserX, AlertTriangle, CheckCircle2, MoreVertical, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';

export default function FraudDashboard() {
  const [summary, setSummary] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('PROVIDER'); // PROVIDER, BOOKING, USER
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, flag: null, action: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, flagsRes] = await Promise.all([
        adminService.getFraudSummary(),
        adminService.getFraudFlags({ entityType: filterType, limit: 100 }),
      ]);
      setSummary(summaryRes.data.data);
      setFlags(flagsRes.data.data.flags);
    } catch (err) {
      toast.error('Failed to load fraud data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const handleAction = async () => {
    const { flag, action } = confirmModal;
    try {
      await adminService.takeFraudAction({ flagId: flag._id, action });
      toast.success(`Successfully applied action: ${action}`);
      setConfirmModal({ isOpen: false, flag: null, action: null });
      fetchData(); // refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const openConfirmModal = (flag, action) => {
    setConfirmModal({ isOpen: true, flag, action });
  };

  if (loading && !summary) return <PageLoader />;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="page-title text-red-700 flex items-center gap-2">
          <ShieldAlert size={28} /> Fraud Analytics & Monitoring
        </h1>
        <p className="text-slate-500 mt-1">Detect suspicious behavior and enforce platform safety policies.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-red-500 bg-red-50/30">
          <p className="text-sm font-semibold text-slate-600">Active Flags</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-800">{summary?.totalFlags || 0}</h3>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-red-600 bg-red-50">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5"><AlertTriangle size={16} /> High Severity</p>
          <div className="mt-2">
            <h3 className="text-3xl font-bold text-red-600">{summary?.highSeverityFlags || 0}</h3>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-slate-800 bg-slate-50">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><UserX size={16} /> Blocked Providers</p>
          <div className="mt-2">
            <h3 className="text-3xl font-bold text-slate-800">{summary?.blockedProviders || 0}</h3>
          </div>
        </div>
        <div className="card p-5 border-l-4 border-l-emerald-500 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5"><CheckCircle2 size={16} /> Monitored Active</p>
          <div className="mt-2">
            <h3 className="text-3xl font-bold text-emerald-600">{summary?.activeProviders || 0}</h3>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex gap-4">
          {['PROVIDER', 'BOOKING', 'USER'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filterType === type ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Flagged {type.charAt(0) + type.slice(1).toLowerCase()}s
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center"><PageLoader /></div>
          ) : flags.length === 0 ? (
            <EmptyState title="No suspicious activity detected" description={`There are currently no active fraud flags for ${filterType.toLowerCase()}s.`} icon={ShieldAlert} />
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Entity Details</th>
                  <th className="px-6 py-4 w-1/3">Reason</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {flags.map((flag) => (
                  <tr key={flag._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        flag.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                        flag.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {flag.entityType === 'PROVIDER' || flag.entityType === 'USER' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{flag.entityData?.user?.name || flag.entityData?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{flag.entityType === 'PROVIDER' ? 'Provider' : 'User'} • ID: {flag.entityId.slice(-6)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-800">Booking {flag.entityId.slice(-6)}</p>
                          <p className="text-xs text-slate-500">Service: {flag.entityData?.service || 'Unknown'}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-normal min-w-[250px]">
                      <p className="text-sm text-slate-700 font-medium">{flag.reason}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(flag.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {flag.entityType === 'PROVIDER' ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openConfirmModal(flag, 'warn')} className="text-amber-600 border-amber-200 hover:bg-amber-50 shrink-0">
                            Warn
                          </Button>
                          <Button size="sm" onClick={() => openConfirmModal(flag, 'block')} className="bg-red-600 hover:bg-red-700 text-white shrink-0">
                            Block
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => openConfirmModal(flag, 'resolve')} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className={`p-4 border-b flex justify-between items-center ${
              confirmModal.action === 'block' ? 'bg-red-50 border-red-100' :
              confirmModal.action === 'warn' ? 'bg-amber-50 border-amber-100' :
              'bg-slate-50 border-slate-200'
            }`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${
                confirmModal.action === 'block' ? 'text-red-700' :
                confirmModal.action === 'warn' ? 'text-amber-700' :
                'text-slate-700'
              }`}>
                {confirmModal.action === 'block' && <AlertCircle size={20} />}
                {confirmModal.action === 'warn' && <AlertTriangle size={20} />}
                {confirmModal.action === 'resolve' && <CheckCircle2 size={20} />}
                Confirm {confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)}
              </h3>
              <button onClick={() => setConfirmModal({ isOpen: false, flag: null, action: null })} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                Are you sure you want to <strong>{confirmModal.action}</strong> this {confirmModal.flag?.entityType.toLowerCase()}? 
                {confirmModal.action === 'block' && " They will be immediately prevented from accepting new bookings."}
                {confirmModal.action === 'warn' && " A strike will be recorded against their account."}
              </p>
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-6">
                <p className="font-semibold text-slate-700 mb-1">Flag Details:</p>
                <p className="text-slate-500 italic">"{confirmModal.flag?.reason}"</p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setConfirmModal({ isOpen: false, flag: null, action: null })}>Cancel</Button>
                <Button 
                  onClick={handleAction} 
                  className={
                    confirmModal.action === 'block' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    confirmModal.action === 'warn' ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' : ''
                  }
                >
                  Confirm Action
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
