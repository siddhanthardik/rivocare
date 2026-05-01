import { useState, useEffect } from 'react';
import { subscriptionService } from '../../../services';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { CheckCircle2, Star, Clock, HeartPulse, Activity, Zap } from 'lucide-react';
import Badge from '../../../components/ui/Badge';

export default function PlansPackages() {
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [myPkgs, setMyPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace | active

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, pkgRes, mySubRes, myPkgRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getPackages(),
        subscriptionService.getMySubscriptions(),
        subscriptionService.getMyPackages()
      ]);
      setPlans(pRes.data.plans);
      setPackages(pkgRes.data.packages);
      setMySubs(mySubRes.data.subscriptions);
      setMyPkgs(myPkgRes.data.packages);
    } catch (err) {
      toast.error('Failed to load plans and packages');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePlan = async (id) => {
    try {
      await subscriptionService.purchasePlan(id);
      toast.success('Subscription purchased successfully!');
      fetchData();
      setActiveTab('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase plan');
    }
  };

  const handlePurchasePackage = async (id) => {
    try {
      await subscriptionService.purchasePackage(id);
      toast.success('Package purchased successfully!');
      fetchData();
      setActiveTab('active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purchase package');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading plans...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plans & Packages</h1>
          <p className="text-slate-500">Subscribe for long-term care or buy bulk sessions.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-6 text-sm font-semibold transition-colors ${activeTab === 'marketplace' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-6 text-sm font-semibold transition-colors ${activeTab === 'active' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          My Active Care
        </button>
      </div>

      {activeTab === 'marketplace' ? (
        <div className="space-y-12">
          {/* Subscriptions */}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800"><Activity className="text-blue-500"/> Subscriptions (Monthly/Weekly)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p, i) => (
                <div key={p._id} className={`relative flex flex-col bg-white rounded-3xl p-8 border ${i === 1 ? 'border-primary-500 shadow-xl scale-105' : 'border-slate-200 shadow-sm'}`}>
                  {i === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{p.serviceType}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">₹{p.price}</span>
                    <span className="text-slate-500"> / {p.durationDays} days</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> {p.sessionsPerWeek} sessions per week</li>
                    <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> {p.description}</li>
                  </ul>
                  <Button variant={i===1?'primary':'outline'} className="w-full" onClick={() => handlePurchasePlan(p._id)}>Subscribe Now</Button>
                </div>
              ))}
              {plans.length === 0 && <p className="text-slate-500">No active subscriptions available.</p>}
            </div>
          </div>

          {/* Packages */}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800"><Zap className="text-amber-500"/> Bulk Packages</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((p, i) => (
                <div key={p._id} className="relative flex flex-col bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-amber-400 transition-colors">
                  {i === 0 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Best Value</span>}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{p.serviceType}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-slate-900">₹{p.price}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> {p.totalSessions} Total Sessions</li>
                    <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> Valid for {p.validityDays} days</li>
                    <li className="flex gap-3 text-sm text-slate-700"><CheckCircle2 size={18} className="text-emerald-500 shrink-0"/> {p.description}</li>
                  </ul>
                  <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white" onClick={() => handlePurchasePackage(p._id)}>Buy Package</Button>
                </div>
              ))}
              {packages.length === 0 && <p className="text-slate-500">No active packages available.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-4">My Subscriptions</h2>
            <div className="space-y-4">
              {mySubs.map(s => (
                <div key={s._id} className="bg-white p-5 rounded-2xl border flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-bold">{s.plan?.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>{s.status}</Badge></p>
                  </div>
                  {s.provider && (
                    <div className="bg-slate-50 px-4 py-2 rounded-lg text-sm">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Assigned To</p>
                      <p className="font-medium text-slate-800">{s.provider.user?.name}</p>
                    </div>
                  )}
                </div>
              ))}
              {mySubs.length === 0 && <p className="text-slate-500">No active subscriptions.</p>}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4">My Packages</h2>
            <div className="space-y-4">
              {myPkgs.map(s => (
                <div key={s._id} className="bg-white p-5 rounded-2xl border flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-bold">{s.package?.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Status: <Badge variant={s.status === 'ACTIVE' ? 'success' : 'warning'}>{s.status}</Badge></p>
                  </div>
                  <div className="text-center bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl">
                    <span className="block text-2xl font-black">{s.sessionsRemaining}</span>
                    <span className="text-xs font-bold uppercase tracking-wide">Sessions Left</span>
                  </div>
                </div>
              ))}
              {myPkgs.length === 0 && <p className="text-slate-500">No active packages.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
