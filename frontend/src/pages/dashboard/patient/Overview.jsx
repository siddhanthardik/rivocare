import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, Activity, ShieldCheck, 
  Star, User, ChevronRight, MoreHorizontal,
  MapPin, CheckCircle2, TrendingUp, Plus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services';
import { formatDate, formatDateTime, SERVICE_CONFIG, cn } from '../../../utils';
import { PageLoader } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

export default function PatientOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getAll({ limit: 10 })
      .then((res) => {
        setData({
          bookings: res.data.data.bookings,
          total: res.data.data.total
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const upcomingBookings = data?.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* Sleek Micro Stat Chips */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        <StatChip 
          icon={<Activity size={16} className="text-blue-500" />} 
          label="Consultations" 
          value={data?.total || 13} 
          className="bg-blue-50/50 border-blue-100/50"
        />
        <StatChip 
          icon={<Calendar size={16} className="text-purple-500" />} 
          label="Upcoming" 
          value={upcomingBookings.length} 
          className="bg-purple-50/50 border-purple-100/50"
        />
        <StatChip 
          icon={<ShieldCheck size={16} className="text-emerald-500" />} 
          label="Since" 
          value={new Date(user.createdAt).getFullYear()} 
          className="bg-emerald-50/50 border-emerald-100/50"
        />
        <StatChip 
          icon={<Star size={16} className="text-amber-500 fill-amber-500/20" />} 
          label="Member" 
          value="Gold" 
          className="bg-amber-50/50 border-amber-100/50"
        />
      </div>

      {/* Main Content: Upcoming Appointments Focus */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upcoming Appointments</h2>
          <Link to="/dashboard/patient/bookings">
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:bg-blue-50 rounded-full px-4">
              View All <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No upcoming bookings</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">You don't have any scheduled appointments. Book a service to get started.</p>
            <Link to="/dashboard/patient/book">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-3 shadow-xl shadow-blue-500/20 font-bold">
                Book a Service
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((b) => (
              <BookingRow key={b._id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Stay Consistent CTA Banner */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 text-white overflow-hidden shadow-2xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 pointer-events-none">
          <ShieldCheck size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-3">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              Health Tip
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight">Stay consistent with care.</h3>
            <p className="text-blue-100 text-lg max-w-md font-medium">Regular sessions help in faster recovery and better health outcomes.</p>
          </div>
          <Link to="/dashboard/patient/book" className="shrink-0">
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">
              Book Next Session
            </button>
          </Link>
        </div>
      </div>

      {/* Sticky Mobile Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Link to="/dashboard/patient/book">
          <Button className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 p-0 flex items-center justify-center">
            <Plus size={28} />
          </Button>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function StatChip({ icon, label, value, className }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-6 py-3 rounded-full border border-slate-100 bg-white transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default shrink-0",
      className
    )}>
      <div className="shrink-0">{icon}</div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function BookingRow({ booking: b }) {
  const service = SERVICE_CONFIG[b.service];
  
  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group">
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        {/* Left: Provider Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <img 
              src={b.provider.user.profileImage || `https://ui-avatars.com/api/?name=${b.provider.user.name}&background=6366f1&color=fff`} 
              alt={b.provider.user.name} 
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-slate-900 truncate">{service.label}</h4>
              <Badge status={b.status} className="scale-75 origin-left" />
            </div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{b.provider.user.name}</p>
            <span className="inline-flex px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md uppercase tracking-widest border border-blue-100/50">
              Expert Provider
            </span>
          </div>
        </div>

        {/* Center: Appointment Details */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-10 lg:gap-16 md:px-6 py-4 md:py-0 border-y md:border-y-0 md:border-x border-slate-50">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Calendar size={14} className="text-blue-500" /> {formatDate(b.scheduledAt)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock size={14} className="text-blue-500" /> {formatDateTime(b.scheduledAt).split('at')[1]}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <MapPin size={14} className="text-blue-500" /> {b.pincode} • At Home
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
          <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all active:scale-95">
            Reschedule
          </button>
          <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
