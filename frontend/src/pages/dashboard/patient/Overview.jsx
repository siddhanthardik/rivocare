import { useState, useEffect, cloneElement } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Plus, Clock, Activity, ShieldCheck, 
  TrendingUp, Star, Search, User, MessageSquare, 
  ChevronRight, MoreHorizontal, ArrowRight, UserCheck, 
  Microscope, FileText, Smartphone, Pill
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services';
import { formatDate, formatDateTime, formatCurrency, SERVICE_CONFIG, cn } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';

export default function PatientOverview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getAll({ limit: 5 })
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
    <div className="space-y-10 animate-fade-in">
      
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          icon={<Activity size={24} className="text-blue-600" />} 
          label="Total Consultations" 
          value={data?.total || 13} 
          subtext="All time"
          bg="bg-blue-50/50"
        />
        <StatCard 
          icon={<Calendar size={24} className="text-purple-600" />} 
          label="Upcoming Bookings" 
          value={upcomingBookings.length} 
          subtext="View all"
          bg="bg-purple-50/50"
          link="/dashboard/patient/bookings"
        />
        <StatCard 
          icon={<ShieldCheck size={24} className="text-emerald-600" />} 
          label="Active Since" 
          value={new Date(user.createdAt).getFullYear()} 
          subtext={`Member since ${new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          bg="bg-emerald-50/50"
        />
        <StatCard 
          icon={<Star size={24} className="text-orange-500 fill-orange-500/20" />} 
          label="Rivo Care Points" 
          value="Gold Member" 
          subtext="More benefits unlocked"
          bg="bg-orange-50/50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Appointments & Recommendations */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Upcoming Appointments Card */}
          <div className="bg-[#0c1427] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Calendar size={200} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-bold">Upcoming Appointments</h3>
              <Link to="/dashboard/patient/bookings" className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight size={16} />
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="py-10 text-center relative z-10">
                <p className="text-slate-400 mb-6">No upcoming appointments found.</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {upcomingBookings.slice(0, 2).map((b, i) => (
                  <div key={b._id} className={cn(
                    "bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 justify-between md:items-center hover:bg-white/10 transition-all",
                    i > 0 && "opacity-80 scale-[0.98]"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img 
                          src={b.provider.user.profileImage || `https://ui-avatars.com/api/?name=${b.provider.user.name}&background=random`} 
                          alt={b.provider.user.name} 
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#161d2f]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-0.5">{SERVICE_CONFIG[b.service].label}</h4>
                        <p className="text-sm text-slate-400 font-medium">{b.provider.user.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <Calendar size={12} className="text-blue-400" /> {formatDate(b.scheduledAt)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                            <Clock size={12} className="text-blue-400" /> {formatDateTime(b.scheduledAt).split('at')[1]}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <Activity size={14} className="text-emerald-400" /> At Home
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                          b.status === 'confirmed' ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
                        )}>
                          {b.status}
                        </span>
                      </div>
                      <button className="px-6 py-2 border border-white/20 rounded-xl text-sm font-bold hover:bg-white hover:text-slate-900 transition-all">
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Banner inside card */}
            <div className="mt-8 bg-gradient-to-r from-blue-600/20 to-transparent border border-white/10 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-base">Consistent care. Better health.</h4>
                  <p className="text-xs text-slate-400">Don't miss your next session.</p>
                </div>
              </div>
              <Link to="/dashboard/patient/book">
                <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                  Book Now
                </button>
              </Link>
            </div>
          </div>

          {/* Recommended Section */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl font-bold text-slate-900">Recommended for you</h3>
              <Link to="/services" className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RecommendationCard 
                image="/images/dashboard/physio.png"
                title="Back Pain Relief Physiotherapy"
                link="/services/physiotherapy"
              />
              <RecommendationCard 
                image="/images/dashboard/mobility.png"
                title="Strength & Mobility Program"
                link="/services/elder-care"
              />
              <RecommendationCard 
                image="/images/dashboard/rehab.png"
                title="Post Surgery Rehabilitation"
                link="/services/nursing-care"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Summary */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Quick Actions Grid */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={<Calendar />} label="Book a Service" link="/dashboard/patient/book" color="text-blue-600 bg-blue-50" />
              <QuickAction icon={<UserCheck />} label="Find Care Expert" link="/services" color="text-indigo-600 bg-indigo-50" />
              <QuickAction icon={<Microscope />} label="Lab Tests" link="/services" color="text-purple-600 bg-purple-50" />
              <QuickAction icon={<FileText />} label="Health Records" link="/dashboard/patient/health-records" color="text-emerald-600 bg-emerald-50" />
              <QuickAction icon={<Pill />} label="Prescriptions" link="/dashboard/patient/prescriptions" color="text-blue-600 bg-blue-50" />
              <QuickAction icon={<Smartphone />} label="Contact Support" link="/dashboard/patient/support" color="text-slate-600 bg-slate-100" />
            </div>
          </div>

          {/* Health Summary Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Health Summary</h3>
              <Link to="/dashboard/patient/health-records" className="text-blue-600 text-xs font-bold hover:underline">View details</Link>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sessions</p>
                <div className="flex items-end gap-1.5">
                  <h4 className="text-xl font-bold text-slate-900">11</h4>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center mb-1"><TrendingUp size={10} /> 10%</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Services</p>
                <div className="flex items-end gap-1.5">
                  <h4 className="text-xl font-bold text-slate-900">7</h4>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center mb-1"><TrendingUp size={10} /> 7%</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                <h4 className="text-xl font-bold text-slate-900">4.8/5</h4>
                <p className="text-[10px] font-bold text-emerald-500 mt-0.5">Excellent</p>
              </div>
            </div>
          </div>

          {/* Messages / Updates Feed */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Messages</h3>
              <Link to="/dashboard/patient/messages" className="text-blue-600 text-xs font-bold">View all</Link>
            </div>
            
            <div className="space-y-6">
              <MessageItem 
                icon={<ShieldCheck size={16} />} 
                title="Rivo Care Team" 
                text="Your appointment on 26 Apr is confirmed." 
                time="2h ago"
                dot
              />
              <MessageItem 
                img="https://i.pravatar.cc/100?img=12" 
                title="Siddhant Hardik" 
                text="Please share your availability for next week." 
                time="1d ago"
                dot
              />
              <MessageItem 
                icon={<TrendingUp size={16} />} 
                title="Rivo Care Updates" 
                text="New wellness programs just for you!" 
                time="3d ago"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
      `}} />
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, subtext, bg, link }) {
  const Content = (
    <div className={cn(
      "p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 group",
      bg
    )}>
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 mb-4">{value}</h3>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400">{subtext}</p>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );

  return link ? <Link to={link}>{Content}</Link> : Content;
}

function RecommendationCard({ image, title, link }) {
  return (
    <Link to={link} className="group flex flex-col bg-slate-50/50 rounded-[2.5rem] p-4 border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
      <div className="rounded-[2rem] overflow-hidden mb-5 aspect-[4/3] bg-white">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="px-2 pb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-800 leading-tight flex-1">{title}</h4>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ icon, label, link, color }) {
  return (
    <Link to={link} className="flex flex-col items-center gap-3 p-4 rounded-3xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", color)}>
        {cloneElement(icon, { size: 24 })}
      </div>
      <p className="text-[11px] font-bold text-slate-800 text-center">{label}</p>
    </Link>
  );
}

function MessageItem({ icon, img, title, text, time, dot }) {
  return (
    <div className="flex gap-4 group cursor-pointer">
      <div className="shrink-0 relative">
        {img ? (
          <img src={img} alt={title} className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            {icon}
          </div>
        )}
        {dot && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />}
      </div>
      <div className="flex-1 min-w-0 border-b border-slate-50 pb-4 group-last:border-0 group-last:pb-0">
        <div className="flex items-center justify-between mb-0.5">
          <h4 className="text-xs font-bold text-slate-900 truncate">{title}</h4>
          <span className="text-[10px] font-medium text-slate-400">{time}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{text}</p>
      </div>
    </div>
  );
}

// Utility imports for helper components
// Already imported at top
