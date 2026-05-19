import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, Settings, MapPin, Search } from 'lucide-react';
import { PageWrapper, Section, Card, Row, StatusPill } from '../../../components/ui/Layout';
import Button from '../../../components/ui/Button';
import { adminVisitPricingService } from '../../../services';
import { formatCurrency } from '../../../utils/format';
import { PageLoader } from '../../../components/ui/Feedback';

export default function VisitPricing() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: '',
    city: 'Default',
    baseVisitFee: 0,
    isActive: true,
    freeVisitToday: false, // Simple promo mapping
    waiveAboveAmount: 0,
    tierRules: [] // Array of { minKm, maxKm, fee }
  });

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await adminVisitPricingService.getVisitPricingConfigs();
      setConfigs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load visit pricing rules');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleToggle = async (id) => {
    try {
      await adminVisitPricingService.toggleVisitPricingConfig(id);
      toast.success('Rule status updated');
      loadConfigs();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const addTierRule = () => {
    setFormData(prev => ({
      ...prev,
      tierRules: [...prev.tierRules, { minKm: 0, maxKm: 0, fee: 0 }]
    }));
  };

  const removeTierRule = (index) => {
    setFormData(prev => ({
      ...prev,
      tierRules: prev.tierRules.filter((_, i) => i !== index)
    }));
  };

  const updateTierRule = (index, field, value) => {
    const newTiers = [...formData.tierRules];
    newTiers[index][field] = Number(value);
    setFormData({ ...formData, tierRules: newTiers });
  };

  const handleSave = async () => {
    if (!formData.serviceType || !formData.city) {
      return toast.error('Service Type and City are required');
    }
    
    setSaving(true);
    try {
      // Map simple form to complex backend schema
      const payload = {
        serviceType: formData.serviceType,
        city: formData.city,
        baseVisitFee: Number(formData.baseVisitFee),
        isActive: formData.isActive,
        tierRules: formData.tierRules,
        waiverRules: {
          enabled: Number(formData.waiveAboveAmount) > 0,
          aboveAmount: Number(formData.waiveAboveAmount)
        },
        promoRules: {
          freeVisitDays: formData.freeVisitToday ? [new Date().toLocaleDateString('en-US', { weekday: 'long' })] : []
        }
      };

      await adminVisitPricingService.createVisitPricingConfig(payload);
      toast.success('Visit Pricing Rule Created');
      setShowForm(false);
      setFormData({
        serviceType: '', city: 'Default', baseVisitFee: 0, isActive: true, freeVisitToday: false, waiveAboveAmount: 0, tierRules: []
      });
      await loadConfigs(); // Re-fetch immediately
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <PageWrapper maxWidth="1000px">
      <Section 
        title="Visit Pricing" 
        subtitle="Manage operational fees and promotions safely"
        action={
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'Add Rule'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-fade-in p-6 bg-slate-50/50">
          <div className="space-y-6">
            <h3 className="typo-value font-black text-slate-800">Create New Pricing Rule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="typo-label block mb-1">Service Type *</label>
                <input 
                  type="text" 
                  value={formData.serviceType}
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                  placeholder="e.g. nurse, doctor, physiotherapist"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="typo-label block mb-1">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  placeholder="e.g. Default, Delhi, Mumbai"
                  className="input-base w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="typo-label block mb-1">Base Visit Fee (₹)</label>
                <input 
                  type="number" 
                  value={formData.baseVisitFee}
                  onChange={e => setFormData({...formData, baseVisitFee: e.target.value})}
                  className="input-base w-full"
                />
              </div>
              
              <div>
                 <label className="typo-label block mb-2">Status</label>
                 <div className="flex items-center gap-2 mt-2">
                   <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} id="isAct"/>
                   <label htmlFor="isAct" className="text-sm font-bold">Active immediately</label>
                 </div>
              </div>
            </div>

            {/* Simple Promotions */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <h4 className="typo-label font-bold text-blue-800">Simple Promotions</h4>
              <div className="flex items-center gap-2">
                 <input type="checkbox" checked={formData.freeVisitToday} onChange={e => setFormData({...formData, freeVisitToday: e.target.checked})} id="fvt"/>
                 <label htmlFor="fvt" className="text-sm">Free Visit Today (Waives completely for today)</label>
              </div>
              <div>
                 <label className="typo-label block mb-1">Waive if Booking Amount Above (₹)</label>
                 <input 
                  type="number" 
                  value={formData.waiveAboveAmount}
                  onChange={e => setFormData({...formData, waiveAboveAmount: e.target.value})}
                  placeholder="e.g. 1999"
                  className="input-base w-full md:w-1/2"
                />
              </div>
            </div>

            {/* Distance Tiers */}
            <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <h4 className="typo-label font-bold text-slate-800">Distance Tier Rules</h4>
                <button onClick={addTierRule} className="text-xs font-bold text-blue-600 flex items-center gap-1"><Plus size={12}/> Add Tier</button>
              </div>
              
              {formData.tierRules.length === 0 && <p className="text-xs text-slate-400">No distance tiers added. Base fee applies to all distances.</p>}
              
              <div className="space-y-2">
                {formData.tierRules.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="number" placeholder="Min KM" value={tier.minKm} onChange={e=>updateTierRule(i,'minKm',e.target.value)} className="input-base w-24 text-sm" />
                    <span className="text-slate-400">-</span>
                    <input type="number" placeholder="Max KM" value={tier.maxKm} onChange={e=>updateTierRule(i,'maxKm',e.target.value)} className="input-base w-24 text-sm" />
                    <span className="text-slate-400">→ ₹</span>
                    <input type="number" placeholder="Fee" value={tier.fee} onChange={e=>updateTierRule(i,'fee',e.target.value)} className="input-base w-24 text-sm" />
                    <button onClick={() => removeTierRule(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={handleSave} loading={saving} className="btn-primary">Save Pricing Rule</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {configs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-400 font-bold">No pricing rules configured.</p>
          </div>
        ) : (
          configs.map(config => (
            <Card key={config._id} noPadding className="overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-start justify-between bg-white hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800 capitalize">{config.serviceType}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                      <MapPin size={10} className="inline mr-1" />{config.city}
                    </span>
                    <StatusPill status={config.isActive ? 'ACTIVE' : 'INACTIVE'} className="scale-90" />
                  </div>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p><strong>Base Fee:</strong> {formatCurrency(config.baseVisitFee)}</p>
                    {(config.waiverRules?.enabled || (config.promoRules?.freeVisitDays?.length > 0)) && (
                      <p className="text-emerald-600 text-[11px] font-bold mt-1">
                        ✨ Promos Active: {config.promoRules?.freeVisitDays?.includes(new Date().toLocaleDateString('en-US',{weekday:'long'})) ? 'Free Visit Today' : ''} {config.waiverRules?.enabled ? `Waive > ₹${config.waiverRules.aboveAmount}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => handleToggle(config._id)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline underline-offset-2"
                  >
                    {config.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {config.tierRules && config.tierRules.length > 0 && (
                <div className="bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Distance Tiers</p>
                  <div className="flex gap-2 flex-wrap">
                    {config.tierRules.map((tier, i) => (
                      <div key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                        {tier.minKm} - {tier.maxKm} km <span className="text-slate-300 mx-1">→</span> <span className="font-black text-slate-800">₹{tier.fee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </PageWrapper>
  );
}
