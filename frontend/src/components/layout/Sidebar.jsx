import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { X, CheckCircle2, Stethoscope, User, ShieldCheck, Lock, Search, ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import SidebarSupportBlock from './SidebarSupportBlock';

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
  partner: {
    label: 'Lab Partner',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    dot: 'bg-indigo-500',
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
    : role === 'partner'
    ? 'bg-indigo-50 text-indigo-700'
    : 'bg-blue-50 text-blue-600';

  const activeIconClass = role === 'provider'
    ? 'text-emerald-600'
    : role === 'admin'
    ? 'text-purple-600'
    : role === 'partner'
    ? 'text-indigo-600'
    : 'text-blue-600';

  const activeBadgeClass = role === 'provider'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : role === 'admin'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : role === 'partner'
    ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
    : 'bg-blue-100 text-blue-600 border-blue-200';

  const isUnverifiedProvider = role === 'provider' && user?.providerProfile?.onboardingStatus !== 'ACTIVE';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_expanded');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('admin_sidebar_expanded', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const filteredNavItems = searchQuery.trim() === '' 
    ? navItems 
    : navItems.flatMap(item => {
        if (item.group) {
          const matchingItems = item.items.filter(sub => 
            sub.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return matchingItems.length > 0 ? [{ ...item, items: matchingItems }] : [];
        }
        return item.label.toLowerCase().includes(searchQuery.toLowerCase()) ? [item] : [];
      });

  const renderNavItem = (item, isSubItem = false) => {
    const isLocked = isUnverifiedProvider && 
      item.path !== '/dashboard/provider' && 
      item.path !== '/dashboard/provider/onboarding' &&
      item.path !== '/dashboard/provider/profile';

    return (
      <NavLink
        key={item.path}
        to={isLocked ? '#' : item.path}
        end={item.end}
        onClick={(e) => {
          if (isLocked) {
            e.preventDefault();
            return;
          }
          onClose();
        }}
        className={({ isActive }) => cn(
          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group',
          isSubItem ? 'ml-4' : '',
          isActive && !isLocked
            ? activeClass + ' text-sm font-semibold shadow-sm'
            : isLocked
            ? 'text-sm font-medium text-slate-300 cursor-not-allowed grayscale'
            : 'text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        {({ isActive }) => (
          <>
            {item.icon && (
              <item.icon
                size={isSubItem ? 14 : 16}
                className={cn(
                  'transition-colors shrink-0',
                  isActive && !isLocked ? activeIconClass : 'text-slate-400'
                )}
              />
            )}
            <span className="flex-1 truncate">{item.label}</span>
            {isLocked && <Lock size={12} className="text-slate-300 ml-auto" />}
            {item.badge && !isLocked && (
              <span className={cn(
                'min-w-[18px] h-[18px] text-[9px] font-black rounded-lg flex items-center justify-center border px-1',
                item.badgeColor || (isActive ? activeBadgeClass : 'bg-slate-100 text-slate-600 border-slate-200')
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100/80 flex flex-col z-40 transition-transform duration-300',
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
        'lg:static lg:shadow-none lg:h-auto lg:min-h-screen'
      )}>
        {/* ── Logo / Close ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100/60 shrink-0">
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt="Rivo Care Logo" className="h-7 w-auto" />
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── Profile Card ─────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className={cn(
            'rounded-2xl p-3.5 flex items-center gap-3 border transition-all duration-300',
            role === 'provider' ? 'bg-emerald-50/40 border-emerald-100/40' :
            role === 'admin'    ? 'bg-purple-50/40 border-purple-100/40' :
                                  'bg-slate-50/80 border-slate-100/60'
          )}>
            {/* Avatar with role dot */}
            <div className="relative shrink-0">
              <Avatar name={user?.name} size="md" className="rounded-xl shadow-sm" />
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm',
                roleConfig.dot
              )} />
            </div>

            {/* Name + role badge */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-black text-slate-900 truncate leading-tight">{user?.name?.split(' ')[0]}</p>
                {role === 'provider' && user?.providerProfile?.onboardingStatus === 'ACTIVE' && <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />}
              </div>
              <span className={cn(
                'inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border mt-1',
                roleConfig.badge
              )}>
                <RoleIcon size={7} />
                {roleConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav Search ───────────────────────────────────────── */}
        {role === 'admin' && (
          <div className="px-4 py-2 shrink-0">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 py-2 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/30 transition-all outline-none"
              />
            </div>
          </div>
        )}

        {/* ── Nav Items ─────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
          {filteredNavItems.map((item, idx) => {
            if (item.group) {
              const isExpanded = expandedGroups[item.group] !== false; // Default expanded
              return (
                <div key={item.group} className="mb-4">
                  <button
                    onClick={() => toggleGroup(item.group)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {item.group}
                    <div className="flex items-center gap-2">
                      {item.groupBadge && (
                        <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[8px] font-black leading-none">
                          {item.groupBadge}
                        </span>
                      )}
                      <ChevronDown size={12} className={cn('transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-0.5">
                      {item.items.map(subItem => renderNavItem(subItem, true))}
                    </div>
                  )}
                </div>
              );
            }
            return renderNavItem(item);
          })}
        </nav>

        {/* ── Support + Logout (pinned to bottom) ───────────────── */}
        <SidebarSupportBlock onLogout={handleLogout} role={role} />
      </aside>
    </>
  );
}
