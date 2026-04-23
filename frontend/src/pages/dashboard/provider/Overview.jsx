import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, Wallet, AlertCircle, Star } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService, authService } from '../../../services';
import { formatDateTime, formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StarRating from '../../../components/ui/StarRating';
import ProviderReviews from './ProviderReviews';

export default function ProviderOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingService.getAll({ limit: 10 }),
      authService.getMe()
    ])
      .then(([bookingsRes, meRes]) => {
        setData({
          bookings: bookingsRes.data.data.bookings,
          total: bookingsRes.data.data.total
        });
        setProviderProfile(meRes.data.data.providerProfile);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const pendingBookings = data?.bookings.filter(b => b.status === 'pending') || [];
  const todayBookings = data?.bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'pending') return false;
    const date = new Date(b.scheduledAt);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }) || [];

  const calculateOnboardingProgress = () => {
    let completed = 0;
    const total = 5;
    
    // 1. Profile Info
    if (providerProfile?.services?.length > 0) completed++;
    // 2. Experience
    if (providerProfile?.experience > 0 || providerProfile?.experience === 0) completed++; // assuming 0 is valid experience
    // 3. Pincode
    if (providerProfile?.pincodesServed?.length > 0) completed++;
    // 4. KYC Upload & 5. Bank Details loosely tracked by onboarding status
    if (['KYC_PENDING', 'VERIFIED', 'ACTIVE'].includes(providerProfile?.onboardingStatus)) {
      completed++; // KYC
      completed++; // Bank details are uploaded alongside KYC
    }
    
    return Math.round((completed / total) * 100);
  };

  const progressPercent = calculateOnboardingProgress();

  return (
    <div className="space-y-6">
      {providerProfile?.onboardingStatus !== 'ACTIVE' && (
        <div className="card p-6 bg-white border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200 rounded-full opacity-10 blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between z-10 relative">
            <div className="flex-1 w-full">
              <h3 className="text-xl font-bold text-slate-800 mb-1">Complete profile to start earning</h3>
              <p className="text-sm text-slate-500 mb-5">Complete your details and submit documents to activate your account.</p>
              
              <div className="mb-2 flex justify-between items-center text-sm font-bold text-slate-700">
                <span>Onboarding Progress</span>
                <span className="text-primary-600">{progressPercent}% complete</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-5">
                <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${providerProfile?.services?.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle size={14} className={providerProfile?.services?.length ? 'fill-emerald-100' : ''} /> Profile Info
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${providerProfile?.experience >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle size={14} className={providerProfile?.experience >= 0 ? 'fill-emerald-100' : ''} /> Experience
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${providerProfile?.pincodesServed?.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle size={14} className={providerProfile?.pincodesServed?.length ? 'fill-emerald-100' : ''} /> Pincode
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${progressPercent >= 80 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle size={14} className={progressPercent >= 80 ? 'fill-emerald-100' : ''} /> KYC Upload
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${progressPercent >= 80 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle size={14} className={progressPercent >= 80 ? 'fill-emerald-100' : ''} /> Bank Details
                </div>
              </div>
            </div>
            
            <div className="shrink-0 space-y-3 w-full sm:w-auto min-w-[200px]">
              {providerProfile?.onboardingStatus === 'INCOMPLETE' && (
                <Link to="/dashboard/provider/onboarding">
                  <Button className="w-full shadow-md bg-slate-900 text-white hover:bg-slate-800 border-0">Continue Onboarding</Button>
                </Link>
              )}
              {providerProfile?.onboardingStatus === 'KYC_PENDING' && (
                <div className="text-center bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-sm font-bold text-amber-700 mb-1">KYC Under Review</p>
                  <p className="text-xs text-amber-600">Our team is verifying your documents.</p>
                </div>
              )}
              {providerProfile?.onboardingStatus === 'VERIFIED' && (
                <Link to="/dashboard/provider/availability">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md">Turn Availability ON</Button>
                  <p className="text-xs text-center text-slate-500 mt-2">Required to become ACTIVE</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title leading-tight">Welcome, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
          <div className={`w-3 h-3 rounded-full ${providerProfile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-sm font-semibold text-slate-700">{providerProfile?.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="stat-card border-none bg-blue-50">
          <div className="p-3 bg-blue-500 text-white rounded-xl"><Calendar size={24} /></div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-0.5">Today's schedule</p>
            <h3 className="text-2xl font-bold text-slate-800">{todayBookings.length}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-amber-50">
          <div className="p-3 bg-amber-500 text-white rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-medium text-amber-600 mb-0.5">Pending requests</p>
            <h3 className="text-2xl font-bold text-slate-800">{pendingBookings.length}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-emerald-50">
          <div className="p-3 bg-emerald-500 text-white rounded-xl"><Wallet size={24} /></div>
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-0.5">Total earnings</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(providerProfile?.totalEarnings || 0)}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-purple-50">
          <div className="p-3 bg-purple-500 text-white rounded-xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-purple-600 mb-0.5">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800">{providerProfile?.completedBookings || 0}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-amber-50">
          <div className="p-3 bg-amber-500 text-white rounded-xl"><Star size={24} /></div>
          <div>
            <p className="text-sm font-medium text-amber-600 mb-0.5">Avg Rating</p>
            <div className="flex items-end gap-1.5">
              <h3 className="text-2xl font-bold text-slate-800">{providerProfile?.rating?.toFixed(1) || '—'}</h3>
              {providerProfile?.totalRatings > 0 && <span className="text-xs text-slate-400 mb-1">({providerProfile.totalRatings})</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests */}
        <div className="lg:col-span-1 border border-slate-100 bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Pending Requests</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingBookings.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No pending requests</div>
            ) : (
              pendingBookings.slice(0, 3).map(b => (
                <div key={b._id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-slate-800">{b.patient.name}</h4>
                    <span className="text-sm font-bold text-primary-600">{formatCurrency(b.totalAmount)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{formatDateTime(b.scheduledAt)}</p>
                  <Link to="/dashboard/provider/bookings" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                    View Details →
                  </Link>
                </div>
              ))
            )}
          </div>
          {pendingBookings.length > 3 && (
            <div className="p-3 text-center border-t border-slate-100">
              <Link to="/dashboard/provider/bookings" className="text-xs font-semibold text-slate-500 hover:text-primary-600">
                View all requests
              </Link>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2 border border-slate-100 bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Today's Appointments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {todayBookings.length === 0 ? (
              <EmptyState title="No appointments today" description="Take a well-deserved rest." />
            ) : (
              todayBookings.map(b => (
                <div key={b._id} className="p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${SERVICE_CONFIG[b.service].color}`}>
                      {SERVICE_CONFIG[b.service].icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{b.patient.name}</h4>
                      <p className="text-sm text-slate-500 font-medium">{formatDateTime(b.scheduledAt)} • {b.durationHours} hr</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{b.address}, {b.pincode}</p>
                    </div>
                  </div>
                  <Badge status={b.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reviews panel */}
      {providerProfile?._id && (
        <ProviderReviews providerId={providerProfile._id} />
      )}
    </div>
  );
}
