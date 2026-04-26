import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, MessageSquare, Plus, Calendar, ToggleLeft, X, Inbox } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

/* ── Role-aware header CTA ──────────────────────────────────── */
function HeaderCTA({ role }) {
  if (role === 'patient') {
    return (
      <Link to="/dashboard/patient/book" className="hidden sm:block">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-blue-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
          Book a Service <Plus size={18} />
        </Button>
      </Link>
    );
  }
  if (role === 'provider') {
    return (
      <Link to="/dashboard/provider/availability" className="hidden sm:block">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
          Update Availability <ToggleLeft size={18} />
        </Button>
      </Link>
    );
  }
  // admin → no CTA
  return null;
}

/* ── Messages quick-link dropdown ──────────────────────────── */
function MessagesButton({ role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bookingsPath = role === 'provider' ? '/dashboard/provider/bookings' : '/dashboard/patient/bookings';

  const items = role === 'provider'
    ? [
        { label: 'Booking Requests', sub: 'New service requests from patients', path: '/dashboard/provider/bookings', icon: '📋' },
        { label: 'Assigned Packages', sub: 'Long-term care assignments', path: '/dashboard/provider/assignments', icon: '📦' },
      ]
    : [
        { label: 'My Bookings', sub: 'View appointment messages', path: '/dashboard/patient/bookings', icon: '📅' },
      ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-3 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 border border-transparent hover:border-slate-100 transition-all active:scale-90"
        aria-label="Messages"
      >
        <MessageSquare size={20} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden z-[9990]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Inbox size={16} className="text-blue-500" /> Messages & Updates
            </h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link to={bookingsPath} onClick={() => setOpen(false)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Role-aware subtitle ─────────────────────────────────────── */
function RoleSubtitle({ role }) {
  const subtitles = {
    patient: 'Manage your appointments and care services.',
    provider: 'Manage your schedule, earnings and care requests.',
    admin: 'Platform overview and operational controls.',
  };
  return (
    <p className="text-sm font-medium text-slate-400 mt-0.5">
      {subtitles[role] || ''}
    </p>
  );
}

/* ── Search placeholder by role ─────────────────────────────── */
function searchPlaceholder(role) {
  if (role === 'provider') return 'Search requests, patients...';
  if (role === 'admin') return 'Search users, providers...';
  return 'Search appointments, records...';
}

/* ── Main layout ─────────────────────────────────────────────── */
export default function DashboardLayout({ navItems, role = 'patient' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-600">
      <Sidebar
        navItems={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl px-6 md:px-10 py-5 flex items-center justify-between border-b border-slate-100">
          {/* Mobile menu toggle */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-90"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Desktop greeting */}
          <div className="hidden lg:block">
            {role !== 'provider' && (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {role === 'admin' ? 'Admin' : 'Patient'} Dashboard
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full ${role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Hello, {user?.name?.split(' ')[0]} <span>👋</span>
                </h1>
                <RoleSubtitle role={role} />
              </>
            )}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3 lg:gap-4 ml-auto">
            {/* Search */}
            <div className="hidden xl:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 w-72 group focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/30 transition-all duration-300">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                type="text"
                placeholder={searchPlaceholder(role)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-400 w-full ml-3"
              />
            </div>

            {/* Notification bell — fully wired */}
            <NotificationBell />

            {/* Messages quick panel */}
            <MessagesButton role={role} />

            {/* Role CTA */}
            <HeaderCTA role={role} />
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-[1600px] w-full mx-auto bg-slate-50/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
