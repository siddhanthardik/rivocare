import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Users, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, XCircle } from 'lucide-react';
import { formatDateTime } from '../../../utils';

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl border ${color.border} ${color.bg}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-semibold ${color.text} mb-1`}>{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color.iconBg} ${color.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SupplyExpansion() {
  const [data, setData] = useState({
    leads: [],
    stats: null,
    gaps: [],
    providerStats: null
  });
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    Promise.all([
      adminService.getProviderLeads({ limit: 50 }),
      adminService.getSupplyGaps()
    ])
      .then(([leadsRes, gapsRes]) => {
        setData({
          leads: leadsRes.data.data.leads,
          stats: leadsRes.data.data.stats,
          gaps: gapsRes.data.data.gaps,
          providerStats: gapsRes.data.data.providerStats
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load supply expansion data');
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const updateStatus = async (id, status) => {
    try {
      await adminService.updateLeadStatus(id, { status });
      toast.success(`Lead marked as ${status}`);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error('Failed to update lead');
    }
  };

  if (loading && !data.stats) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Supply Expansion</h1>
        <p className="text-slate-500">Manage provider pipeline, referrals, and fill critical coverage gaps.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Leads" 
          value={data.stats?.total || 0} 
          icon={<Users size={20} />}
          color={{ bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-100' }} 
        />
        <StatCard 
          title="New Arrivals" 
          value={data.stats?.new || 0} 
          icon={<TrendingUp size={20} />}
          color={{ bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-100' }} 
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${data.stats?.conversionRate || 0}%`} 
          icon={<CheckCircle size={20} />}
          color={{ bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', iconBg: 'bg-purple-100' }} 
        />
        <StatCard 
          title="Critical Gaps" 
          value={data.gaps.filter(g => g.severity === 'CRITICAL').length} 
          icon={<AlertTriangle size={20} />}
          color={{ bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', iconBg: 'bg-red-100' }} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Lead Management */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg">Provider Leads Pipeline</h2>
              <Badge status="pending" label={`${data.stats?.new || 0} action required`} />
            </div>
            
            {data.leads.length === 0 ? (
              <EmptyState title="No leads yet" description="Share the signup link to start receiving leads." />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.leads.map(lead => (
                  <div key={lead._id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800 text-base">{lead.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            lead.status === 'NEW' ? 'bg-amber-100 text-amber-700' :
                            lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                            lead.status === 'ONBOARDED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {lead.status}
                          </span>
                          {lead.source === 'REFERRAL' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">REFERRAL</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{lead.serviceType} • {lead.pincode} • {lead.experience} yrs exp</p>
                        <p className="text-sm text-slate-500 font-mono">{lead.phone} {lead.email && `• ${lead.email}`}</p>
                        <p className="text-xs text-slate-400 mt-2">Applied {formatDateTime(lead.createdAt)}</p>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {lead.status === 'NEW' && (
                          <Button size="sm" onClick={() => updateStatus(lead._id, 'CONTACTED')} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                            Mark Contacted
                          </Button>
                        )}
                        {['NEW', 'CONTACTED'].includes(lead.status) && (
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 w-full sm:w-auto" onClick={() => updateStatus(lead._id, 'ONBOARDED')}>
                            Mark Onboarded
                          </Button>
                        )}
                        {lead.status !== 'REJECTED' && lead.status !== 'ONBOARDED' && (
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600 w-full sm:w-auto" onClick={() => updateStatus(lead._id, 'REJECTED')}>
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Supply Analytics */}
        <div className="space-y-6">
          <div className="card">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} /> Supply Gaps
              </h2>
              <p className="text-xs text-slate-500 mt-1">Pincodes with high demand but low provider supply in the last 30 days.</p>
            </div>
            <div className="p-5">
              {data.gaps.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-4">No critical supply gaps detected.</div>
              ) : (
                <div className="space-y-4">
                  {data.gaps.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-slate-800">{gap.pincode}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            gap.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            gap.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{gap.bookings} bookings • {gap.activeProviders} active providers</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700 shrink-0">Gap: {gap.gap.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full opacity-10 blur-2xl"></div>
            <h3 className="font-bold text-lg mb-4 text-indigo-50">Activation Funnel</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-sm font-medium text-indigo-100">Total Registered</span>
                <span className="font-bold text-xl">{data.providerStats?.totalIncomplete + data.providerStats?.totalKycPending + data.providerStats?.totalVerified || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-sm font-medium text-emerald-100">KYC Verified</span>
                <span className="font-bold text-xl">{data.providerStats?.totalVerified || 0}</span>
              </div>
              <div className="flex justify-between items-center bg-indigo-500/20 p-3 rounded-lg border border-indigo-400/30">
                <span className="text-sm font-medium text-indigo-50">Fully Active (Online)</span>
                <span className="font-bold text-2xl text-white">{data.providerStats?.totalActive || 0}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
