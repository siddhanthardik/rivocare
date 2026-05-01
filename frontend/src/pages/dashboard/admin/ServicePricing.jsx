import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { pricingService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { 
  IndianRupee, Pencil, TrendingUp, ShieldCheck, 
  Info, LayoutGrid, FlaskConical, MapPin, 
  Plus, Search, Save, Trash2 
} from 'lucide-react';
import { cn } from '../../../utils';

const TABS = [
  { id: 'care', label: 'Home Care Services', icon: LayoutGrid },
  { id: 'lab', label: 'Lab Tests', icon: FlaskConical },
  { id: 'overrides', label: 'Pricing Overrides', icon: MapPin },
];

export default function AdminServicePricing() {
  const [activeTab, setActiveTab] = useState('care');
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await pricingService.getAdminPricing();
      setPricing(res.data || []);
    } catch {
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredPricing = useMemo(() => {
    return pricing.filter(p => {
      const isType = activeTab === 'overrides' ? true : (activeTab === 'lab' ? p.serviceType === 'lab' : p.serviceType !== 'lab');
      const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return isType && matchesSearch;
    });
  }, [pricing, activeTab, searchTerm]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await pricingService.upsertPricing(formData);
      toast.success('Pricing updated successfully');
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pricing OS</h1>
          <p className="text-slate-500 font-medium mt-1">Global command center for margins, base rates, and regional surcharges.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search rules..." 
              className="input-base pl-10 w-64 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setEditTarget({})} className="bg-slate-900 text-white rounded-xl gap-2 font-black">
            <Plus size={18} /> Add Rule
          </Button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPricing.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold">No pricing rules found for this category.</p>
            <Button variant="ghost" onClick={() => setEditTarget({})} className="mt-4 text-blue-600">Create your first rule</Button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service & Category</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Price</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Multiplier</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Margin</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total (Est)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredPricing.map(p => {
                     const subtotal = p.basePrice * p.multiplier;
                     const total = subtotal * (1 + p.platformMargin);
                     return (
                       <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                             <p className="font-black text-slate-900">{p.label}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.serviceType} / {p.category}</p>
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-slate-700">₹{p.basePrice}</td>
                          <td className="px-8 py-6 text-center">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">x{p.multiplier}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">{(p.platformMargin * 100).toFixed(0)}%</span>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">₹{Math.round(total)}</td>
                          <td className="px-8 py-6 text-right">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => setEditTarget(p)}
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
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => !saving && setEditTarget(null)}
        title={editTarget?._id ? 'Edit Pricing Rule' : 'New Pricing Rule'}
        footer={
           <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</Button>
              <Button onClick={() => document.getElementById('pricing-form').requestSubmit()} loading={saving} className="bg-blue-600 text-white rounded-xl">Save Configuration</Button>
           </div>
        }
      >
         <PricingForm 
            id="pricing-form" 
            initialData={editTarget} 
            onSubmit={handleSave} 
         />
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}

function PricingForm({ id, initialData, onSubmit }) {
  const [formData, setFormData] = useState({
    serviceType: initialData?.serviceType || 'nurse',
    category: initialData?.category || '',
    label: initialData?.label || '',
    basePrice: initialData?.basePrice || 0,
    multiplier: initialData?.multiplier || 1,
    platformMargin: initialData?.platformMargin || 0.15,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
       <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Service Type</label>
             <select 
               className="input-base" 
               value={formData.serviceType}
               onChange={e => setFormData({...formData, serviceType: e.target.value})}
             >
                <option value="nurse">Nurse</option>
                <option value="physiotherapist">Physiotherapist</option>
                <option value="doctor">Doctor</option>
                <option value="caretaker">Caretaker</option>
                <option value="procedure">Procedure</option>
                <option value="package">Package</option>
                <option value="lab">Lab Test</option>
             </select>
          </div>
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Category ID</label>
             <input 
               type="text" 
               placeholder="e.g. 12h_shift" 
               className="input-base"
               required
               value={formData.category}
               onChange={e => setFormData({...formData, category: e.target.value})}
             />
          </div>
       </div>

       <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Display Label</label>
          <input 
            type="text" 
            placeholder="e.g. 12h Day Shift" 
            className="input-base"
            required
            value={formData.label}
            onChange={e => setFormData({...formData, label: e.target.value})}
          />
       </div>

       <div className="grid grid-cols-3 gap-4">
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Base Price (₹)</label>
             <input 
               type="number" 
               className="input-base"
               required
               value={formData.basePrice}
               onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
             />
          </div>
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Multiplier</label>
             <input 
               type="number" 
               step="0.1" 
               className="input-base font-black text-blue-600"
               required
               value={formData.multiplier}
               onChange={e => setFormData({...formData, multiplier: Number(e.target.value)})}
             />
          </div>
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Margin (%)</label>
             <input 
               type="number" 
               step="0.01" 
               className="input-base font-black text-amber-600"
               required
               value={formData.platformMargin}
               onChange={e => setFormData({...formData, platformMargin: Number(e.target.value)})}
             />
          </div>
       </div>

       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Price Preview</p>
          <div className="flex items-center justify-between">
             <div>
                <p className="text-2xl font-black text-slate-900">
                  ₹{Math.round((formData.basePrice * formData.multiplier) * (1 + formData.platformMargin))}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Patient Price</p>
             </div>
             <div className="text-right">
                <p className="text-sm font-black text-emerald-600">
                  + ₹{Math.round((formData.basePrice * formData.multiplier) * formData.platformMargin)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Platform Take</p>
             </div>
          </div>
       </div>
    </form>
  );
}
