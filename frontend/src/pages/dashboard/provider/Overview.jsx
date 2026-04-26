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
    <div className="max-w-[1600px] mx-auto space-y-10 pb-12 animate-fade-in">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100/50 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Care Expert Dashboard
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-100">
              <Activity size={12} /> Live Updates
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Hello, {(() => {
              const parts = user.name.split(' ');
              if (['Dr.', 'Dr', 'Mr.', 'Mr', 'Ms.', 'Ms', 'Mrs.', 'Mrs'].includes(parts[0])) {
                return parts[1];
              }
              return parts[0];
            })()} <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">Manage your schedule, requests and earnings.</p>
        </div>

        {/* Status Chip / Toggle Widget */}
        <div className="flex items-center gap-5 bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
              providerProfile?.isOnline ? "bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/10" : "bg-red-50 text-red-500 ring-4 ring-red-500/10"
            )}>
              <Activity size={24} className={providerProfile?.isOnline ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Status</p>
              <p className={cn("text-lg font-black tracking-tight", providerProfile?.isOnline ? "text-emerald-600" : "text-red-600")}>
                {providerProfile?.isOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-2" />
          <Link to="/dashboard/provider/availability">
            <Button className={cn(
              "rounded-2xl px-6 py-2.5 font-black text-xs transition-all shadow-lg active:scale-95",
              providerProfile?.isOnline ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
            )}>
              {providerProfile?.isOnline ? 'Go Offline' : 'Go Online'}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Onboarding Card (Logic-based) ───────────────────── */}
      {!['VERIFIED', 'ACTIVE'].includes(providerProfile?.onboardingStatus) && (
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
              <p className="text-slate-400 text-base font-medium mb-8 max-w-xl leading-relaxed">
                You're just a few steps away from joining our network of care experts. Finish your onboarding to unlock service requests.
              </p>
              
              <div className="space-y-4 max-w-md">
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

            <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-[2.2rem] p-7 border border-white/10 w-full lg:w-80 transition-all group-hover:border-white/20">
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
                    <span className={cn("font-bold transition-colors", step.done ? "text-slate-200" : "text-slate-500")}>{step.label}</span>
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

      {/* ── Compact KPI Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Today’s Visits', val: todayBookings.length, sub: 'Scheduled visits', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Requests', val: pendingBookings.length, sub: 'Needs attention', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Services', val: providerProfile?.completedBookings || 0, sub: 'Completed all-time', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Month Earnings', val: formatCurrency(monthlyEarnings), sub: 'Current month', icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Avg Rating', val: providerProfile?.rating?.toFixed(1) || '—', sub: `${providerProfile?.totalRatings || 0} reviews`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 hover:border-b-blue-500">
            <div className={cn("w-12 h-12 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
              <stat.icon size={22} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.val}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Today's Schedule (Large) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Schedule</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Confirmed appointments for today</p>
              </div>
              <Link to="/dashboard/provider/bookings">
                <Button size="sm" variant="ghost" className="text-blue-600 font-black text-xs hover:bg-blue-50 rounded-xl px-4">
                  Full Schedule <ChevronRight size={14} className="ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="flex-1 divide-y divide-slate-50">
              {todayBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center h-full">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-200">
                    <Calendar size={40} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">No visits scheduled today</h4>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs">Relax! You have no confirmed visits for today. Check pending requests for new work.</p>
                </div>
              ) : (
                todayBookings.map(b => (
                  <div key={b._id} className="px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                    <div className="flex gap-6 items-center">
                      <div className={cn(
                        "w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shrink-0 shadow-lg group-hover:rotate-3 transition-transform duration-500",
                        SERVICE_CONFIG[b.service]?.color
                      )}>
                        {SERVICE_CONFIG[b.service]?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <h4 className="font-black text-slate-900 text-xl tracking-tight">{b.patient.name}</h4>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-100/50">CONFIRMED</span>
                        </div>
                        <div className="flex items-center gap-5 text-sm font-bold text-slate-500">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <Clock size={14} className="text-blue-500" /> {formatDateTime(b.scheduledAt).split(',')[1]}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <Activity size={14} className="text-emerald-500" /> {b.durationHours} hr
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium mt-3 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-slate-300" /> {b.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/dashboard/provider/bookings`}>
                        <Button className="bg-slate-900 text-white rounded-2xl font-black px-6 py-3 text-xs shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all">Start Visit</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions / Activity Feed */}
        <div className="space-y-8">
          
          {/* Recent Activity / Notifications */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-7 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                <Bell size={16} className="text-blue-500" />
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm font-medium italic">No recent activity</div>
              ) : (
                notifications.slice(0, 6).map(n => (
                  <div key={n._id} className="p-5 hover:bg-slate-50 transition-colors flex gap-4 group">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110",
                      n.isRead ? "bg-slate-50 text-slate-400" : "bg-blue-50 text-blue-600"
                    )}>
                      <Activity size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-black leading-tight truncate", n.isRead ? "text-slate-600" : "text-slate-900")}>{n.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All Notifications</button>
            </div>
          </div>

          {/* Wallet Summary Card */}
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-600/20 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Wallet size={24} />
                </div>
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">Wallet</span>
              </div>
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
              <h3 className="text-4xl font-black tracking-tight mb-8">{formatCurrency(providerProfile?.totalEarnings || 0)}</h3>
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div>
                  <p className="text-emerald-200 text-[9px] font-black uppercase tracking-[0.15em] mb-1">This Month</p>
                  <p className="text-xl font-black">{formatCurrency(monthlyEarnings)}</p>
                </div>
                <Link to="/dashboard/provider/earnings">
                  <button className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
                    <ArrowRight size={24} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Reviews & Feedback ────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Patient Feedback</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">What your clients are saying about your care</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <StarRating value={Math.round(providerProfile?.rating || 0)} size="sm" />
            <span className="font-black text-slate-900 ml-1">{providerProfile?.rating?.toFixed(1) || '—'}</span>
          </div>
        </div>
        <div className="p-8">
          {providerProfile?._id ? (
            <ProviderReviews providerId={providerProfile._id} />
          ) : (
            <div className="py-12 text-center text-slate-400 italic">No reviews found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
