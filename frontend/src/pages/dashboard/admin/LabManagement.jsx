import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, 
  MapPin, Phone, Mail, ExternalLink, 
  Filter, ShieldCheck, AlertCircle, Building, Settings
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { labService } from '@/services';
import Button from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Feedback';
import { toast } from 'react-hot-toast';
import { LAB_DEPARTMENTS } from '@/constants/departments';

export default function LabManagement() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [settingsTarget, setSettingsTarget] = useState(null);

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
                {partner.status === 'active' && (
                  <Button 
                    onClick={() => setSettingsTarget(partner)}
                    className="col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Settings size={16} /> Department Commissions
                  </Button>
                )}
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

      <Modal
        isOpen={!!settingsTarget}
        onClose={() => setSettingsTarget(null)}
        title="Department Commissions"
        size="lg"
      >
        {settingsTarget && (
          <DepartmentCommissionsForm 
            partner={settingsTarget} 
            onClose={() => { setSettingsTarget(null); fetchPartners(); }} 
          />
        )}
      </Modal>

    </div>
  );
}

function DepartmentCommissionsForm({ partner, onClose }) {
  const existingComms = partner.profile?.commissions || partner.profile?.departmentCommissions || [];
  
  const [commissions, setCommissions] = useState(() => {
    return LAB_DEPARTMENTS.map(dept => {
      const existing = existingComms.find(c => c.department === dept.key);
      return {
        department: dept.key,
        label: dept.label,
        commissionType: existing?.commissionType || 'percentage',
        // Standardize: read 0.2 as 20 if it was stored that way, but new ones will be 0-100
        commissionValue: existing?.commissionValue !== undefined 
          ? (existing.commissionValue <= 1 && existing.commissionType === 'percentage' ? Math.round(existing.commissionValue * 100) : existing.commissionValue) 
          : 20
      };
    });
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const invalid = commissions.some(c => 
      c.commissionValue === undefined || 
      c.commissionValue === '' || 
      (c.commissionType === 'percentage' && (c.commissionValue < 0 || c.commissionValue > 100))
    );

    if (invalid) {
      toast.error('Please enter valid commission values (0-100 for percentage)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        commissions: commissions.map(c => ({
          department: c.department,
          label: c.label,
          commissionType: c.commissionType,
          commissionValue: c.commissionValue
        }))
      };

      const response = await labService.updateLabCommission(partner._id, payload);
      if (response.success) {
        toast.success(response.message || 'Configuration saved successfully');
        onClose();
      } else {
        toast.error(response.message || 'Failed to update commissions');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update commissions';
      console.error(`[COMMISSION_UPDATE_ERROR]`, err);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (index, field, value) => {
    const newComms = [...commissions];
    newComms[index][field] = value;
    setCommissions(newComms);
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">
          {partner.profile?.labName || partner.name || 'Partner'} - Commissions
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Set dynamic platform fees based on the test department. Applies to all tests unless overridden.
        </p>
      </div>

      {/* Grid Area */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {commissions.map((comm, i) => (
            <div key={comm.department} className="p-5 bg-[#EDF1F7] rounded-2xl border border-slate-200 space-y-4 min-w-0">
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block truncate">
                DEPARTMENT {comm.label}
              </label>
              
              <div className="flex items-center gap-2">
                {/* Type Selector Block */}
                <div className="relative bg-white border border-slate-300 rounded-xl px-2 py-2 w-16 h-10 flex items-center justify-between shadow-sm shrink-0">
                  <select 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    value={comm.commissionType}
                    onChange={(e) => handleChange(i, 'commissionType', e.target.value)}
                  >
                    <option value="percentage">%</option>
                    <option value="flat">₹</option>
                  </select>
                  <span className="text-sm font-bold text-slate-700">{comm.commissionType === 'percentage' ? '%' : '₹'}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                
                {/* Value Input Block */}
                <div className="flex-1 min-w-0">
                  <input 
                    type="number" 
                    step="1" 
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 h-10 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 shadow-sm text-center"
                    placeholder="0"
                    value={comm.commissionValue}
                    onChange={(e) => handleChange(i, 'commissionValue', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Area */}
      <div className="pt-8 flex justify-end gap-3">
        <button 
          onClick={onClose}
          className="px-8 py-3.5 bg-[#E9EDF5] hover:bg-[#DDE3EE] rounded-xl text-sm font-bold text-slate-700 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-10 py-3.5 bg-[#2D2B7B] hover:bg-[#1E1C55] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

const ChevronDown = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
