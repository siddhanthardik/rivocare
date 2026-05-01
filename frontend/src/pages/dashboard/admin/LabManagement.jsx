import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, 
  MapPin, Phone, Mail, ExternalLink, 
  Filter, ShieldCheck, AlertCircle, Building
} from 'lucide-react';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';

export default function LabManagement() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data } = await labService.getPartners();
      setPartners(data || []);
    } catch (err) {
      toast.error('Failed to load lab partners');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await labService.updatePartnerStatus(id, { status: newStatus });
      toast.success(`Partner status updated to ${newStatus}`);
      fetchPartners();
    } catch (err) {
      toast.error('Failed to update partner status');
    }
  };

  const filteredPartners = partners.filter(p => {
    const matchesTab = filter === 'all' || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-1">
            <Building size={16} /> Partner Ecosystem
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Lab Partners</h1>
          <p className="text-slate-500 font-medium">Approve, verify, and manage Rivo Labs diagnostic partners.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search labs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium min-w-[300px]"
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active/Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* ── PARTNERS GRID ── */}
      {filteredPartners.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
            <Building size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3">No partners found</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            There are no lab partners matching your current filters or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner._id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all group flex flex-col">
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <Building size={32} />
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  partner.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : partner.status === 'pending'
                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {partner.status}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{partner.name}</h3>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Mail size={14} className="text-slate-400" /> {partner.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                    <Phone size={14} className="text-slate-400" /> {partner.phone || 'No phone'}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded">
                    ID: {partner._id.slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
                {partner.status !== 'active' && (
                  <Button 
                    onClick={() => handleStatusUpdate(partner._id, 'active')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Verify
                  </Button>
                )}
                {partner.status === 'active' && (
                  <Button 
                    variant="secondary"
                    className="bg-slate-50 border-transparent hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    disabled
                  >
                    <ShieldCheck size={16} /> Verified
                  </Button>
                )}
                <Button 
                  onClick={() => handleStatusUpdate(partner._id, partner.status === 'rejected' ? 'pending' : 'rejected')}
                  className={`${partner.status === 'rejected' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-red-50 hover:bg-red-100 text-red-600'} font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}
                >
                  {partner.status === 'rejected' ? 'Restore' : <><XCircle size={16} /> Reject</>}
                </Button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── STATS SECTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { label: 'Total Partners', value: partners.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Verification', value: partners.filter(p => p.status === 'pending').length, icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
          { label: 'Verified Labs', value: partners.filter(p => p.status === 'active').length, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-3xl font-black text-slate-900">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
