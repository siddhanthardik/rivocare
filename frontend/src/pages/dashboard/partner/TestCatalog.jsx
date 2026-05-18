import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Search, Plus, Upload, Download, Edit3, Trash2,
  XCircle, CheckCircle2, AlertCircle, FileSpreadsheet,
  ToggleLeft, ToggleRight, FlaskConical, RefreshCw
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatCurrency } from '../../../utils/format';
import { useDepartments } from '../../../hooks/useDepartments';

/* ─── Constants ───────────────────────────────────────── */
const SAMPLE_TYPES= ['Blood','Urine','Saliva','Stool','Swab','X-Ray','NA','Other'];

const EMPTY_FORM = {
  testName:'', shortCode:'', department: '', // initialized in useEffect
  sampleType:'Blood', price:'', mrp:'', reportTat:'24 hrs',
  fastingRequired:false, homeCollectionAvailable:true,
  description:'', preparationInstructions:'', isActive:true,
};

const CSV_HEADERS = 'testName,shortCode,department,sampleType,price,mrp,reportTat,fastingRequired,homeCollectionAvailable,description,preparationInstructions,isActive';
const CSV_SAMPLE  = 'Complete Blood Count,CBC,pathology,Blood,399,699,24 hrs,Yes,Yes,General blood screening,Fasting for 8 hours recommended,TRUE\nThyroid Profile,T3T4TSH,pathology,Blood,499,899,24 hrs,No,Yes,Thyroid function test,No special preparation,TRUE';

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
}

/* ─── Shared modal shell ──────────────────────────────── */
function ModalShell({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className={cn('bg-white rounded-[2.5rem] w-full shadow-2xl overflow-hidden animate-slide-up border border-white/20', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-all flex items-center justify-center">
            <XCircle size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[85vh] custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

/* ─── Field helpers ───────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}
const inp = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-300';

/* ─── Toggle switch ───────────────────────────────────── */
function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm',
        value ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50')}
    >
      {value ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
      {label}
    </button>
  );
}

/* ─── Add / Edit form modal ───────────────────────────── */
function TestFormModal({ initial, departments, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { ...EMPTY_FORM, department: departments[0]?.key || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.testName.trim()) return toast.error('Test name required');
    if (!form.price || isNaN(Number(form.price))) return toast.error('Valid price required');
    setSaving(true);
    try { await onSave({ ...form, price: Number(form.price), mrp: Number(form.mrp) }); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={initial ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Test Full Name *">
            <input className={inp} value={form.testName} onChange={e => set('testName', e.target.value)} placeholder="e.g. Complete Blood Count" required />
          </Field>
          <Field label="System Short Code">
            <input className={inp} value={form.shortCode} onChange={e => set('shortCode', e.target.value)} placeholder="e.g. CBC" />
          </Field>
          <Field label="Department Category">
            <select className={inp} value={form.department} onChange={e => set('department', e.target.value)}>
              {departments.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </Field>
          <Field label="Sample Specimen">
            <select className={inp} value={form.sampleType} onChange={e => set('sampleType', e.target.value)}>
              {SAMPLE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Reporting TAT">
            <input className={inp} value={form.reportTat} onChange={e => set('reportTat', e.target.value)} placeholder="e.g. 24 hrs" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Offer Price *">
              <input className={inp} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="₹" required />
            </Field>
            <Field label="Standard MRP">
              <input className={inp} type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="₹" />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center py-2">
           <Toggle value={form.fastingRequired} onChange={v => set('fastingRequired', v)} label="Fasting" />
           <Toggle value={form.homeCollectionAvailable} onChange={v => set('homeCollectionAvailable', v)} label="Home Pickup" />
           <Toggle value={form.isActive} onChange={v => set('isActive', v)} label="Active" />
        </div>

        <Field label="Test Description & Summary">
          <textarea className={cn(inp, 'h-24 py-3 resize-none')} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Provide clinical details about this test..." />
        </Field>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="px-10 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Processing...' : (initial ? 'Update Test' : 'Deploy Test')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ─── Bulk Import Modal ───────────────────────────────── */
function BulkImportModal({ onSave, onClose, departments }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const rows = lines.slice(1).map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          testName: parts[0], shortCode: parts[1], department: parts[2],
          sampleType: parts[3], price: Number(parts[4]),
          mrp: Number(parts[5]), reportTat: parts[6], fastingRequired: parseBool(parts[7]),
          homeCollectionAvailable: parseBool(parts[8]), description: parts[9],
          preparationInstructions: parts[10], isActive: parseBool(parts[11] || 'true'),
        };
      });
      setData(rows);
      setFile(f);
    };
    reader.readAsText(f);
  };

  const downloadTemplate = () => {
    const sampleDept = departments[0]?.key || 'pathology';
    const sampleCSV = `${CSV_HEADERS}\nComplete Blood Count,CBC,${sampleDept},Blood,399,699,24 hrs,Yes,Yes,General blood screening,Fasting for 8 hours recommended,TRUE`;
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rivo_test_template.csv'; a.click();
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success(`Copied: ${key}`);
  };

  return (
    <ModalShell title="Bulk Catalog Import" onClose={onClose} wide={data.length > 0}>
      {!file ? (
        <div className="space-y-8">
          <div 
            onClick={() => fileRef.current.click()}
            className="w-full border-2 border-dashed border-slate-100 rounded-[2rem] py-16 flex flex-col items-center cursor-pointer hover:bg-slate-50/50 transition-all bg-slate-50/30 group"
          >
            <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload size={32} className="text-indigo-600" />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Select CSV Catalog</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Supports .csv files up to 5MB</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100/50">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Department Reference
              </h5>
              <button onClick={downloadTemplate} className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 hover:underline">
                <Download size={12} /> Get Template
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">
              CSV files don't support dropdowns. Please use the exact <strong>Key</strong> below for the department column:
            </p>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <button 
                  key={d.key} 
                  onClick={() => copyKey(d.key)}
                  className="px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  title="Click to copy key"
                >
                  {d.label} <span className="opacity-40 ml-1">({d.key})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100/50 shadow-sm shadow-emerald-100/20">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                 <FileSpreadsheet size={24} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900 tracking-tight">{file.name}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{data.length} Valid tests detected</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline">Change File</button>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto border border-slate-50 rounded-[1.5rem] divide-y divide-slate-50 custom-scrollbar">
             {data.map((row, i) => (
               <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 mb-0.5 truncate tracking-tight">{row.testName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      {departments.find(d => d.key === row.department)?.label || row.department} • {formatCurrency(row.price)}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
               </div>
             ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <button onClick={() => onSave(data)} className="px-10 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 flex items-center gap-2">
               <Plus size={14} />
               Deploy {data.length} Tests to Catalog
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}


/* ─── Main Catalog Page ───────────────────────────────── */
export default function TestCatalog() {
  const [tests, setTests] = useState([]);
  const { departments } = useDepartments();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'import'
  const [editing, setEditing] = useState(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labService.getTests();
      setTests(res.data);
    } catch { toast.error('Failed to load catalog'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const visible = useMemo(() => {
    return tests.filter(t => {
      const name = (t.testName || t.name || '').toLowerCase();
      const code = (t.shortCode || '').toLowerCase();
      const dept = (t.department || '').toLowerCase();
      const term = search.toLowerCase();
      return name.includes(term) || code.includes(term) || dept.includes(term);
    });
  }, [tests, search]);

  const handleSave = async (data) => {
    try {
      if (modal === 'import') {
        await labService.bulkUploadTests(data);
        toast.success(`Successfully imported ${data.length} tests`);
      } else if (editing) {
        await labService.updateTest(editing._id, data);
        toast.success('Test updated successfully');
      } else {
        await labService.addTest(data);
        toast.success('Test added successfully');
      }
      setModal(null); setEditing(null);
      fetchTests();
    } catch { toast.error('Operation failed'); }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this test from catalog?')) return;
    try {
      await labService.deleteTest(id);
      toast.success('Test removed');
      fetchTests();
    } catch { toast.error('Failed to remove test'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#FBFBFE] pb-10 animate-fade-in">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Inventory Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Test Catalog</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setModal('import')} 
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
             <Upload size={16} /> Bulk Import
          </button>
          <button 
            onClick={() => setModal('add')} 
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2"
          >
             <Plus size={18} /> New Test
          </button>
        </div>
      </div>

      {/* ── UTILITY BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            placeholder="Search tests, categories, or short codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 px-1">
           <button className="w-10 h-10 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center">
             <Download size={16} />
           </button>
        </div>
      </div>

      {/* ── CATALOG TABLE ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
         {/* Table Header */}
         <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 items-center gap-6">
            <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Profile</div>
            <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</div>
            <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sample</div>
            <div className="col-span-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Pricing</div>
            <div className="col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
         </div>

         <div className="divide-y divide-slate-50">
            {visible.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                     <FlaskConical size={40} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Catalog is empty</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Deploy tests to start receiving bookings</p>
               </div>
            ) : (
               visible.map(test => (
                 <div key={test._id} className="grid grid-cols-12 items-center gap-6 py-5 px-8 hover:bg-slate-50/50 transition-all group">
                    <div className="col-span-4 min-w-0">
                       <p className="text-sm font-black text-slate-900 mb-0.5 truncate tracking-tight group-hover:text-indigo-600 transition-colors">{test.testName}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.shortCode || 'NO CODE'}</p>
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                       <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                         {departments.find(d => d.key === test.department)?.label || test.department}
                       </span>
                    </div>

                    <div className="col-span-2 text-center">
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{test.sampleType}</p>
                    </div>

                    <div className="col-span-2 text-center">
                       <p className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">{formatCurrency(test.price)}</p>
                       <span className={cn('px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border', 
                         test.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200')}>
                         {test.isActive ? 'Active' : 'Offline'}
                       </span>
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                       <button onClick={() => { setEditing(test); setModal('edit'); }} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center border border-transparent hover:border-indigo-100">
                         <Edit3 size={16} />
                       </button>
                       <button onClick={() => handleDelete(test._id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center border border-transparent hover:border-red-100">
                         <Trash2 size={16} />
                       </button>
                    </div>
                 </div>
               ))
            )}
         </div>
         
         <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total {visible.length} Tests deployed in Catalog
            </p>
         </div>
      </div>


      {/* ── MODALS ── */}
      {(modal === 'add' || modal === 'edit') && (
        <TestFormModal initial={editing} departments={departments} onSave={handleSave} onClose={() => { setModal(null); setEditing(null); }} />
      )}
      {modal === 'import' && (
        <BulkImportModal onSave={handleSave} departments={departments} onClose={() => setModal(null)} />
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
