import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { labService } from '@/services';
import { PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Pencil, Search, FlaskConical } from 'lucide-react';
import { cn } from '@/utils';
import { LAB_DEPARTMENTS } from '@/constants/departments';

export default function LabPricing() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await labService.getAdminTests();
      setTests(res.data || []);
    } catch {
      toast.error('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const searchStr = `${t.name} ${t.department} ${t.partner?.name || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [tests, searchTerm]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await labService.updateAdminTestPricing(editTarget._id, formData);
      toast.success('Lab pricing updated successfully');
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lab Commissions</h1>
          <p className="text-slate-500 font-medium mt-1">Manage platform margins and fees for diagnostic tests globally.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search tests..." 
              className="input-base pl-10 w-64 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test & Partner</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Patient Price</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commission Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Commission Value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredTests.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="px-8 py-10 text-center text-slate-400 font-medium">No tests found.</td>
                 </tr>
               ) : filteredTests.map(t => {
                 return (
                   <tr key={t._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                             <FlaskConical size={18} />
                           </div>
                           <div>
                             <p className="font-black text-slate-900">{t.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{LAB_DEPARTMENTS.find(d => d.key === t.department)?.label || t.department} • {t.partner?.name || 'Unknown Partner'}</p>
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-slate-700">₹{t.price}</td>
                      <td className="px-8 py-6 text-center">
                         <span className={cn("px-3 py-1 rounded-lg text-xs font-black capitalize", t.commissionOverride?.active ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600")}>
                           {t.commissionOverride?.active ? 'Override' : 'Default / Dept'}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                           {t.commissionOverride?.active 
                              ? (t.commissionOverride.commissionType === 'flat' ? `₹${t.commissionOverride.commissionValue}` : `${((t.commissionOverride.commissionValue || 0) * 100).toFixed(0)}%`) 
                              : 'Dynamic'}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => setEditTarget(t)}
                           className="opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Pencil size={14} className="text-slate-400" />
                         </Button>
                      </td>
                   </tr>
                 );
               })}
            </tbody>
         </table>
      </div>

      <Modal
        isOpen={!!editTarget}
        onClose={() => !saving && setEditTarget(null)}
        title="Edit Commission"
        footer={
           <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
              <Button onClick={() => document.getElementById('lab-pricing-form').requestSubmit()} loading={saving} className="bg-blue-600 text-white rounded-xl">Save Configuration</Button>
           </div>
        }
      >
         {editTarget && (
           <LabPricingForm 
              id="lab-pricing-form" 
              initialData={editTarget} 
              onSubmit={handleSave} 
           />
         )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}

function LabPricingForm({ id, initialData, onSubmit }) {
  const [formData, setFormData] = useState({
    overrideActive: initialData?.commissionOverride?.active || false,
    commissionType: initialData?.commissionOverride?.commissionType || 'percentage',
    commissionValue: initialData?.commissionOverride?.commissionValue !== undefined 
      ? (initialData.commissionOverride.commissionType === 'percentage' ? initialData.commissionOverride.commissionValue * 100 : initialData.commissionOverride.commissionValue) 
      : 20,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
       <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4">
         <p className="text-sm font-bold text-slate-800">{initialData.name}</p>
         <p className="text-xs text-slate-500">Patient Price: ₹{initialData.price}</p>
       </div>

       <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
         <input 
           type="checkbox" 
           id="overrideActive"
           checked={formData.overrideActive}
           onChange={(e) => setFormData({...formData, overrideActive: e.target.checked})}
           className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
         />
         <label htmlFor="overrideActive" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
           Enable Strict Override for this Test
         </label>
       </div>

       {formData.overrideActive ? (
         <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Commission Type</label>
             <select 
               className="input-base" 
               value={formData.commissionType}
               onChange={e => setFormData({...formData, commissionType: e.target.value})}
             >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
             </select>
          </div>
          <div>
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Value ({formData.commissionType === 'percentage' ? '%' : '₹'})</label>
             <input 
               type="number" 
               step="0.01" 
               className="input-base font-black text-blue-600"
               required
               value={formData.commissionValue}
               onChange={e => setFormData({...formData, commissionValue: Number(e.target.value)})}
             />
          </div>
       </div>
       ) : (
         <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center">
           <p className="text-slate-500 font-medium text-sm">
             Using dynamic commission logic (Lab Department config or Global Default 20%).
           </p>
         </div>
       )}
    </form>
  );
}
