import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, IndianRupee, CheckCircle, Users, ShieldCheck,
  Calendar, BarChart2, RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services';
import { formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';

// ── Colour palettes ──────────────────────────────────────────
const STATUS_COLORS = {
  completed:   '#10b981',
  pending:     '#f59e0b',
  confirmed:   '#3b82f6',
  'in-progress': '#8b5cf6',
  cancelled:   '#ef4444',
};
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ── Reusable metric card ─────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, gradient, trend }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
      {/* background blob */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-xl">
            <Icon size={20} />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-white/20' : 'bg-red-500/30'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-white/70 text-sm font-medium">{label}</p>
          <p className="text-2xl font-black mt-0.5">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-indigo-500" />}
          <h2 className="font-semibold text-slate-800">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Custom tooltip for charts ────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Star rating renderer ─────────────────────────────────────
function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs text-slate-500">({rating?.toFixed(1) || '—'})</span>
    </span>
  );
}

// ── Main component ───────────────────────────────────────────
export default function AdminRevenueDashboard() {
  const [summary, setSummary]         = useState(null);
  const [revenue, setRevenue]         = useState({ daily: [], monthly: [] });
  const [topProviders, setTopProviders] = useState([]);
  const [bookings, setBookings]         = useState({ statusBreakdown: {}, serviceBreakdown: [] });
  const [period, setPeriod]             = useState(7);
  const [chartMode, setChartMode]       = useState('daily'); // 'daily' | 'monthly'
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [sumRes, revRes, provRes, bookRes] = await Promise.all([
        adminService.getDashboardSummary(),
        adminService.getDashboardRevenue(period),
        adminService.getTopProviders(10),
        adminService.getDashboardBookings(),
      ]);
      setSummary(sumRes.data.data);
      setRevenue(revRes.data.data);
      setTopProviders(provRes.data.data.topProviders);
      setBookings(bookRes.data.data);
      if (showRefresh) toast.success('Dashboard refreshed');
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  // Build pie data from status breakdown
  const statusPieData = Object.entries(bookings.statusBreakdown || {}).map(([name, value]) => ({
    name, value,
  }));

  // Current chart data
  const chartData = chartMode === 'daily' ? revenue.daily : revenue.monthly;

  // Completion rate
  const completionRate = summary?.totalBookings
    ? Math.round((summary.completedBookings / summary.totalBookings) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Revenue Dashboard 📊</h1>
          <p className="text-slate-500 mt-0.5">Platform financial overview and business analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-sm font-medium">
            {[7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  period === d
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Platform Revenue (20%)"
          value={formatCurrency(summary?.totalRevenue || 0)}
          sub={`Gross: ${formatCurrency(summary?.grossRevenue || 0)}`}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
        />
        <KpiCard
          label="Total Bookings"
          value={summary?.totalBookings?.toLocaleString() || '0'}
          sub={`${completionRate}% completion rate`}
          icon={Calendar}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <KpiCard
          label="Completed Bookings"
          value={summary?.completedBookings?.toLocaleString() || '0'}
          sub={`${summary?.cancelledBookings || 0} cancelled`}
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
        />
        <KpiCard
          label="Active Providers"
          value={summary?.totalProviders?.toLocaleString() || '0'}
          sub={`${summary?.totalUsers || 0} total patients`}
          icon={ShieldCheck}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Revenue Chart ────────────────────────────────── */}
      <Section
        title="Revenue Trend"
        icon={TrendingUp}
        action={
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-medium">
            {['daily', 'monthly'].map((m) => (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  chartMode === m
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        }
      >
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-slate-400">
            <TrendingUp size={36} className="mb-2 opacity-30" />
            <p className="text-sm">No revenue data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                name="bookings"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Booking Status + Service Breakdown ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie — Booking status */}
        <Section title="Booking Status" icon={BarChart2}>
          {statusPieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-400">
              <p className="text-sm">No booking data available</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {statusPieData.map((entry) => {
                  const total = statusPieData.reduce((s, e) => s + e.value, 0);
                  const pct = total ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[entry.name] || '#94a3b8' }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 capitalize font-medium">{entry.name}</span>
                          <span className="text-slate-800 font-bold">{entry.value} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: STATUS_COLORS[entry.name] || '#94a3b8' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* Bar — Service breakdown */}
        <Section title="Revenue by Service" icon={BarChart2}>
          {bookings.serviceBreakdown?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-slate-400">
              <p className="text-sm">No service data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={(bookings.serviceBreakdown || []).map((s) => ({
                  name: SERVICE_CONFIG[s._id]?.label || s._id,
                  revenue: s.revenue,
                  jobs: s.count,
                  icon: SERVICE_CONFIG[s._id]?.icon || '🏥',
                }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="revenue" radius={[6, 6, 0, 0]}>
                  {(bookings.serviceBreakdown || []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Top Providers Table ──────────────────────────── */}
      <Section title="Top Performing Providers" icon={Users}>
        {topProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ShieldCheck size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No completed bookings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 -mb-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase font-semibold">
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Services</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3 text-center">Jobs Done</th>
                  <th className="px-6 py-3 text-right">Total Earnings</th>
                  <th className="px-6 py-3 text-right">Platform Cut (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProviders.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-100 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {p.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {p.name}
                            {p.isVerified && (
                              <span className="text-emerald-500" title="Verified">✓</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.services || []).map((s) => (
                          <span key={s} className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">
                            {SERVICE_CONFIG[s]?.icon} {SERVICE_CONFIG[s]?.label || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Stars rating={p.rating} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                        {p.completedBookings}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800">
                      {formatCurrency(p.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-indigo-600">
                        {formatCurrency(p.platformShare)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Footer note ─────────────────────────────────── */}
      <p className="text-center text-xs text-slate-400 pb-2">
        Revenue figures reflect completed &amp; paid bookings only. Platform commission is 20% of gross booking value.
      </p>
    </div>
  );
}
