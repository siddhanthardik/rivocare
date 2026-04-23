import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, HeartPulse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import NotificationBell from '../ui/NotificationBell';

const DASHBOARD_PATHS = {
  patient: '/dashboard/patient',
  provider: '/dashboard/provider',
  admin: '/dashboard/admin',
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <HeartPulse size={24} className="text-primary-600" />
          RIVO
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-700 px-3 py-2 transition-colors">Login</Link>
              <Link to="/register" className="text-sm font-medium bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">Get Started</Link>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <Link to={DASHBOARD_PATHS[user.role]} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary-700 px-3 py-2 rounded-lg transition-colors hover:bg-primary-50">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Avatar name={user.name} size="sm" />
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={17} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
