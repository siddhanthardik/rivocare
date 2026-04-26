import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LogOut, X, CheckCircle2, MessageCircle, Stethoscope, User, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

/* ── Role display config ─────────────────────────────────────── */
const ROLE_CONFIG = {
  patient: {
    label: 'Patient',
    badge: 'bg-blue-50 text-blue-600 border-blue-100',
    dot: 'bg-blue-500',
    icon: User,
  },
  provider: {
    label: 'Care Expert',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-500',
    icon: Stethoscope,
  },
  admin: {
    label: 'Administrator',
    badge: 'bg-purple-50 text-purple-600 border-purple-100',
    dot: 'bg-purple-500',
    icon: ShieldCheck,
  },
};

export default function Sidebar({ navItems, isOpen, onClose, role = 'patient' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.patient;
  const RoleIcon = roleConfig.icon;

  /* Active link accent colours by role */
  const activeClass = role === 'provider'
    ? 'bg-emerald-50 text-emerald-700'
    : role === 'admin'
    ? 'bg-purple-50 text-purple-700'
    : 'bg-blue-50 text-blue-600';

  const activeIconClass = role === 'provider'
    ? 'text-emerald-600'
    : role === 'admin'
    ? 'text-purple-600'
    : 'text-blue-600';

  const activeBadgeClass = role === 'provider'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : role === 'admin'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-blue-100 text-blue-600 border-blue-200';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 flex flex-col z-40 transition-transform duration-300 shadow-xl',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'lg:static lg:shadow-none lg:h-auto lg:min-h-screen'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-7 py-7">
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt="Rivo Care Logo" className="h-9 w-auto" />
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* ── Profile Card ──────────────────────────────────── */}
        <div className="px-5 mb-4">
          <div className={cn(
            'rounded-[1.75rem] p-4 flex items-center gap-3.5 border',
            role === 'provider' ? 'bg-emerald-50/60 border-emerald-100/60' :
            role === 'admin'    ? 'bg-purple-50/60 border-purple-100/60' :
                                  'bg-slate-50/80 border-slate-100/50'
          )}>
            {/* Avatar with role dot */}
            <div className="relative shrink-0">
              <Avatar name={user?.name} size="lg" className="rounded-2xl" />
              <div className={cn(
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm',
                roleConfig.dot
              )} />
            </div>

            {/* Name + role badge */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.name}</p>

              {/* Role label */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                  roleConfig.badge
                )}>
                  <RoleIcon size={8} />
                  {roleConfig.label}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                  <CheckCircle2 size={8} className="text-slate-400" /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav Items ──────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 group',
                isActive
                  ? activeClass + ' shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={19}
                    className={cn(
                      'transition-colors shrink-0',
                      isActive ? activeIconClass : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'min-w-[20px] h-5 text-[10px] font-bold rounded-full flex items-center justify-center border px-1',
                      isActive ? activeBadgeClass : 'bg-slate-100 text-slate-600 border-slate-200'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Help Card ──────────────────────────────────────── */}
        <div className="px-5 py-5">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-[1.75rem] p-5 border border-slate-100 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <MessageCircle size={72} />
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Need help fast?</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Our care team is just a message away.</p>
              <div className="flex -space-x-2 mb-4">
                {[1, 2, 3].map(i => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="support"
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  />
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600 shadow-sm">+5</div>
              </div>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-xs">
                Chat with Support
              </Button>
            </div>
          </div>
        </div>

        {/* ── Logout ─────────────────────────────────────────── */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group"
          >
            <LogOut size={19} className="group-hover:translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
