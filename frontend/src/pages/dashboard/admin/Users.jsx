import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../../services';
import { PageLoader, EmptyState } from '../../../components/ui/Feedback';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, patient, provider, admin
  const [refresh, setRefresh] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    adminService.getUsers({ limit: 50, ...(filter !== 'all' && { role: filter }) })
      .then((res) => setUsers(res.data.users))
      .catch((err) => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [refresh, filter]);

  const toggleStatus = async (user) => {
    if (user.role === 'admin') return toast.error('Cannot suspend an admin account');
    setUpdatingId(user._id);
    try {
      await adminService.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'suspended' : 'activated'} successfully`);
      setRefresh(r => r + 1);
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && users.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500">View and manage all registered accounts.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          {['all', 'patient', 'provider', 'admin'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${filter === f ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <EmptyState title="No users found" description="No accounts match the selected filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">Joined {formatDate(u.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{u.email}</p>
                      <p className="text-xs text-slate-500">{u.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">{u.role}</td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                      ) : (
                        <span className="badge bg-red-50 text-red-700 border border-red-200">Suspended</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={u.isActive ? 'danger' : 'success'}
                        size="sm"
                        loading={updatingId === u._id}
                        disabled={u.role === 'admin'}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
