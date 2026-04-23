import { useState, useEffect } from 'react';
import { providerService, subscriptionService } from '../../../services';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { Package, Calendar, CheckSquare, XSquare, PlusSquare } from 'lucide-react';

export default function ProviderAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await providerService.getAssignments();
      setAssignments(res.data.data.assignments);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await providerService.updateAssignment(id, status);
      toast.success(`Assignment ${status.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update assignment status');
    }
  };

  const handleLogSession = async (packageId) => {
    try {
      await subscriptionService.logSession(packageId);
      toast.success('Session logged successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log session');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading assignments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assigned Packages</h1>
          <p className="text-slate-500">Manage your long-term subscribed patients and package sessions.</p>
        </div>
      </div>

      <div className="space-y-4">
        {assignments.map(a => (
          <div key={a._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant={a.status === 'PENDING' ? 'warning' : a.status === 'ACCEPTED' ? 'success' : 'slate'}>{a.status}</Badge>
                <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  {a.type === 'PACKAGE' ? <Package size={14}/> : <Calendar size={14}/>} {a.type}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800">{a.patient?.name}</h3>
                <p className="text-slate-600 mt-1">{a.patient?.phone} • {a.patient?.address}</p>
                {a.notes && <p className="text-sm text-slate-500 mt-2 bg-amber-50 p-2 rounded border border-amber-100 italic">Admin Note: {a.notes}</p>}
              </div>

              {a.status === 'ACCEPTED' && a.type === 'PACKAGE' && a.referenceId?.sessionsRemaining !== undefined && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-xl inline-flex items-center gap-2 mt-2">
                  <span className="font-bold text-lg">{a.referenceId.sessionsRemaining}</span> sessions left
                  {a.referenceId.sessionsRemaining > 0 && (
                    <Button size="sm" variant="outline" className="ml-4 h-8 bg-white border-blue-200 hover:bg-blue-50" onClick={() => handleLogSession(a.referenceId._id)}>
                      <PlusSquare size={14} className="mr-1"/> Log Visit
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              {a.status === 'PENDING' && (
                <>
                  <Button className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusUpdate(a._id, 'ACCEPTED')}>
                    <CheckSquare size={16} className="mr-2"/> Accept Assignment
                  </Button>
                  <Button variant="outline" className="w-full justify-center text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleStatusUpdate(a._id, 'REJECTED')}>
                    <XSquare size={16} className="mr-2"/> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="text-center bg-white p-12 rounded-2xl border border-dashed border-slate-300">
            <Package className="mx-auto w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Assignments Yet</h3>
            <p className="text-slate-500 mt-2">When an admin assigns a long-term patient package to you, it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
