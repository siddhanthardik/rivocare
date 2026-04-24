import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Phone, Mail, ChevronDown, ArrowRight } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm flex flex-col font-sans">
      {/* ── TOP BAR ── */}
      <div className="hidden lg:flex bg-[#1e293b] text-white text-xs py-2 px-6 justify-between items-center font-medium">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="opacity-80 flex items-center gap-1.5"><ClockIcon /> 24/7 Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={13} className="opacity-80" />
            <a href="tel:+918123123123" className="hover:text-blue-300 transition">+91 8123 123 123</a>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="opacity-80" />
            <a href="mailto:care@rivocare.com" className="hover:text-blue-300 transition">care@rivocare.com</a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link to="/careers" className="flex items-center gap-1.5 hover:text-blue-300 transition">
            <BriefcaseIcon /> We're Hiring!
          </Link>
          <Link to="/refer" className="flex items-center gap-1.5 hover:text-blue-300 transition">
            <GiftIcon /> Refer & Earn
          </Link>
        </div>
      </div>

      {/* ── MAIN BAR ── */}
      <div className="max-w-[1400px] w-full mx-auto px-4 lg:px-6 flex items-center justify-between h-20">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/images/logo.png" alt="Rivo Care Logo" className="h-10" />
        </Link>

        {/* Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/" className="text-[15px] font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">Home</Link>
          <Link to="/about-us" className="text-[15px] font-medium text-slate-600 hover:text-blue-600 transition pb-1">About Us</Link>
          <div className="relative group cursor-pointer">
            <Link to="/services" className="flex items-center gap-1 text-[15px] font-medium text-slate-600 hover:text-blue-600 transition pb-1">
              Services <ChevronDown size={14} className="mt-0.5" />
            </Link>
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
              <Link to="/services/nursing-care" className="block px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50">Home Nursing</Link>
              <Link to="/services/physiotherapy" className="block px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50">Physiotherapy</Link>
              <Link to="/services/doctor-at-home" className="block px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50">Doctor at Home</Link>
              <Link to="/services/elder-care" className="block px-4 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50">Elder Care</Link>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <Link to="/services" className="block px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">View All Services →</Link>
              </div>
            </div>
          </div>
          <Link to="/blog" className="text-[15px] font-medium text-slate-600 hover:text-blue-600 transition pb-1">Blog</Link>
          <Link to="/contact-us" className="text-[15px] font-medium text-slate-600 hover:text-blue-600 transition pb-1">Contact Us</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-3">
              <Link to="/register" className="hidden sm:flex items-center gap-2 bg-[#0f52ba] text-white text-[15px] font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
                Book Now <ArrowRight size={16} />
              </Link>
              <a href="https://wa.me/918123123123" target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 border-2 border-emerald-500 rounded-full text-emerald-500 hover:bg-emerald-50 transition">
                <WhatsAppIcon />
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <Link to={DASHBOARD_PATHS[user.role]} className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors hover:bg-blue-50">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Avatar name={user.name} size="sm" />
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Simple internal icon components to match the mockup exactly
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
  );
}

function GiftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
  );
}
