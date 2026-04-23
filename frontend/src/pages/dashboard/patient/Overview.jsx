import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Clock, Activity } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { bookingService } from '../../../services';
import { formatDate, formatDateTime, formatCurrency, SERVICE_CONFIG } from '../../../utils';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title leading-tight">Welcome, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500">How are you feeling today?</p>
        </div>
        <Link to="/dashboard/patient/book" className="btn-primary">
          <Plus size={18} /> Book a Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card border-none bg-blue-50">
          <div className="p-3 bg-blue-500 text-white rounded-xl"><Activity size={24} /></div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-0.5">Total Consultations</p>
            <h3 className="text-2xl font-bold text-slate-800">{data?.total || 0}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-purple-50">
          <div className="p-3 bg-purple-500 text-white rounded-xl"><Calendar size={24} /></div>
          <div>
            <p className="text-sm font-medium text-purple-600 mb-0.5">Upcoming Bookings</p>
            <h3 className="text-2xl font-bold text-slate-800">{upcomingBookings.length}</h3>
          </div>
        </div>
        <div className="stat-card border-none bg-emerald-50">
          <div className="p-3 bg-emerald-500 text-white rounded-xl"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-0.5">Active Since</p>
            <h3 className="text-2xl font-bold text-slate-800">{new Date(user.createdAt).getFullYear()}</h3>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h2 className="section-title">Upcoming Appointments</h2>
      {upcomingBookings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Calendar}
            title="No upcoming appointments"
            description="You don't have any pending or confirmed bookings."
            action={<Link to="/dashboard/patient/book" className="btn-outline">Book Now</Link>}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {upcomingBookings.map(b => (
              <div key={b._id} className="p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${SERVICE_CONFIG[b.service].color}`}>
                    {SERVICE_CONFIG[b.service].icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {SERVICE_CONFIG[b.service].label} with {b.provider.user.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">{formatDateTime(b.scheduledAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <Badge status={b.status} />
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(b.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
