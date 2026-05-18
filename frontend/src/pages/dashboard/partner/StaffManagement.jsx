import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  UserPlus, Search, Edit3, Trash2, XCircle,
  Users, Activity, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';

/* ─── Constants ───────────────────────────────────────── */
const ROLES = ['phlebotomist', 'technician', 'manager'];
const ROLE_LABELS = { phlebotomist: 'Phlebotomist', technician: 'Lab Technician', manager: 'Operations Manager' };
const EMPTY = { name: '', phone: '', role: 'phlebotomist', isActive: true };

/* ─── Shared modal shell ──────────────────────────────── */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border border-white/20">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

const inp = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-300';

/* ─── Staff form modal ────────────────────────────────── */
function StaffFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    if (!form.phone.trim()) return toast.error('Phone required');
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={initial ? 'Edit Staff Member' : 'Onboard New Staff'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
          <input required className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Kumar" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
          <input required className={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Role</label>
          <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p className="text-xs font-black text-slate-900 tracking-tight">Active Status</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Allow assignments</p>
          </div>
          <button 
            type="button" 
            onClick={() => set('isActive', !form.isActive)}
            className={cn(
              'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border',
              form.isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
            )}
          >
            {form.isActive ? 'Active' : 'Offline'}
          </button>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : (initial ? 'Save' : 'Onboard')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Memoized staff row ──────────────────────────────── */
const StaffRow = memo(function StaffRow({ member, onEdit, onToggle, onDelete }) {
  return (
    <div className="grid grid-cols-12 items-center gap-6 py-5 px-8 hover:bg-slate-50/50 transition-all group">
      {/* Avatar + Info */}
      <div className="col-span-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-lg border border-indigo-100/50 group-hover:scale-105 transition-transform shadow-sm">
          {member.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 mb-0.5 truncate tracking-tight group-hover:text-indigo-600 transition-colors">{member.name}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.phone}</p>
        </div>
      </div>

      {/* Role */}
      <div className="col-span-3">
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
          {ROLE_LABELS[member.role] || member.role}
        </span>
      </div>

      {/* Status Toggle */}
      <div className="col-span-2 flex justify-center">
        <button 
          onClick={() => onToggle(member._id, !member.isActive)} 
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border shadow-sm',
            member.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'
          )}
        >
          <div className={cn('w-1.5 h-1.5 rounded-full', member.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
          {member.isActive ? 'Active' : 'Offline'}
        </button>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end gap-2">
        <button onClick={() => onEdit(member)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center border border-transparent hover:border-indigo-100">
          <Edit3 size={16} />
        </button>
        <button onClick={() => onDelete(member._id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center border border-transparent hover:border-red-100">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labService.getStaff();
      setStaff(res.data);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const visible = useMemo(() => {
    return staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search));
  }, [staff, search]);

  const activeCount = useMemo(() => staff.filter(s => s.isActive).length, [staff]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await labService.updateStaff(editing._id, data);
        toast.success('Staff details updated');
      } else {
        await labService.addStaff(data);
        toast.success('Staff added successfully');
      }
      setModal(false); setEditing(null);
      fetchStaff();
    } catch { toast.error('Operation failed'); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await labService.updateStaffStatus(id, { isActive });
      fetchStaff();
    } catch { toast.error('Status update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await labService.deleteStaff(id);
      toast.success('Staff member removed');
      fetchStaff();
    } catch { toast.error('Failed to remove staff'); }
  };

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Total Roster', value: staff.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active on Field',value: activeCount,   icon: Activity, color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-10 animate-fade-in">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Team Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Management</h1>
        </div>
        <button 
          onClick={() => setModal(true)} 
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
        >
           <UserPlus size={18} /> Add Member
        </button>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
              {s.icon && <s.icon size={20} />}
            </div>
            <div className="min-w-0">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{s.label}</p>
               <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── UTILITY BAR ── */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm mb-6 max-w-2xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* ── STAFF TABLE ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
         {/* Table Header */}
         <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 items-center gap-6">
            <div className="col-span-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member Profile</div>
            <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Role</div>
            <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</div>
            <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
         </div>

         <div className="divide-y divide-slate-50">
            {visible.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                     <Users size={40} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Roster is empty</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Start by onboarding your first team member</p>
               </div>
            ) : (
               visible.map(member => (
                 <StaffRow
                   key={member._id}
                   member={member}
                   onEdit={(m) => { setEditing(m); setModal(true); }}
                   onToggle={handleToggle}
                   onDelete={handleDelete}
                 />
               ))
            )}
         </div>

         <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total {visible.length} Team Members onboarded
            </p>
         </div>
      </div>

      {modal && (
        <StaffFormModal initial={editing} onSave={handleSave} onClose={() => { setModal(false); setEditing(null); }} />
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}

