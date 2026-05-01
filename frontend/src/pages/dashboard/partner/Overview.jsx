import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Clock, CheckCircle2,
  FlaskConical, Activity, CreditCard, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { formatCurrency } from '../../../utils/format';
import { cn } from '../../../utils';

const STATUS_MAP = {
  new:                { label: 'New',         color: 'bg-blue-50 text-blue-600 border-blue-100' },
  accepted:           { label: 'Confirmed',   color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  technician_assigned:{ label: 'Assigned',    color: 'bg-purple-50 text-purple-600 border-purple-100' },
  sample_collected:   { label: 'Collected',   color: 'bg-amber-50 text-amber-600 border-amber-100' },
  processing:         { label: 'Processing',  color: 'bg-orange-50 text-orange-600 border-orange-100' },
  report_uploaded:    { label: 'Report Ready',color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  completed:          { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:          { label: 'Cancelled',   color: 'bg-red-50 text-red-500 border-red-100' },
  rejected:           { label: 'Rejected',    color: 'bg-red-100 text-red-600 border-red-200' },
};

export default function PartnerOverview() {
  const [data, setData] = useState(null);
  const [fin, setFin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, finRes] = await Promise.all([
        labService.getDashboard(),
        labService.getFinancialSummary()
      ]);
      setData(dashRes.data.stats);
      setFin(finRes.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader />;

  const financialKpis = [
    {
      label: 'Available Balance',
      value: formatCurrency(fin?.availableBalance),
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: "Today's Earnings",
      value: formatCurrency(fin?.todayEarnings),
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'This Month',
      value: formatCurrency(fin?.monthlyEarnings),
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Pending Payout',
      value: formatCurrency(fin?.pendingSettlement),
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  const orderStats = [
    { label: 'Orders Today', value: data?.todayOrders ?? 0, icon: ShoppingBag, color: 'text-gray-500' },
    { label: 'Pending Action', value: data?.pendingAction ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Completed Today', value: data?.collectedToday ?? 0, icon: CheckCircle2, color: 'text-green-600' },
  ];

  const recentOrders = data?.recentOrders ?? [];

  return (
    <div className="page-container">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-info">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="typo-label !text-gray-400">Command Center</span>
          </div>
          <h1 className="typo-title">Overview</h1>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Financial Strip ─────────────────────────────────────── */}
      <div className="kpi-strip">
        {financialKpis.map((k) => (
          <div key={k.label} className={cn('bg-white rounded-xl border py-3 px-4 flex items-center gap-3', k.border)}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', k.bg, k.color)}>
              {k.icon && <k.icon size={16} />}
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="typo-label truncate">{k.label}</p>
              <p className="typo-kpi leading-tight">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="section-block">
        
        {/* Compact Order Summary */}
        <div className="grid grid-cols-3 gap-3">
          {orderStats.map(stat => (
            <div key={stat.label} className="compact-card py-3 px-4 flex flex-col items-center text-center">
              <stat.icon size={15} className={cn('mb-1.5', stat.color)} />
              <p className="typo-value leading-tight">{stat.value}</p>
              <p className="typo-label mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="compact-card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-indigo-500" />
              <h2 className="typo-value !text-gray-900 !text-[14px]">Live Activity</h2>
            </div>
            <Link to="/dashboard/partner/lab/orders" className="typo-label !text-indigo-600 hover:!text-indigo-800 transition-colors">
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-2">
                <FlaskConical size={18} className="text-gray-300" />
              </div>
              <p className="typo-body !text-gray-400 font-medium">No active orders today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.slice(0, 8).map((order) => {
                const s = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
                return (
                  <div key={order._id} className="table-row flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 border border-gray-100 flex items-center justify-center text-[11px] font-semibold shrink-0">
                        {order.patient?.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="typo-body !text-gray-900 font-medium truncate leading-tight">{order.patient?.name}</p>
                        <p className="typo-micro truncate mt-0.5">
                          {order.tests?.map(t => t.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className={cn('typo-label !text-[10px] !font-semibold px-2.5 py-0.5 rounded border shrink-0', s.color)}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Notice */}
        <p className="typo-micro text-center pt-2">
          Available balance updates only when payment status is <strong>Collected</strong> by the finance team. 
          All values are computed strictly from real ledger entries.
        </p>

      </div>
    </div>
  );
}
