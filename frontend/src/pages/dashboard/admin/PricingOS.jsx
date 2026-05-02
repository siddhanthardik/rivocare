import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { pricingService } from '../../../services';
import { PageLoader } from '../../../components/ui/Feedback';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { 
  IndianRupee, Pencil, Plus, Search, LayoutGrid, 
  Settings2, Package as PkgIcon, ListTree, ChevronRight,
  ShieldCheck, Info, Trash2, Activity, Zap
} from 'lucide-react';
import { cn } from '../../../utils';

const TABS = [
  { id: 'services', label: 'Service Catalog', icon: ListTree, desc: 'Define available care categories' },
  { id: 'rules', label: 'Base Rates & Payouts', icon: Settings2, desc: 'Configure margins and provider shares' },
  { id: 'plans', label: 'Plans & Packages', icon: PkgIcon, desc: 'Manage subscriptions and bulk bundles' },
];

export default function PricingOS() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [rules, setRules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [serviceModal, setServiceModal] = useState({ open: false, data: null });
  const [ruleModal, setRuleModal] = useState({ open: false, data: null });
  const [planModal, setPlanModal] = useState({ open: false, data: null });
  const [saving, setSaving] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes, pRes] = await Promise.all([
        pricingService.adminGetServices(),
        pricingService.getAdminRules(),
        pricingService.adminGetPlans()
      ]);
      setServices(sRes.data || []);
      setRules(rRes.data || []);
      setPlans(pRes.data || []);
    } catch (err) {
      toast.error('Failed to sync Pricing OS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // --- Handlers ---
  const handleSaveService = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (serviceModal.data._id) {
        await pricingService.updateService(serviceModal.data._id, serviceModal.data);
      } else {
        await pricingService.createService(serviceModal.data);
      }
      toast.success('Service catalog updated');
      setServiceModal({ open: false, data: null });
      loadAllData();
    } catch (err) { toast.error('Service update failed'); }
    finally { setSaving(false); }
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pricingService.upsertRule(ruleModal.data);
      toast.success('Pricing rule applied');
      setRuleModal({ open: false, data: null });
      loadAllData();
    } catch (err) { toast.error('Rule update failed'); }
    finally { setSaving(false); }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (planModal.data._id) {
        await pricingService.updatePlan(planModal.data._id, planModal.data);
      } else {
        await pricingService.createPlan(planModal.data);
      }
      toast.success('Offering saved');
      setPlanModal({ open: false, data: null });
      loadAllData();
    } catch (err) { toast.error('Plan update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader label="Booting Pricing OS..." />;

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto">
      {/* Dynamic Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
              <Zap size={14} fill="currentColor" /> Unified Pricing Core
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Pricing OS <span className="px-3 py-1 bg-slate-900 text-white text-[10px] rounded-full uppercase tracking-widest font-black">v2.0</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-md">The central intelligence for services, payout logic, and customer offerings.</p>
          </div>
          
          <div className="flex gap-4 relative z-10">
             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 min-w-[120px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Plans</p>
                <p className="text-2xl font-black text-slate-900">{plans.filter(p=>p.isActive).length}</p>
             </div>
             <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-600/20 min-w-[120px] text-white">
                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Total Services</p>
                <p className="text-2xl font-black">{services.length}</p>
             </div>
          </div>
        </div>
      </div>

      {/* OS Navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-start p-6 rounded-[2rem] transition-all duration-300 text-left border-2",
              activeTab === tab.id 
                ? "bg-white border-blue-600 shadow-2xl shadow-blue-600/5 -translate-y-1" 
                : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200 text-slate-400"
            )}
          >
            <div className={cn(
              "p-3 rounded-2xl mb-4 transition-colors",
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
            )}>
              <tab.icon size={24} strokeWidth={2.5} />
            </div>
            <p className={cn("font-black text-lg", activeTab === tab.id ? "text-slate-900" : "text-slate-500")}>{tab.label}</p>
            <p className="text-xs font-medium text-slate-400 mt-1">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Main OS Interface */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        
        {/* TAB 1: SERVICE CATALOG */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Service Catalog</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Core services available for booking.</p>
               </div>
               <Button onClick={() => setServiceModal({ open: true, data: { name: '', icon: '', description: '', isActive: true }})} className="bg-slate-900 text-white rounded-2xl font-black px-6">
                  <Plus size={18} className="mr-2" /> Add Service
               </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(s => (
                <div key={s._id} className="group bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <Badge variant={s.isActive ? 'success' : 'slate'}>{s.isActive ? 'Active' : 'Offline'}</Badge>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{s.name}</h3>
                  <p className="text-xs font-medium text-slate-400 mt-2 line-clamp-2">{s.description}</p>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {s.slug || s._id.slice(-6)}</span>
                    <Button variant="ghost" size="sm" onClick={() => setServiceModal({ open: true, data: s })} className="hover:bg-blue-50 text-blue-600 rounded-xl">
                      <Pencil size={14} className="mr-2" /> Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRICING RULES */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Base Rates & Payout Logic</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Configure global margins per service hourly/session base.</p>
               </div>
               <Button onClick={() => setRuleModal({ open: true, data: { service: '', basePrice: 0, providerPayoutType: 'percentage', providerPayoutValue: 0.8 }})} className="bg-slate-900 text-white rounded-2xl font-black px-6">
                  <Plus size={18} className="mr-2" /> Configure Rule
               </Button>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Rate</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payout</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Platform Fee</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {rules.map(r => {
                       const payout = r.providerPayoutType === 'percentage' ? r.basePrice * r.providerPayoutValue : r.providerPayoutValue;
                       const margin = r.basePrice - payout;
                       return (
                         <tr key={r._id} className="hover:bg-slate-50/30 transition-colors">
                           <td className="px-6 py-6 font-black text-slate-900">{r.service?.name}</td>
                           <td className="px-6 py-6 text-center font-bold text-slate-700">₹{r.basePrice}</td>
                           <td className="px-6 py-6 text-center">
                              <div className="flex flex-col items-center">
                                 <span className="text-emerald-600 font-black">₹{payout.toLocaleString()}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                   {r.providerPayoutType === 'percentage' ? `${r.providerPayoutValue * 100}% share` : 'Flat share'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-6 text-center">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">₹{margin.toLocaleString()}</span>
                           </td>
                           <td className="px-6 py-6 text-right">
                              <Button variant="ghost" size="sm" onClick={() => setRuleModal({ open: true, data: { ...r, service: r.service?._id } })}>
                                <Pencil size={14} />
                              </Button>
                           </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLANS & PACKAGES */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-end">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">Offerings: Plans & Packages</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Patient-facing subscription plans and bulk session bundles.</p>
               </div>
               <Button onClick={() => setPlanModal({ open: true, data: { name: '', service: '', planType: 'subscription', durationDays: 30, sessionsPerWeek: 3, price: 0, description: '', isActive: true }})} className="bg-slate-900 text-white rounded-2xl font-black px-6">
                  <Plus size={18} className="mr-2" /> Create Offering
               </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map(p => (
                <div key={p._id} className="relative group bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl transition-all duration-500 overflow-hidden">
                   {/* Background Decor */}
                   <div className={cn(
                     "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10",
                     p.planType === 'subscription' ? "bg-blue-600" : "bg-amber-600"
                   )}></div>
                   
                   <div className="flex justify-between items-start relative z-10">
                      <div>
                         <Badge variant={p.planType === 'subscription' ? 'indigo' : 'amber'} className="mb-3 uppercase tracking-widest text-[9px] font-black">
                           {p.planType}
                         </Badge>
                         <h3 className="text-2xl font-black text-slate-900">{p.name}</h3>
                         <p className="text-blue-600 font-bold text-sm mt-1 flex items-center gap-2">
                           <Zap size={14} /> {p.service?.name}
                         </p>
                      </div>
                      <div className="text-right">
                         <p className="text-3xl font-black text-slate-900">₹{p.price.toLocaleString()}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">One-time payment</p>
                      </div>
                   </div>

                   <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                      {p.planType === 'subscription' ? (
                        <>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                             <p className="font-bold text-slate-700">{p.durationDays} Days</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sessions</p>
                             <p className="font-bold text-slate-700">{p.sessionsPerWeek}/Week</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sessions</p>
                             <p className="font-bold text-slate-700">{p.totalSessions} Sessions</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Validity</p>
                             <p className="font-bold text-slate-700">{p.validityDays} Days</p>
                          </div>
                        </>
                      )}
                   </div>

                   <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3">
                         <Badge variant={p.isActive ? 'success' : 'slate'}>{p.isActive ? 'Selling' : 'Archived'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPlanModal({ open: true, data: p })} className="hover:bg-slate-100 rounded-xl">
                           <Pencil size={14} className="mr-2" /> Edit
                        </Button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}
      
      {/* Service Modal */}
      <Modal isOpen={serviceModal.open} onClose={() => setServiceModal({ open: false, data: null })} title="Service Config" size="sm">
         {serviceModal.data && (
           <form onSubmit={handleSaveService} className="space-y-4 pt-4">
              <Input label="Service Name" value={serviceModal.data.name} onChange={e => setServiceModal({...serviceModal, data: {...serviceModal.data, name: e.target.value}})} required />
              <Input label="Slug (unique identifier)" value={serviceModal.data.slug} onChange={e => setServiceModal({...serviceModal, data: {...serviceModal.data, slug: e.target.value}})} placeholder="nurse, doctor-home, etc" />
              <div className="flex items-center gap-4 py-2">
                 <label className="text-sm font-bold text-slate-700">Active in App</label>
                 <input type="checkbox" checked={serviceModal.data.isActive} onChange={e => setServiceModal({...serviceModal, data: {...serviceModal.data, isActive: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
              </div>
              <Button type="submit" loading={saving} className="w-full bg-slate-900 text-white rounded-xl">Deploy Service</Button>
           </form>
         )}
      </Modal>

      {/* Rule Modal */}
      <Modal isOpen={ruleModal.open} onClose={() => setRuleModal({ open: false, data: null })} title="Pricing Payout Core">
         {ruleModal.data && (
           <form onSubmit={handleSaveRule} className="space-y-6 pt-4">
              <div>
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Service</label>
                 <select className="input-base" value={ruleModal.data.service} onChange={e => setRuleModal({...ruleModal, data: {...ruleModal.data, service: e.target.value}})} required>
                    <option value="">-- Select Service --</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                 </select>
              </div>
              <Input label="Base Rate (₹ per unit)" type="number" value={ruleModal.data.basePrice} onChange={e => setRuleModal({...ruleModal, data: {...ruleModal.data, basePrice: Number(e.target.value)}})} required />
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Payout Type</label>
                    <select className="input-base font-bold" value={ruleModal.data.providerPayoutType} onChange={e => setRuleModal({...ruleModal, data: {...ruleModal.data, providerPayoutType: e.target.value}})} required>
                       <option value="percentage">Percentage</option>
                       <option value="flat">Flat Amount</option>
                    </select>
                 </div>
                 <Input label="Payout Value" type="number" step="0.01" value={ruleModal.data.providerPayoutValue} onChange={e => setRuleModal({...ruleModal, data: {...ruleModal.data, providerPayoutValue: Number(e.target.value)}})} required />
              </div>
              <Button type="submit" loading={saving} className="w-full bg-blue-600 text-white rounded-xl font-black">Sync Logic</Button>
           </form>
         )}
      </Modal>

      {/* Plan Modal */}
      <Modal isOpen={planModal.open} onClose={() => setPlanModal({ open: false, data: null })} title="Offering Designer">
         {planModal.data && (
           <form onSubmit={handleSavePlan} className="space-y-4 pt-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                 {['subscription', 'package'].map(t => (
                   <button 
                     type="button" 
                     key={t}
                     onClick={() => setPlanModal({...planModal, data: {...planModal.data, planType: t}})}
                     className={cn("flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all", planModal.data.planType === t ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                   >
                     {t}
                   </button>
                 ))}
              </div>
              
              <Input label="Plan Title" value={planModal.data.name} onChange={e => setPlanModal({...planModal, data: {...planModal.data, name: e.target.value}})} required />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Linked Service</label>
                   <select className="input-base" value={planModal.data.service} onChange={e => setPlanModal({...planModal, data: {...planModal.data, service: e.target.value}})} required>
                      <option value="">-- Select --</option>
                      {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                   </select>
                </div>
                <Input label="Consumer Price (₹)" type="number" value={planModal.data.price} onChange={e => setPlanModal({...planModal, data: {...planModal.data, price: Number(e.target.value)}})} required />
              </div>

              {planModal.data.planType === 'subscription' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Duration (Days)" type="number" value={planModal.data.durationDays} onChange={e => setPlanModal({...planModal, data: {...planModal.data, durationDays: Number(e.target.value)}})} required />
                  <Input label="Sessions / Week" type="number" value={planModal.data.sessionsPerWeek} onChange={e => setPlanModal({...planModal, data: {...planModal.data, sessionsPerWeek: Number(e.target.value)}})} required />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Total Sessions" type="number" value={planModal.data.totalSessions} onChange={e => setPlanModal({...planModal, data: {...planModal.data, totalSessions: Number(e.target.value)}})} required />
                  <Input label="Validity (Days)" type="number" value={planModal.data.validityDays} onChange={e => setPlanModal({...planModal, data: {...planModal.data, validityDays: Number(e.target.value)}})} required />
                </div>
              )}

              <div className="space-y-1">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Description</label>
                 <textarea className="input-base min-h-[80px]" value={planModal.data.description} onChange={e => setPlanModal({...planModal, data: {...planModal.data, description: e.target.value}})} required />
              </div>

              <div className="flex items-center gap-4 py-2">
                 <label className="text-sm font-bold text-slate-700">Available for Purchase</label>
                 <input type="checkbox" checked={planModal.data.isActive} onChange={e => setPlanModal({...planModal, data: {...planModal.data, isActive: e.target.checked}})} className="w-5 h-5 accent-emerald-600" />
              </div>

              <Button type="submit" loading={saving} className="w-full bg-slate-900 text-white rounded-xl py-4 font-black">Publish Offering</Button>
           </form>
         )}
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </div>
  );
}
