import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse, X } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

export default function Sidebar({ navItems, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 flex flex-col z-40 transition-transform duration-300 shadow-lg',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'lg:static lg:shadow-none lg:h-auto lg:min-h-screen'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-lg text-primary-700">
            <HeartPulse size={20} className="text-primary-600" />
            RIVO
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
