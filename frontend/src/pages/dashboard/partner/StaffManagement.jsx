import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  UserPlus, Search, Edit3, Trash2, XCircle,
  Users, Activity, ToggleLeft, ToggleRight
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
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="typo-title !text-[18px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XCircle size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inp = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl typo-body font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all';

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
    <Modal title={initial ? 'Edit Staff' : 'Add Staff'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1">
          <label className="typo-label !text-gray-400">Full Name *</label>
          <input required className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rahul Kumar" />
        </div>
        <div className="space-y-1">
          <label className="typo-label !text-gray-400">Phone Number *</label>
          <input required className={inp} type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
        </div>
        <div className="space-y-1">
          <label className="typo-label !text-gray-400">Role</label>
          <select className={inp} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <label className="typo-label !text-gray-400 flex-1">Active</label>
          <button type="button" onClick={() => set('isActive', !form.isActive)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border typo-label !text-[10px] !font-bold transition-all',
              form.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
            {form.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {form.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 typo-label !text-gray-500 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white typo-label !text-white !font-bold disabled:opacity-50 shadow-lg shadow-slate-200">
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Memoized staff row ──────────────────────────────── */
const StaffRow = memo(function StaffRow({ member, onEdit, onToggle, onDelete }) {
  return (
    <div className="partner-table-row grid grid-cols-[32px_1fr_120px_100px_70px_90px] items-center gap-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">
        {member.name?.charAt(0)?.toUpperCase()}
      </div>
      {/* Name + phone */}
      <div className="min-w-0">
        <p className="typo-body !text-gray-900 font-bold truncate leading-tight">{member.name}</p>
        <p className="typo-micro mt-0.5">{member.phone}</p>
      </div>
      {/* Role */}
      <p className="typo-body truncate">{ROLE_LABELS[member.role] || member.role}</p>
      {/* Status */}
      <div className="flex justify-center">
        <span className={cn('typo-label !text-[9px] px-2 py-0.5 rounded border leading-none', 
          member.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
          {member.isActive ? 'Active' : 'Offline'}
        </span>
      </div>
      {/* Toggle */}
      <button onClick={() => onToggle(member._id, !member.isActive)} className={cn('p-1.5 transition-colors', member.isActive ? 'text-indigo-600' : 'text-slate-300')}>
         {member.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      </button>
      {/* Actions */}
      <div className="flex justify-end gap-1">
        <button onClick={() => onEdit(member)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><Edit3 size={14} /></button>
        <button onClick={() => onDelete(member._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
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
        // Edit logic
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
    toast.success('Staff member removed');
    fetchStaff();
  };

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Total Roster', value: staff.length, icon: Users, color: 'text-gray-500', bg: 'bg-gray-50' },
    { label: 'Active on Field',value: activeCount,   icon: Activity, color: 'text-green-600',bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fade-in pb-10">
      
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="typo-label !text-gray-400">Team</span>
          </div>
          <h1 className="typo-title">Staff Management</h1>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
           <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* ── Summary ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.bg, s.color)}>
              <s.icon size={18} />
            </div>
            <div className="min-w-0">
               <p className="typo-label truncate">{s.label}</p>
               <p className="typo-kpi leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Controls ──────────────────────────────────── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl typo-body focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Staff Grid ─────────────────────────────────────────── */}
      <div className="partner-card">
         <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-[32px_1fr_120px_100px_70px_90px] items-center gap-4">
            <div />
            <p className="typo-label">Name / Contact</p>
            <p className="typo-label">Designation</p>
            <p className="typo-label text-center">Status</p>
            <p className="typo-label">Toggle</p>
            <p className="typo-label text-right pr-2">Action</p>
         </div>

         <div className="divide-y divide-gray-50">
            {visible.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <Users size={32} className="text-slate-200" />
                  </div>
                  <p className="typo-body !text-gray-900 font-bold">No staff members found</p>
                  <p className="typo-micro mt-1">Start by onboarding your field phlebotomists</p>
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

         <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100">
            <p className="typo-micro">Total {visible.length} staff members listed</p>
         </div>
      </div>

      {modal && (
        <StaffFormModal initial={editing} onSave={handleSave} onClose={() => { setModal(false); setEditing(null); }} />
      )}
    </div>
  );
}
