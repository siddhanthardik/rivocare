import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, HeartPulse, X, CheckCircle2, MessageCircle } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

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
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 flex flex-col z-40 transition-transform duration-300 shadow-xl',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'lg:static lg:shadow-none lg:h-auto lg:min-h-screen'
      )}>
        {/* Header/Logo */}
        <div className="flex items-center justify-between px-7 py-6">
          <div className="flex items-center gap-2.5 font-bold text-2xl text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <HeartPulse size={24} />
            </div>
            <span className="tracking-tight">rivo <span className="text-slate-400 font-normal">CARE</span></span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="px-7 py-4 mb-4">
          <div className="bg-slate-50/80 rounded-[2rem] p-5 flex items-center gap-4 border border-slate-100/50">
            <div className="relative">
              <Avatar name={user?.name} size="lg" className="rounded-2xl" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 size={12} className="text-blue-500 fill-blue-500/10" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs font-medium text-slate-400 mb-1">Patient</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Verified <CheckCircle2 size={8} />
              </span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-5 py-2 space-y-1 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group',
                isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon size={20} className={cn(
                'transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
              )} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center border border-blue-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Help Card */}
        <div className="px-7 py-6">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <MessageCircle size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Need help fast?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Our care team is just a message away.</p>
              <div className="flex -space-x-2 mb-4">
                {[1, 2, 3].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?img=${i+10}`} 
                    alt="support" 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  />
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600 shadow-sm">
                  +5
                </div>
              </div>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-xs">
                Chat with Support
              </Button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-5 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
