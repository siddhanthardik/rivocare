import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Wallet, 
  Star, 
  ArrowRight, 
  Bell, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService, authService, notificationService, walletService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG, cn } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import StarRating from '../../../components/ui/StarRating';
import ProviderReviews from './ProviderReviews';
import { PageWrapper, Card, Row, Section, KPIChip, StatusPill } from '../../../components/ui/Layout';

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
        const bookings = bookingsRes.data.bookings;
        setData({
          bookings,
          total: bookingsRes.data.total
        });
        setProviderProfile(meRes.data.providerProfile);
        setNotifications(notifRes.data.notifications || []);
        
        const mEarnings = (walletRes.data.transactions || [])
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

  const stats = [
    { label: "Today's Visits", val: todayBookings.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50/30' },
    { label: 'Pending Action', val: pendingBookings.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/30' },
    { label: 'Completed', val: providerProfile?.completedBookings || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/30' },
    { label: 'Month Earnings', val: formatCurrency(monthlyEarnings), icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-50/30' },
    { label: 'Avg Rating', val: providerProfile?.rating?.toFixed(1) || '—', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50/30' }
  ];

  return (
    <PageWrapper maxWidth="1200px">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="typo-label !text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              <ShieldCheck size={12} /> Expert Provider
            </span>
          </div>
          <h1 className="typo-title">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="typo-body">Manage your schedule, requests and earnings.</p>
        </div>

        {/* Status Chip */}
        <Card className="flex items-center gap-4 bg-white border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              providerProfile?.isOnline ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            )}>
              <Activity size={16} className={providerProfile?.isOnline ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="typo-label !text-gray-400 !text-[8px] uppercase">Status</p>
              <p className={cn("typo-label font-black", providerProfile?.isOnline ? "text-emerald-600" : "text-red-600")}>
                {providerProfile?.isOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <Link to="/dashboard/provider/availability">
            <button className={cn(
              "btn-primary-sm !px-4",
              !providerProfile?.isOnline && "bg-emerald-600 hover:bg-emerald-700"
            )}>
              {providerProfile?.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </Link>
        </Card>
      </div>

      {/* ── Onboarding Card ────────────────────────────────── */}
      {!['VERIFIED', 'ACTIVE'].includes(providerProfile?.onboardingStatus) && (
        <Card className="relative bg-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl mt-4 border-transparent">
          <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 scale-150 pointer-events-none">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp className="text-emerald-400" size={20} />
                </div>
                <h2 className="typo-title !text-white !text-[20px]">Complete profile to start earning</h2>
              </div>
              <p className="typo-body !text-slate-400 max-w-xl">
                Finish your onboarding to unlock service requests.
              </p>
              
              <div className="space-y-3 max-w-sm">
                <div className="flex items-center justify-between">
                  <span className="typo-label !text-white">Onboarding Progress</span>
                  <span className="typo-label !text-emerald-400">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            <Card className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full lg:w-72">
              <div className="space-y-3">
                {[
                  { label: 'Profile Information', done: providerProfile?.services?.length > 0 },
                  { label: 'KYC Documents', done: progressPercent >= 80 },
                  { label: 'Availability Setup', done: providerProfile?.onboardingStatus === 'ACTIVE' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {step.done ? <CheckCircle2 size={16} className="text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                    <span className={cn("typo-label", step.done ? "text-slate-200" : "text-slate-500")}>{step.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                {providerProfile?.onboardingStatus === 'INCOMPLETE' && (
                  <Link to="/dashboard/provider/onboarding">
                    <button className="w-full btn-primary-sm !bg-emerald-600 !py-2.5">Continue</button>
                  </Link>
                )}
                {providerProfile?.onboardingStatus === 'VERIFIED' && (
                  <Link to="/dashboard/provider/availability">
                    <button className="w-full btn-primary-sm !bg-emerald-600 !py-2.5">Go Live</button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* ── KPI Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {stats.map((s, i) => (
          <KPIChip key={i} icon={s.icon} label={s.label} value={s.val} bg={s.bg} color={s.color} />
        ))}
      </div>

      {/* ── Main Content Grid ───────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        
        {/* Today's Schedule */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          <Section 
            title="Today's Schedule" 
            subtitle="Your confirmed visits"
            action={
              <Link to="/dashboard/provider/bookings">
                <span className="typo-label !text-blue-600 font-black flex items-center gap-1 cursor-pointer">
                  Full Schedule <ChevronRight size={14} />
                </span>
              </Link>
            }
          />
          
          <Card noPadding className="divide-y divide-gray-50">
            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                  <Calendar size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="typo-value !text-gray-900">No visits scheduled</h4>
                  <p className="typo-micro">Relax! You have no confirmed visits for today.</p>
                </div>
              </div>
            ) : (
              todayBookings.map(b => (
                <Row key={b._id} className="flex-col sm:flex-row sm:items-center justify-between gap-4 p-3">
                  <div className="flex gap-4 items-center">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm", SERVICE_CONFIG[b.service]?.color)}>
                      {SERVICE_CONFIG[b.service]?.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="typo-value !text-gray-900 truncate">{b.patient.name}</h4>
                        <StatusPill status="confirmed" className="scale-90 origin-left" />
                      </div>
                      <div className="flex items-center gap-4 typo-micro font-bold text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> {formatDateTime(b.scheduledAt).split(',')[1]}</span>
                        <span className="flex items-center gap-1"><Activity size={12} className="text-emerald-500" /> {b.durationHours} hr</span>
                      </div>
                      <p className="typo-micro mt-1 truncate">{b.address}</p>
                    </div>
                  </div>
                  <Link to={`/dashboard/provider/bookings`}>
                    <button className="btn-primary-sm !px-5 !py-2.5">Start Visit</button>
                  </Link>
                </Row>
              ))
            )}
          </Card>
        </div>

        {/* Side Widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Section title="Recent Activity" subtitle="Notifications" />
          <Card noPadding className="flex flex-col">
            <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto no-scrollbar">
              {notifications.slice(0, 6).map(n => (
                <Row key={n._id} className="gap-3 p-3">
                  <div className={cn("w-8 h-8 rounded-lg shrink-0 flex items-center justify-center", n.isRead ? "bg-gray-50 text-gray-400" : "bg-blue-50 text-blue-600")}>
                    <Activity size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("typo-body leading-tight truncate", !n.isRead && "font-black !text-gray-900")}>{n.title}</p>
                    <p className="typo-micro mt-0.5">{formatDateTime(n.createdAt)}</p>
                  </div>
                </Row>
              ))}
              {notifications.length === 0 && (
                <div className="p-8 text-center typo-micro text-gray-400">No recent activity</div>
              )}
            </div>
          </Card>

          <Card className="bg-emerald-600 p-5 text-white shadow-lg relative overflow-hidden group border-transparent">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white">
                  <Wallet size={20} />
                </div>
                <span className="typo-label !text-white">Earnings</span>
              </div>
              <div>
                <p className="typo-micro !text-emerald-100 opacity-80 uppercase tracking-widest font-black mb-1">Available Balance</p>
                <h3 className="typo-kpi !text-white !text-[32px]">{formatCurrency(providerProfile?.totalEarnings || 0)}</h3>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="typo-micro !text-emerald-100 opacity-70 uppercase tracking-wider">This Month</p>
                  <p className="typo-value !text-white">{formatCurrency(monthlyEarnings)}</p>
                </div>
                <Link to="/dashboard/provider/earnings">
                  <button className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md">
                    <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Patient Feedback */}
      <div className="mt-6 space-y-2">
        <Section 
          title="Patient Feedback" 
          subtitle="Recent reviews"
          action={
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
              <StarRating value={Math.round(providerProfile?.rating || 0)} size="xs" />
              <span className="typo-label !text-gray-900">{providerProfile?.rating?.toFixed(1) || '—'}</span>
            </div>
          }
        />
        <Card noPadding>
          <div className="p-3">
            {providerProfile?._id ? <ProviderReviews providerId={providerProfile._id} /> : <div className="py-12 text-center typo-body !text-gray-400 italic">No reviews found.</div>}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
