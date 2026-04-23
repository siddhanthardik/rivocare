import { useState, useEffect } from 'react';
import { Users, Activity, Wallet, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../../services';
import { formatCurrency } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Patients', value: stats?.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Providers', value: stats?.totalProviders || 0, icon: ShieldCheck, color: 'emerald' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Activity, color: 'purple' },
    { label: 'Platform Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: Wallet, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title leading-tight">Admin Dashboard 👋</h1>
        <p className="text-slate-500">Platform overview and key performance metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card border-none bg-${s.color}-50`}>
            <div className={`p-3 bg-${s.color}-500 text-white rounded-xl`}><s.icon size={24} /></div>
            <div>
              <p className={`text-sm font-medium text-${s.color}-600 mb-0.5`}>{s.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Quick Actions</h2></div>
          <div className="p-4 space-y-3">
            <Link to="/dashboard/admin/providers" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><ShieldCheck size={20} /></div>
                <div>
                  <h4 className="font-medium text-slate-800 group-hover:text-primary-700">Verify Providers</h4>
                  <p className="text-xs text-slate-500">Review pending provider applications</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-primary-500" />
            </Link>
            <Link to="/dashboard/admin/users" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
                <div>
                  <h4 className="font-medium text-slate-800 group-hover:text-primary-700">Manage Users</h4>
                  <p className="text-xs text-slate-500">View and update user roles or access</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-primary-500" />
            </Link>
            <Link to="/dashboard/admin/bookings" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Activity size={20} /></div>
                <div>
                  <h4 className="font-medium text-slate-800 group-hover:text-primary-700">All Bookings</h4>
                  <p className="text-xs text-slate-500">Monitor all platform bookings</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-primary-500" />
            </Link>
          </div>
        </div>

        {/* System Activity Summary */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">System Activity</h2></div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Online Providers</span>
                  <span className="text-sm font-bold text-slate-800">{stats?.onlineProviders || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(((stats?.onlineProviders || 0) / (stats?.totalProviders || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Pending Bookings</span>
                  <span className="text-sm font-bold text-slate-800">{stats?.pendingBookings || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(((stats?.pendingBookings || 0) / (stats?.totalBookings || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Last 7 Days Bookings</span>
                  <span className="text-sm font-bold text-slate-800">{stats?.recentBookings || 0}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${Math.min(((stats?.recentBookings || 0) / (stats?.totalBookings || 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
