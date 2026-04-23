import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services';
import { formatCurrency, formatDateTime } from '../../utils';
import { Wallet, Star, Calendar, CheckCircle, Clock } from 'lucide-react';
import Modal from '../ui/Modal';
import { PageLoader } from '../ui/Feedback';
import Badge from '../ui/Badge';

export default function ProviderDetailsModal({ providerId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && providerId) {
      setLoading(true);
      adminService.getProviderDetails(providerId)
        .then(res => {
          setData(res.data.data);
        })
        .catch(err => {
          toast.error('Failed to fetch provider details');
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, providerId]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading) return <div className="p-8 flex justify-center"><PageLoader /></div>;
    if (!data) return <div className="p-8 text-center text-slate-500">No data found</div>;

    const { provider, user, wallet, transactions, bookings } = data;

    if (activeTab === 'overview') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Earnings</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(provider.totalEarnings || 0)}</h3>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Available Wallet</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(wallet?.balance || 0)}</h3>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">Avg Rating</p>
              <h3 className="text-2xl font-black text-slate-800">{provider.rating ? provider.rating.toFixed(1) : 'N/A'}</h3>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-xs font-bold text-purple-600 uppercase mb-1">Tasks Completed</p>
              <h3 className="text-2xl font-black text-slate-800">{provider.completedBookings || 0}</h3>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">Professional Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Experience:</span>
                <p className="font-semibold text-slate-800">{provider.experience} Years</p>
              </div>
              <div>
                <span className="text-slate-500">Hourly Rate:</span>
                <p className="font-semibold text-slate-800">{formatCurrency(provider.pricePerHour)}/hr</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Services Offered:</span>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map(s => (
                    <span key={s} className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold capitalize text-slate-700 border border-slate-200">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">Personal Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Full Name:</span>
                <p className="font-semibold text-slate-800">{user.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-semibold text-slate-800">{user.phone}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-semibold text-slate-800">{user.email}</p>
              </div>
              <div>
                <span className="text-slate-500">Gender:</span>
                <p className="font-semibold text-slate-800 capitalize">{user.gender || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'wallet') {
      return (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-slate-600">Current Available Balance</p>
              <h2 className="text-2xl font-black text-slate-900">{formatCurrency(wallet?.balance || 0)}</h2>
            </div>
            <Wallet className="text-slate-400" size={32} />
          </div>

          <h4 className="font-bold text-sm text-slate-800 border-b pb-1">Transaction History</h4>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500 italic p-4 text-center">No wallet transactions found.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
              {transactions.map(t => (
                <div key={t._id} className="p-3 border border-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{t.description}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className={`text-sm font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-800 border-b pb-1">Booking History</h4>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500 italic p-4 text-center">No bookings found for this provider.</p>
          ) : (
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-3">
              {bookings.map(b => (
                <div key={b._id} className="p-4 border border-slate-100 rounded-xl hover:shadow-sm bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded capitalize">{b.service}</span>
                      <p className="text-sm font-bold text-slate-800 mt-1">Patient: {b.patient?.name}</p>
                    </div>
                    <Badge status={b.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                     <div className="text-xs">
                       <span className="text-slate-400 block mb-0.5">Date & Time</span>
                       <span className="font-semibold text-slate-700">{formatDateTime(b.scheduledAt)}</span>
                     </div>
                     <div className="text-xs">
                       <span className="text-slate-400 block mb-0.5">Duration & Price</span>
                       <span className="font-semibold text-slate-700">{b.durationHours} hrs @ {formatCurrency(b.totalAmount)}</span>
                     </div>
                  </div>
                  {b.completedAt && (
                    <div className="mt-3 bg-white p-2 rounded border border-emerald-100 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                      <CheckCircle size={14} /> Completed on {new Date(b.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Provider Profile" size="2xl">
      {data && (
        <div className="flex mb-6 border-b border-slate-200">
          <button 
            className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'wallet' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('wallet')}
          >
            Wallet Ledger
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('history')}
          >
            Work History
          </button>
        </div>
      )}
      
      {renderContent()}
    </Modal>
  );
}
