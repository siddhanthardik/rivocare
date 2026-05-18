import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Calendar,
  ChevronRight,
  Clock,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { notificationService, providerService } from '../../../services';
import { formatCurrency, formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import ProviderReviews from './ProviderReviews';
import { PageWrapper, Card, Row, Section, StatusPill } from '../../../components/ui/Layout';

export default function ProviderOverview() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;

    const loadOverview = async () => {
      try {
        const [dashboardResponse, notificationsResponse] = await Promise.all([
          providerService.getDashboard(),
          notificationService.getNotifications(5),
        ]);

        setDashboard(dashboardResponse.data);
        setNotifications(notificationsResponse.data.notifications);
      } catch (error) {
        console.error('[PROVIDER_OVERVIEW_LOAD_FAILED]', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [user?._id]);

  if (!user) {
    return <div className="p-6">Loading...</div>;
  }

  if (loading || !user?._id) {
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-3">
        <PageLoader label="Loading overview..." />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Verifying identity</p>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6">Unable to load overview right now.</div>;
  }

  const providerProfile = dashboard.provider;
  const onboardingStatus = providerProfile.onboardingStatus || 'INCOMPLETE';
  const todayVisits = dashboard.todayVisits;
  const stats = [
    { label: 'Rating', value: dashboard.rating ? `${dashboard.rating}` : '0.0' },
    { label: 'Bookings', value: dashboard.totalBookings },
    { label: 'Earnings', value: formatCurrency(dashboard.earnings) },
    { label: 'Completion', value: `${dashboard.completionRate}%` },
  ];

  return (
    <PageWrapper maxWidth="1200px">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="typo-label flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 !text-emerald-600">
              <ShieldCheck size={12} /> Expert Provider
            </span>
          </div>
          <h1 className="typo-title">Hello, {user?.name?.split(' ')[0] || 'Expert'} 👋</h1>
          <p className="typo-body">Performance overview, schedule visibility, and trust signals in one place.</p>
        </div>

        <Card className="flex items-center gap-4 border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                providerProfile.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              )}
            >
              <Activity size={16} className={providerProfile.isOnline ? 'animate-pulse' : ''} />
            </div>
            <div>
              <p className="typo-label !text-[8px] uppercase !text-gray-400">Status</p>
              <p
                className={cn(
                  'typo-label font-black',
                  providerProfile.isOnline ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {providerProfile.isOnline ? 'ONLINE' : 'OFFLINE'}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <Link to="/dashboard/provider/availability">
            <button className="btn-primary-sm !px-4">Open Availability</button>
          </Link>
        </Card>
      </div>

      {onboardingStatus !== 'ACTIVE' && (
        <Card className="mt-4 border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-indigo-900"> Complete Your Professional Onboarding</h2>
                <p className="mt-1 text-sm text-indigo-700">
                  {onboardingStatus === 'PENDING_VERIFICATION' 
                    ? 'Your application is under review. You will be notified once verified.'
                    : 'Complete your profile and upload documents to start receiving booking requests.'}
                </p>
              </div>
            </div>
            {onboardingStatus !== 'PENDING_VERIFICATION' && (
              <Link to="/dashboard/provider/onboarding">
                <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-indigo-700">
                  Continue Onboarding
                </button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {onboardingStatus === 'ACTIVE' && !providerProfile.isProfileComplete && (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-black text-amber-900">Complete your provider profile</h2>
              <p className="mt-1 text-sm text-amber-700">
                Your overview is live, but your professional profile still needs completion before it becomes your single source of truth.
              </p>
            </div>
            <Link to="/dashboard/provider/profile">
              <button className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white shadow-sm">
                Finish Profile
              </button>
            </Link>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <h3 className="text-lg font-semibold">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-3 lg:col-span-8">
          <Section
            title="Today's Schedule"
            subtitle="Your confirmed visits"
            action={
              <Link to="/dashboard/provider/bookings">
                <span className="typo-label flex cursor-pointer items-center gap-1 font-black !text-blue-600">
                  Full Schedule <ChevronRight size={14} />
                </span>
              </Link>
            }
          />

          <Card noPadding className="divide-y divide-gray-50">
            {todayVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                  <Calendar size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="typo-value !text-gray-900">No visits scheduled</h4>
                  <p className="typo-micro">You have no confirmed visits for today.</p>
                </div>
              </div>
            ) : (
              todayVisits.map((booking) => {
                const service =
                  typeof booking.service === 'object'
                    ? SERVICE_CONFIG[booking.service.slug]
                    : SERVICE_CONFIG[booking.service];

                return (
                  <Row key={booking._id} className="flex-col justify-between gap-4 p-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm',
                          service?.color || 'bg-blue-50'
                        )}
                      >
                        {service?.icon || '🩺'}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="typo-value truncate !text-gray-900">{booking.patient?.name}</h4>
                          <StatusPill status={booking.status} className="origin-left scale-90" />
                        </div>
                        <div className="typo-micro flex items-center gap-4 font-bold text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-blue-500" />
                            {formatDateTime(booking.scheduledAt).split(',')[1]}
                          </span>
                          <span>{booking.durationHours} hr</span>
                        </div>
                        <p className="typo-micro mt-1 truncate">{booking.address}</p>
                      </div>
                    </div>
                    <Link to="/dashboard/provider/bookings">
                      <button className="btn-primary-sm !px-5 !py-2.5">Open Visit</button>
                    </Link>
                  </Row>
                );
              })
            )}
          </Card>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <Section title="Recent Activity" subtitle="Notifications" />
          <Card noPadding className="flex flex-col">
            <div className="max-h-[350px] divide-y divide-gray-50 overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Row key={notification._id} className="gap-3 p-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        notification.isRead ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-600'
                      )}
                    >
                      <Activity size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'typo-body truncate leading-tight',
                          !notification.isRead && 'font-black !text-gray-900'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="typo-micro mt-0.5">{formatDateTime(notification.createdAt)}</p>
                    </div>
                  </Row>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 typo-micro">No recent activity</div>
              )}
            </div>
          </Card>

          <Card className="border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Care Reputation</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">Patient Feedback</h3>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-600">
                <Star size={14} />
                {dashboard.rating ? dashboard.rating.toFixed(1) : '0.0'}
              </div>
            </div>
            <div className="mt-4">
              <ProviderReviews providerId={providerProfile._id} />
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
