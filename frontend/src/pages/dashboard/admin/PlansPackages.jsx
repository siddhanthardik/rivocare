import { useState, useEffect } from 'react';
import { adminService, providerService } from '../../../services';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { Plus, Edit2, Link } from 'lucide-react';

export default function AdminPlansPackages() {
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [pendingSubs, setPendingSubs] = useState([]);
  const [pendingPkgs, setPendingPkgs] = useState([]);
  const [providers, setProviders] = useState([]);
  const [activeTab, setActiveTab] = useState('plans'); // plans | packages | assignments
  const [loading, setLoading] = useState(true);

  // Modals
  const [planModal, setPlanModal] = useState({ open: false, data: null });
  const [pkgModal, setPkgModal] = useState({ open: false, data: null });
  const [assignModal, setAssignModal] = useState({ open: false, request: null, type: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'plans') {
        const res = await adminService.getPlans();
        setPlans(res.data.plans);
      } else if (activeTab === 'packages') {
        const res = await adminService.getPackages();
        setPackages(res.data.packages);
      } else {
        const [assignRes, provRes] = await Promise.all([
          adminService.getPendingAssignments(),
          providerService.getAll({ status: 'verified', limit: 100 })
        ]);
        setPendingSubs(assignRes.data.pendingSubs);
        setPendingPkgs(assignRes.data.pendingPkgs);
        setProviders(provRes.data.providers || []);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    const data = planModal.data;
    try {
      if (data._id) await adminService.updatePlan(data._id, data);
      else await adminService.createPlan(data);
      toast.success('Plan saved successfully');
      setPlanModal({ open: false, data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving plan'); }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    const data = pkgModal.data;
    try {
      if (data._id) await adminService.updatePackage(data._id, data);
      else await adminService.createPackage(data);
      toast.success('Package saved successfully');
      setPkgModal({ open: false, data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving package'); }
  };

  const handleAssignProvider = async (e) => {
    e.preventDefault();
    const { providerId, notes } = assignModal.data;
    try {
      await adminService.assignProvider({
        referenceId: assignModal.request._id,
        type: assignModal.type,
        providerId,
        notes
      });
      toast.success('Assigned successfully');
      setAssignModal({ open: false, request: null, type: '', data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Assignment failed'); }
  };

  // Content rendering functions mapping over arrays are omitted for brevity in thought, but standard mapping in JSX.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plans & Packages</h1>
          <p className="text-slate-500">Manage subscriptions, bulk packages, and Provider assignments.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('plans')} className={`pb-3 px-6 text-sm font-semibold transition-colors ${activeTab === 'plans' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>Subscriptions</button>
        <button onClick={() => setActiveTab('packages')} className={`pb-3 px-6 text-sm font-semibold transition-colors ${activeTab === 'packages' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>Packages</button>
        <button onClick={() => setActiveTab('assignments')} className={`pb-3 px-6 text-sm font-semibold transition-colors ${activeTab === 'assignments' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}>Pending Assignments</button>
      </div>

      {activeTab === 'plans' && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Subscription Plans</h2>
            <Button onClick={() => setPlanModal({ open: true, data: { name: '', serviceType: 'nurse', durationDays: 30, sessionsPerWeek: 3, price: 0, description: '', isActive: true }})}>
              <Plus size={16} /> Add Plan
            </Button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                <th className="p-4">Name</th>
                <th className="p-4">Service</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{p.name}</td>
                  <td className="p-4 capitalize">{p.serviceType}</td>
                  <td className="p-4">₹{p.price}</td>
                  <td className="p-4"><Badge variant={p.isActive?'success':'slate'}>{p.isActive?'Active':'Disabled'}</Badge></td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" onClick={() => setPlanModal({ open: true, data: p })}><Edit2 size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Bulk Packages</h2>
            <Button onClick={() => setPkgModal({ open: true, data: { name: '', serviceType: 'physiotherapist', totalSessions: 10, price: 0, validityDays: 90, description: '', isActive: true }})}>
              <Plus size={16} /> Add Package
            </Button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b">
                <th className="p-4">Name</th>
                <th className="p-4">Sessions</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(p => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-semibold">{p.name}</td>
                  <td className="p-4">{p.totalSessions}</td>
                  <td className="p-4">₹{p.price}</td>
                  <td className="p-4"><Badge variant={p.isActive?'success':'slate'}>{p.isActive?'Active':'Disabled'}</Badge></td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" onClick={() => setPkgModal({ open: true, data: p })}><Edit2 size={14}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-4">Pending Subscriptions</h2>
            <div className="space-y-4">
              {pendingSubs.map(s => (
                <div key={s._id} className="flex flex-wrap items-center justify-between bg-slate-50 p-4 border rounded-xl">
                  <div>
                    <p className="font-bold">{s.user?.name} <span className="text-sm font-normal text-slate-500">({s.user?.phone})</span></p>
                    <p className="text-sm text-blue-600 font-medium">{s.plan?.name} • {s.plan?.serviceType}</p>
                  </div>
                  <Button size="sm" onClick={() => setAssignModal({ open: true, type: 'SUBSCRIPTION', request: s, data: { providerId: '', notes: '' } })}>
                    <Link size={14}/> Assign Provider
                  </Button>
                </div>
              ))}
              {pendingSubs.length === 0 && <p className="text-slate-400">No pending subscriptions.</p>}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-4">Pending Packages</h2>
            <div className="space-y-4">
              {pendingPkgs.map(s => (
                <div key={s._id} className="flex flex-wrap items-center justify-between bg-slate-50 p-4 border rounded-xl">
                  <div>
                    <p className="font-bold">{s.user?.name} <span className="text-sm font-normal text-slate-500">({s.user?.phone})</span></p>
                    <p className="text-sm text-amber-600 font-medium">{s.package?.name} • {s.package?.serviceType}</p>
                  </div>
                  <Button size="sm" onClick={() => setAssignModal({ open: true, type: 'PACKAGE', request: s, data: { providerId: '', notes: '' } })}>
                    <Link size={14}/> Assign Provider
                  </Button>
                </div>
              ))}
              {pendingPkgs.length === 0 && <p className="text-slate-400">No pending packages.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modals here... */}
      <Modal isOpen={planModal.open} onClose={() => setPlanModal({open: false, data: null})} title={planModal.data?._id ? "Edit Plan" : "Create Plan"}>
        {planModal.open && (
         <form onSubmit={handleSavePlan} className="space-y-4 pt-4">
           <Input label="Name" value={planModal.data.name} onChange={e => setPlanModal({ ...planModal, data: { ...planModal.data, name: e.target.value }})} required />
           <div className="grid grid-cols-2 gap-4">
             <Input label="Days Duration" type="number" value={planModal.data.durationDays} onChange={e => setPlanModal({ ...planModal, data: { ...planModal.data, durationDays: Number(e.target.value) }})} required />
             <Input label="Sessions/Week" type="number" value={planModal.data.sessionsPerWeek} onChange={e => setPlanModal({ ...planModal, data: { ...planModal.data, sessionsPerWeek: Number(e.target.value) }})} required />
           </div>
           <Input label="Price (₹)" type="number" value={planModal.data.price} onChange={e => setPlanModal({ ...planModal, data: { ...planModal.data, price: Number(e.target.value) }})} required />
           <Input label="Description" value={planModal.data.description} onChange={e => setPlanModal({ ...planModal, data: { ...planModal.data, description: e.target.value }})} required />
           <Button type="submit" className="w-full">Save Plan</Button>
         </form>
        )}
      </Modal>

      <Modal isOpen={pkgModal.open} onClose={() => setPkgModal({open: false, data: null})} title={pkgModal.data?._id ? "Edit Package" : "Create Package"}>
        {pkgModal.open && (
         <form onSubmit={handleSavePackage} className="space-y-4 pt-4">
           <Input label="Name" value={pkgModal.data.name} onChange={e => setPkgModal({ ...pkgModal, data: { ...pkgModal.data, name: e.target.value }})} required />
           <div className="grid grid-cols-2 gap-4">
             <Input label="Total Sessions" type="number" value={pkgModal.data.totalSessions} onChange={e => setPkgModal({ ...pkgModal, data: { ...pkgModal.data, totalSessions: Number(e.target.value) }})} required />
             <Input label="Validity (Days)" type="number" value={pkgModal.data.validityDays} onChange={e => setPkgModal({ ...pkgModal, data: { ...pkgModal.data, validityDays: Number(e.target.value) }})} required />
           </div>
           <Input label="Price (₹)" type="number" value={pkgModal.data.price} onChange={e => setPkgModal({ ...pkgModal, data: { ...pkgModal.data, price: Number(e.target.value) }})} required />
           <Input label="Description" value={pkgModal.data.description} onChange={e => setPkgModal({ ...pkgModal, data: { ...pkgModal.data, description: e.target.value }})} required />
           <Button type="submit" className="w-full">Save Package</Button>
         </form>
        )}
      </Modal>

      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({...assignModal, open: false})} title={`Assign Provider to ${assignModal.request?.user?.name}`}>
        {assignModal.open && (
         <form onSubmit={handleAssignProvider} className="space-y-4 pt-4">
           <div>
             <label className="block text-sm font-medium mb-1">Select Provider</label>
             <select className="w-full p-2 border rounded-lg" value={assignModal.data.providerId} onChange={e => setAssignModal({ ...assignModal, data: { ...assignModal.data, providerId: e.target.value }})} required>
               <option value="">-- Choose Provider --</option>
               {providers.map(p => (
                 <option key={p._id} value={p._id}>{p.user?.name} ({p.service})</option>
               ))}
             </select>
           </div>
           <Input label="Admin Notes (Optional)" value={assignModal.data.notes} onChange={e => setAssignModal({ ...assignModal, data: { ...assignModal.data, notes: e.target.value }})} />
           <Button type="submit" className="w-full">Confirm Assignment</Button>
         </form>
        )}
      </Modal>

    </div>
  );
}
