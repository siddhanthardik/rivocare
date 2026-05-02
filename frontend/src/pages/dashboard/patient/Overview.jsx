import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Activity, ShieldCheck, 
  Star, ChevronRight, MoreHorizontal,
  MapPin, CheckCircle2, Plus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services';
import { formatDate, formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { safe } from '../../../utils/safeGet';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import { PageWrapper, Card, Row, Section, KPIChip, StatusPill } from '../../../components/ui/Layout';

export default function PatientOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getAll({ limit: 10 })
      .then((res) => {
        setData({
          bookings: res.data.bookings,
          total: res.data.total
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const upcomingBookings = data?.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed') || [];

  return (
    <PageWrapper>
      {/* ── KPI Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPIChip 
          icon={Activity} 
          label="Consultations" 
          value={data?.total || 0} 
          color="text-blue-600"
          bg="bg-blue-50/30"
        />
        <KPIChip 
          icon={Calendar} 
          label="Upcoming" 
          value={upcomingBookings.length} 
          color="text-purple-600"
          bg="bg-purple-50/30"
        />
        <KPIChip 
          icon={ShieldCheck} 
          label="Member Since" 
          value={user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'} 
          color="text-emerald-600"
          bg="bg-emerald-50/30"
        />
        <KPIChip 
          icon={Star} 
          label="Tier Status" 
          value="Gold" 
          color="text-amber-600"
          bg="bg-amber-50/30"
        />
      </div>

      {/* ── Upcoming Appointments ──────────────────────── */}
      <div className="space-y-2">
        <Section 
          title="Upcoming Appointments" 
          subtitle="Your scheduled sessions"
          action={
            <Link to="/dashboard/patient/bookings">
              <span className="typo-label !text-blue-600 font-black flex items-center gap-1 cursor-pointer">
                View All <ChevronRight size={14} />
              </span>
            </Link>
          }
        />

        <Card noPadding className="divide-y divide-gray-50 overflow-hidden">
          {upcomingBookings.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                <Calendar size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="typo-value !text-gray-900">No upcoming bookings</h3>
                <p className="typo-micro max-w-xs mx-auto">You don't have any scheduled appointments.</p>
              </div>
              <Link to="/dashboard/patient/book">
                <button className="btn-primary-sm !px-6 !py-2.5">
                  Book a Service
                </button>
              </Link>
            </div>
          ) : (
            upcomingBookings.map((b) => (
              <BookingRow key={b._id} booking={b} />
            ))
          )}
        </Card>
      </div>

      {/* ── Health Tip CTA ────────────────────────────── */}
      <Card className="relative bg-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden border-transparent shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 scale-150 pointer-events-none">
          <ShieldCheck size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="typo-micro font-black text-blue-400 uppercase tracking-widest">Health Tip</span>
            <h3 className="typo-title !text-white !text-[20px]">Stay consistent with care.</h3>
            <p className="typo-body !text-slate-400 max-w-md">Regular sessions help in faster recovery and better health outcomes.</p>
          </div>
          <Link to="/dashboard/patient/book" className="shrink-0">
            <button className="bg-white text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-xl typo-label !font-black transition-all shadow-lg active:scale-95">
              Book Next Session
            </button>
          </Link>
        </div>
      </Card>

      {/* ── Mobile FAB ────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Link to="/dashboard/patient/book">
          <button className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
            <Plus size={28} />
          </button>
        </Link>
      </div>
    </PageWrapper>
  );
}

function BookingRow({ booking: b }) {
  if (!b) return null;
  const serviceSlug = typeof b.service === 'string' ? b.service : b.service?.slug;
  const service = SERVICE_CONFIG[serviceSlug] || b.service || { label: "Service", icon: "🩺" };
  
  return (
    <Row className="flex-col md:flex-row gap-4 md:items-center p-3">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative shrink-0">
          <img 
            src={b.provider?.user?.profileImage || `https://ui-avatars.com/api/?name=${b.provider?.user?.name || 'Expert'}&background=6366f1&color=fff`} 
            alt={safe(b.provider?.user?.name, "Expert")} 
            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle2 size={8} className="text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="typo-value !text-gray-900 truncate leading-tight">{safe(service?.label, "Service")}</h4>
            <StatusPill status={b.status} className="scale-90" />
          </div>
          <p className="typo-micro font-bold text-slate-400 uppercase tracking-tighter">{safe(b.provider?.user?.name, "Expert")}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 md:px-6 py-2 md:py-0 border-y md:border-y-0 md:border-x border-gray-50">
        <div className="space-y-0.5">
          <p className="typo-micro font-black text-slate-300 uppercase">Schedule</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 typo-micro font-bold text-gray-700">
              <Calendar size={12} className="text-blue-500" /> {formatDate(b.scheduledAt)}
            </div>
            <div className="flex items-center gap-1.5 typo-micro font-bold text-gray-700">
              <Clock size={12} className="text-blue-500" /> {b.scheduledAt ? formatDateTime(b.scheduledAt).split('at')[1] : '--:--'}
            </div>
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="typo-micro font-black text-slate-300 uppercase">Location</p>
          <div className="flex items-center gap-1.5 typo-micro font-bold text-gray-700">
            <MapPin size={12} className="text-blue-500" /> {safe(b.addressType, "At Home")}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
        <button className="btn-secondary-sm !px-4">Reschedule</button>
        <button className="btn-icon">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </Row>
  );
}
