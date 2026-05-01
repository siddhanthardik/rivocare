import { useState, useEffect } from 'react';
import { Users, Activity, Wallet, ShieldCheck, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../../services';
import { formatCurrency, cn } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';

const COLOR_MAP = {
  blue:   { icon: 'bg-primary-50 text-primary-600',   border: 'border-primary-100' },
  emerald:{ icon: 'bg-emerald-50 text-emerald-600',   border: 'border-emerald-100' },
  purple: { icon: 'bg-purple-50 text-purple-600',     border: 'border-purple-100' },
  amber:  { icon: 'bg-amber-50 text-amber-600',       border: 'border-amber-100' },
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((res) => setStats(res.data))
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

  const quickLinks = [
    { to: '/dashboard/admin/providers', icon: ShieldCheck, color: 'emerald', title: 'Verify Providers', sub: 'Review pending applications' },
    { to: '/dashboard/admin/users', icon: Users, color: 'blue', title: 'Manage Users', sub: 'View and update user roles' },
    { to: '/dashboard/admin/bookings', icon: Activity, color: 'purple', title: 'All Bookings', sub: 'Monitor platform bookings' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Key performance metrics and quick controls.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const c = COLOR_MAP[s.color];
          return (
            <div key={s.label} className={cn('bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all group', c.border)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105', c.icon)}>
                <s.icon size={18} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <h3 className="text-xl font-black text-slate-900">{s.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap size={15} className="text-primary-600" />
            <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            {quickLinks.map((link) => {
              const c = COLOR_MAP[link.color];
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', c.icon)}>
                      <link.icon size={16} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm group-hover:text-primary-700">{link.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-600" />
            <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest">System Activity</h2>
          </div>
          <div className="p-5 space-y-5">
            {[
              { label: 'Online Providers', value: stats?.onlineProviders || 0, max: stats?.totalProviders || 1, color: 'bg-emerald-500' },
              { label: 'Pending Bookings', value: stats?.pendingBookings || 0, max: stats?.totalBookings || 1, color: 'bg-amber-500' },
              { label: 'Last 7 Days', value: stats?.recentBookings || 0, max: stats?.totalBookings || 1, color: 'bg-primary-500' },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{bar.label}</span>
                  <span className="text-sm font-black text-slate-900">{bar.value}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={cn('h-1.5 rounded-full transition-all duration-700', bar.color)}
                    style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
