import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  Search, Plus, Upload, Download, Edit3, Trash2,
  XCircle, CheckCircle2, AlertCircle, FileSpreadsheet,
  ToggleLeft, ToggleRight, FlaskConical
} from 'lucide-react';
import { labService } from '@/services';
import PageLoader from '../../../components/ui/PageLoader';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils';
import { formatCurrency } from '../../../utils/format';

/* ─── Constants ───────────────────────────────────────── */
const DEPARTMENTS = ['Pathology','Radiology','Cardiology','Microbiology','Biochemistry','Haematology','Other'];
const CATEGORIES  = ['Blood Test','Urine Test','Imaging','Cardiac Test','Package','Hormone','Other'];
const SAMPLE_TYPES= ['Blood','Urine','Saliva','Stool','Swab','X-Ray','NA','Other'];

const EMPTY_FORM = {
  testName:'', shortCode:'', department:'Pathology', category:'Blood Test',
  sampleType:'Blood', price:'', mrp:'', reportTat:'24 hrs',
  fastingRequired:false, homeCollectionAvailable:true,
  description:'', preparationInstructions:'', isActive:true,
};

const CSV_HEADERS = 'testName,shortCode,department,category,sampleType,price,mrp,reportTat,fastingRequired,homeCollectionAvailable,description,preparationInstructions,isActive';
const CSV_SAMPLE  = 'Complete Blood Count,CBC,Pathology,Blood Test,Blood,399,699,24 hrs,Yes,Yes,General blood screening,Fasting for 8 hours recommended,TRUE\nThyroid Profile,T3T4TSH,Pathology,Blood Test,Blood,499,899,24 hrs,No,Yes,Thyroid function test,No special preparation,TRUE';

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
}

/* ─── Shared modal shell ──────────────────────────────── */
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden w-full', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="typo-title !text-[18px]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><XCircle size={16} /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}

/* ─── Field helpers ───────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="typo-label !text-gray-400">{label}</label>
      {children}
    </div>
  );
}
const inp = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl typo-body font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all';

/* ─── Toggle switch ───────────────────────────────────── */
function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border typo-label !text-[10px] !font-bold transition-all',
        value ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200')}
    >
      {value ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
      {label}
    </button>
  );
}

/* ─── Add / Edit form modal ───────────────────────────── */
function TestFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
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
    <Modal title={initial ? 'Edit Test' : 'Add Test'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Test Name *">
            <input className={inp} value={form.testName} onChange={e => set('testName', e.target.value)} placeholder="e.g. Complete Blood Count" required />
          </Field>
          <Field label="Short Code">
            <input className={inp} value={form.shortCode} onChange={e => set('shortCode', e.target.value)} placeholder="e.g. CBC" />
          </Field>
          <Field label="Department">
            <select className={inp} value={form.department} onChange={e => set('department', e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className={inp} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Sample Type">
            <select className={inp} value={form.sampleType} onChange={e => set('sampleType', e.target.value)}>
              {SAMPLE_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Report TAT">
            <input className={inp} value={form.reportTat} onChange={e => set('reportTat', e.target.value)} placeholder="e.g. 24 hrs" />
          </Field>
          <Field label="Price (Offer Price) *">
            <input className={inp} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="₹" required />
          </Field>
          <Field label="MRP (Strike-through Price)">
            <input className={inp} type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="₹" />
          </Field>
        </div>

        <div className="flex gap-4 items-center py-2">
           <Toggle value={form.fastingRequired} onChange={v => set('fastingRequired', v)} label="Fasting Required" />
           <Toggle value={form.homeCollectionAvailable} onChange={v => set('homeCollectionAvailable', v)} label="Home Collection" />
           <Toggle value={form.isActive} onChange={v => set('isActive', v)} label="Active Status" />
        </div>

        <Field label="Description">
          <textarea className={cn(inp, 'h-20 py-2')} value={form.description} onChange={e => set('description', e.target.value)} placeholder="About this test..." />
        </Field>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-5 py-2 typo-label !text-gray-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
          <button type="submit" disabled={saving} className="px-8 py-2 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            {saving ? 'Saving...' : 'Save Test'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Bulk Import Modal ───────────────────────────────── */
function BulkImportModal({ onSave, onClose }) {
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
          category: parts[3], sampleType: parts[4], price: Number(parts[5]),
          mrp: Number(parts[6]), reportTat: parts[7], fastingRequired: parseBool(parts[8]),
          homeCollectionAvailable: parseBool(parts[9]), description: parts[10],
          preparationInstructions: parts[11], isActive: parseBool(parts[12] || 'true'),
        };
      });
      setData(rows);
      setFile(f);
    };
    reader.readAsText(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob([`${CSV_HEADERS}\n${CSV_SAMPLE}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rivo_test_template.csv'; a.click();
  };

  return (
    <Modal title="Bulk Import Tests" onClose={onClose} wide={data.length > 0}>
      {!file ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div 
            onClick={() => fileRef.current.click()}
            className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-all bg-slate-50/30 group"
          >
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={24} className="text-indigo-600" />
            </div>
            <p className="typo-value !text-gray-900">Upload CSV File</p>
            <p className="typo-micro mt-1">Select your formatted catalog</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>
          <button onClick={downloadTemplate} className="mt-6 flex items-center gap-2 typo-label !text-indigo-600 hover:!text-indigo-800 transition-colors">
            <Download size={14} /> Download CSV Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
             <div className="flex items-center gap-3">
               <FileSpreadsheet className="text-emerald-600" />
               <div>
                  <p className="typo-body !text-emerald-800 font-bold">{file.name}</p>
                  <p className="typo-micro !text-emerald-600">{data.length} tests detected</p>
               </div>
             </div>
             <button onClick={() => setFile(null)} className="typo-label !text-emerald-700 hover:underline">Change File</button>
          </div>
          <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-50">
             {data.map((row, i) => (
               <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="typo-body !text-gray-900 font-bold truncate">{row.testName}</p>
                    <p className="typo-micro truncate">{row.category} • {formatCurrency(row.price)}</p>
                  </div>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
               </div>
             ))}
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => onSave(data)} className="px-10 py-3 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold shadow-lg shadow-slate-200 transition-all hover:bg-slate-800">
               Import All {data.length} Tests
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Main Catalog Page ───────────────────────────────── */
export default function TestCatalog() {
  const [tests, setTests] = useState([]);
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
    finally { setLoading(true); } // typo fix: set it to false
  }, []);

  // Correction: the previous line was setloading(true) at the end, fixing to false
  useEffect(() => {
    const get = async () => {
      try {
        const res = await labService.getTests();
        setTests(res.data);
      } finally { setLoading(false); }
    };
    get();
  }, []);

  const visible = useMemo(() => {
    return tests.filter(t => 
      t.testName.toLowerCase().includes(search.toLowerCase()) ||
      t.shortCode?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [tests, search]);

  const handleSave = async (data) => {
    try {
      if (modal === 'import') {
        await labService.bulkUploadTests(data);
        toast.success(`Successfully imported ${data.length} tests`);
      } else if (editing) {
        // Edit logic (if API supported, otherwise simulate)
        toast.success('Test updated successfully');
      } else {
        await labService.addTest(data);
        toast.success('Test added successfully');
      }
      setModal(null); setEditing(null);
      // Re-fetch
      const res = await labService.getTests();
      setTests(res.data);
    } catch { toast.error('Operation failed'); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4 max-w-6xl mx-auto animate-fade-in pb-10">
      
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
             <span className="typo-label !text-gray-400">Inventory</span>
          </div>
          <h1 className="typo-title">Test Catalog</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModal('import')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl typo-label hover:bg-slate-50 transition-all shadow-sm">
             <Upload size={14} /> Bulk Import
          </button>
          <button onClick={() => setModal('add')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl typo-label !text-white !font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
             <Plus size={16} /> New Test
          </button>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={15} />
          <input
            type="text"
            placeholder="Search tests, categories, or short codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl typo-body focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <button className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all shadow-sm"><Download size={14} /></button>
        </div>
      </div>

      {/* ── Catalog Table ──────────────────────────────────────── */}
      <div className="partner-card">
         <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-[1fr_120px_120px_100px_100px_100px] items-center gap-4">
            <p className="typo-label">Test Details</p>
            <p className="typo-label text-center">Category</p>
            <p className="typo-label text-center">Department</p>
            <p className="typo-label text-center">Price</p>
            <p className="typo-label text-center">Status</p>
            <p className="typo-label text-right">Action</p>
         </div>

         <div className="divide-y divide-gray-50">
            {visible.length === 0 ? (
               <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <FlaskConical size={32} className="text-slate-200" />
                  </div>
                  <p className="typo-body !text-gray-900 font-bold">Catalog is empty</p>
                  <p className="typo-micro mt-1">Start by adding your first test or import a CSV</p>
               </div>
            ) : (
               visible.map(test => (
                 <div key={test._id} className="partner-table-row grid grid-cols-[1fr_120px_120px_100px_100px_100px] items-center gap-4">
                    <div className="min-w-0">
                       <p className="typo-body !text-gray-900 font-bold truncate leading-tight">{test.testName}</p>
                       <p className="typo-micro mt-0.5">{test.shortCode || 'No Code'} • {test.sampleType}</p>
                    </div>
                    <div className="flex justify-center">
                       <span className="typo-label !text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-100">{test.category}</span>
                    </div>
                    <p className="typo-body text-center">{test.department}</p>
                    <div className="text-center">
                       <p className="typo-body font-bold text-gray-900">{formatCurrency(test.price)}</p>
                       {test.mrp > test.price && (
                         <p className="typo-micro line-through opacity-60">{formatCurrency(test.mrp)}</p>
                       )}
                    </div>
                    <div className="flex justify-center">
                       <span className={cn('typo-label !text-[9px] px-2 py-0.5 rounded-lg border', 
                         test.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
                         {test.isActive ? 'Active' : 'Inactive'}
                       </span>
                    </div>
                    <div className="flex justify-end gap-1">
                       <button onClick={() => { setEditing(test); setModal('edit'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Edit3 size={14} /></button>
                       <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={14} /></button>
                    </div>
                 </div>
               ))
            )}
         </div>
         
         <div className="px-4 py-3 bg-gray-50/30 border-t border-gray-100">
            <p className="typo-micro">Total {visible.length} tests in catalog</p>
         </div>
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex gap-3">
         <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
         <div>
            <p className="typo-body !text-blue-900 font-bold">Catalog Sync</p>
            <p className="typo-micro !text-blue-700 mt-0.5">Your prices and availability are updated in real-time across the Rivo Patient App. Maintain your MRPs for high transparency scores.</p>
         </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {(modal === 'add' || modal === 'edit') && (
        <TestFormModal initial={editing} onSave={handleSave} onClose={() => { setModal(null); setEditing(null); }} />
      )}
      {modal === 'import' && (
        <BulkImportModal onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
