import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { pricingService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { 
  IndianRupee, Pencil, Plus, Search, LayoutGrid, FlaskConical 
} from 'lucide-react';
import { cn } from '../../../utils';

const TABS = [
  { id: 'care', label: 'Home Care Services', icon: LayoutGrid },
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
      const isType = p.service !== 'lab';
      const matchesSearch = p.service.toLowerCase().includes(searchTerm.toLowerCase());
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
          <p className="text-slate-500 font-medium mt-1">Global command center for base rates and payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search services..." 
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
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Price / Hr</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payout Type</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payout Value</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredPricing.map(p => {
                     return (
                       <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                             <p className="font-black text-slate-900 capitalize">{p.service}</p>
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-slate-700">₹{p.basePrice}</td>
                          <td className="px-8 py-6 text-center">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black capitalize">{p.providerPayoutType}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">
                               {p.providerPayoutType === 'percentage' ? `${(p.providerPayoutValue * 100).toFixed(0)}%` : `₹${p.providerPayoutValue}`}
                             </span>
                          </td>
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
    service: initialData?.service || 'nurse',
    basePrice: initialData?.basePrice || 0,
    providerPayoutType: initialData?.providerPayoutType || 'percentage',
    providerPayoutValue: initialData?.providerPayoutValue || 0.8,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
       <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Service</label>
          <select 
            className="input-base" 
            value={formData.service}
            onChange={e => setFormData({...formData, service: e.target.value})}
            disabled={!!initialData?._id}
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
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Base Price (₹ per hr/session)</label>
          <input 
            type="number" 
            className="input-base"
            required
            value={formData.basePrice}
            onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
          />
       </div>

       <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Payout Type</label>
             <select 
               className="input-base" 
               value={formData.providerPayoutType}
               onChange={e => setFormData({...formData, providerPayoutType: e.target.value})}
             >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
             </select>
          </div>
          <div>
             <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Payout Value</label>
             <input 
               type="number" 
               step="0.01" 
               className="input-base font-black text-blue-600"
               required
               value={formData.providerPayoutValue}
               onChange={e => setFormData({...formData, providerPayoutValue: Number(e.target.value)})}
             />
             <p className="text-[10px] text-slate-400 mt-1">E.g. 0.8 for 80%, or 500 for flat ₹500</p>
          </div>
       </div>

       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Preview Example (1 Hour/Session)</p>
          <div className="flex items-center justify-between">
             <div>
                <p className="text-2xl font-black text-slate-900">
                  ₹{formData.providerPayoutType === 'percentage' ? Math.round(formData.basePrice * formData.providerPayoutValue) : formData.providerPayoutValue}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Provider Earning</p>
             </div>
             <div className="text-right">
                <p className="text-sm font-black text-amber-600">
                  ₹{formData.basePrice - (formData.providerPayoutType === 'percentage' ? Math.round(formData.basePrice * formData.providerPayoutValue) : formData.providerPayoutValue)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Platform Fee</p>
             </div>
          </div>
       </div>
    </form>
  );
}
