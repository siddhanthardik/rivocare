import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Wallet, 
  AlertCircle, 
  Star, 
  ArrowRight, 
  Bell, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  User, 
  MessageSquare,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService, authService, notificationService, walletService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG, cn } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StarRating from '../../../components/ui/StarRating';
import ProviderReviews from './ProviderReviews';

export default function ProviderOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    Promise.all([
      bookingService.getAll({ limit: 20 }),
      authService.getMe(),
      notificationService.getNotifications(5),
      walletService.getTransactions({ limit: 50 })
    ])
      .then(([bookingsRes, meRes, notifRes, walletRes]) => {
        const bookings = bookingsRes.data.data.bookings;
        setData({
          bookings,
          total: bookingsRes.data.data.total
        });
        setProviderProfile(meRes.data.data.providerProfile);
        setNotifications(notifRes.data.data.notifications || []);
        
        // Calculate monthly earnings from credit transactions
        const mEarnings = (walletRes.data.data.transactions || [])
          .filter(t => t.type === 'CREDIT' && new Date(t.createdAt) >= firstDayOfMonth)
          .reduce((sum, t) => sum + t.amount, 0);
        setMonthlyEarnings(mEarnings);
      })
      .catch((err) => console.error('Provider Overview Error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pendingBookings = data?.bookings.filter(b => b.status === 'pending') || [];
  const todayBookings = data?.bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'pending') return false;
    const date = new Date(b.scheduledAt);
    const today = new Date();
    return (
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()
    );
  }) || [];

  const progressPercent = (() => {
    let completed = 0;
    const total = 5;
    if (providerProfile?.services?.length > 0) completed++;
    if (providerProfile?.experience >= 0) completed++;
    if (providerProfile?.pincodesServed?.length > 0) completed++;
    if (['KYC_PENDING', 'VERIFIED', 'ACTIVE'].includes(providerProfile?.onboardingStatus)) {
      completed += 2; // KYC + Bank
    }
    return Math.round((completed / total) * 100);
  })();

  return (
    <div className="space-y-8 pb-10">
      {/* ── Role Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100/50">
              <ShieldCheck size={12} /> Care Expert Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Hello, {user.name.split(' ')[0]} <span className="animate-pulse">👋</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage your schedule, earnings and care requests.</p>
        </div>

        {/* Availability Toggle Widget */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              providerProfile?.isOnline ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
            )}>
              <Activity size={20} className={providerProfile?.isOnline ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
              <p className={cn("text-sm font-black", providerProfile?.isOnline ? "text-emerald-600" : "text-slate-500")}>
                {providerProfile?.isOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
          </div>
          <Link to="/dashboard/provider/availability">
            <Button size="sm" className="bg-slate-900 text-white rounded-xl text-xs px-5">Toggle</Button>
          </Link>
        </div>
      </div>

      {/* ── Onboarding Card ─────────────────────────────────── */}
      {providerProfile?.onboardingStatus !== 'ACTIVE' && (
        <div className="relative group overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp className="text-emerald-400" size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Complete profile to start earning</h2>
              </div>
              <p className="text-slate-400 text-base font-medium mb-8 max-w-xl">
                You're just a few steps away from joining our network of care experts. Finish your onboarding to unlock service requests.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">Onboarding Progress</span>
                  <span className="text-emerald-400 font-black text-sm">{progressPercent}%</span>
                </div>
                <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 w-full lg:w-80">
              <div className="space-y-4">
                {[
                  { label: 'Profile Information', done: providerProfile?.services?.length > 0 },
                  { label: 'KYC Documents', done: progressPercent >= 80 },
                  { label: 'Availability Setup', done: providerProfile?.onboardingStatus === 'ACTIVE' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    {step.done ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-600" />
                    )}
                    <span className={cn("font-bold", step.done ? "text-slate-200" : "text-slate-500")}>{step.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                {providerProfile?.onboardingStatus === 'INCOMPLETE' && (
                  <Link to="/dashboard/provider/onboarding">
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20">Continue Onboarding</Button>
                  </Link>
                )}
                {providerProfile?.onboardingStatus === 'KYC_PENDING' && (
                  <div className="text-center bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                    <p className="text-amber-400 font-black text-sm">KYC Under Review</p>
                  </div>
                )}
                {providerProfile?.onboardingStatus === 'VERIFIED' && (
                  <Link to="/dashboard/provider/availability">
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 text-sm">Turn Availability ON</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Today’s Schedule', val: todayBookings.length, sub: 'Confirmed visits', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Requests', val: pendingBookings.length, sub: 'Awaiting action', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Monthly Earnings', val: formatCurrency(monthlyEarnings), sub: 'Current month', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Completed Services', val: providerProfile?.completedBookings || 0, sub: 'Total all-time', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Rating', val: providerProfile?.rating?.toFixed(1) || '—', sub: `${providerProfile?.totalRatings || 0} reviews`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={cn("w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900">{stat.val}</h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Dashboard Panels ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Appointments Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Appointments</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Confirmed bookings for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
              </div>
              <Link to="/dashboard/provider/bookings" className="text-blue-600 font-black text-xs hover:underline flex items-center gap-1">
                Full Schedule <ChevronRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {todayBookings.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Calendar size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">No appointments today</h4>
                  <p className="text-slate-400 text-sm mt-1">Check your pending requests for new work.</p>
                </div>
              ) : (
                todayBookings.map(b => (
                  <div key={b._id} className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex gap-5 items-center">
                      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0 shadow-inner", SERVICE_CONFIG[b.service]?.color)}>
                        {SERVICE_CONFIG[b.service]?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 text-lg tracking-tight">{b.patient.name}</h4>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full">CONFIRMED</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {formatDateTime(b.scheduledAt).split(',')[1]}</span>
                          <span className="flex items-center gap-1.5"><Activity size={14} className="text-slate-400" /> {b.durationHours} hr session</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1.5 line-clamp-1">{b.address}</p>
                      </div>
                    </div>
                    <Link to={`/dashboard/provider/bookings`}>
                      <Button size="sm" variant="ghost" className="rounded-xl border border-slate-100 font-bold text-slate-600 hover:bg-white hover:shadow-sm">Details</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Booking Requests Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Pending Requests</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Approve or reject incoming care requests</p>
              </div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full">{pendingBookings.length} PENDING</span>
            </div>
            <div className="divide-y divide-slate-50">
              {pendingBookings.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-400 font-medium italic">No pending requests at the moment.</div>
              ) : (
                pendingBookings.slice(0, 3).map(b => (
                  <div key={b._id} className="px-8 py-6 flex items-center justify-between hover:bg-amber-50/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <User className="text-slate-400" size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-base">{b.patient.name}</h4>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{SERVICE_CONFIG[b.service]?.label} • {formatCurrency(b.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="hidden sm:block text-xs font-bold text-slate-400">{formatDateTime(b.scheduledAt)}</p>
                      <Link to="/dashboard/provider/bookings">
                        <button className="p-3 rounded-xl bg-slate-900 text-white hover:bg-blue-600 transition-colors">
                          <ArrowRight size={18} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            {pendingBookings.length > 3 && (
              <div className="p-5 text-center bg-slate-50/50 border-t border-slate-100">
                <Link to="/dashboard/provider/bookings" className="text-sm font-black text-slate-600 hover:text-blue-600">View all pending requests</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Col 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Recent Notifications Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <Bell size={18} className="text-slate-400" />
            </div>
            <div className="divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No recent notifications</div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n._id} className="p-5 hover:bg-slate-50 transition-colors flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                      n.isRead ? "bg-slate-50 text-slate-400" : "bg-blue-50 text-blue-600"
                    )}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold leading-tight", n.isRead ? "text-slate-600" : "text-slate-900")}>{n.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Earnings Summary Mini-Widget */}
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-emerald-100 text-xs font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
              <h3 className="text-4xl font-black mb-6">{formatCurrency(providerProfile?.totalEarnings || 0)}</h3>
              <div className="flex items-center justify-between pt-6 border-t border-emerald-500/50">
                <div>
                  <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest mb-1">Monthly</p>
                  <p className="text-lg font-black">{formatCurrency(monthlyEarnings)}</p>
                </div>
                <Link to="/dashboard/provider/earnings">
                  <button className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Ratings Summary Mini-Widget */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 tracking-tight">Expert Rating</h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={18} fill="currentColor" />
                <span className="font-black">{providerProfile?.rating?.toFixed(1) || '—'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">Your current rating is based on {providerProfile?.totalRatings || 0} client reviews.</p>
              <Link to="/dashboard/provider/profile">
                <Button variant="ghost" className="w-full rounded-2xl py-4 border-slate-100 text-slate-600 font-bold hover:bg-slate-50">View Detailed Feedback</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ratings & Reviews Full Panel ─────────────────────── */}
      {providerProfile?._id && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mt-8">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight tracking-tight flex items-center gap-3">
              <MessageSquare className="text-blue-500" size={24} /> Ratings & Reviews
            </h3>
          </div>
          <div className="p-8">
            <ProviderReviews providerId={providerProfile._id} />
          </div>
        </div>
      )}
    </div>
  );
}
