import { LogOut, MessageCircle, Headphones } from 'lucide-react';

/**
 * SidebarSupportBlock
 * Shared component used in Patient + Provider sidebar.
 * Contains:
 *   - Compact "Need Support" card with brand gradient
 *   - Full-width Logout button
 */
export default function SidebarSupportBlock({ onLogout, role = 'patient' }) {
  /* Subtle gradient per role for the support card accent line */
  const accentClass =
    role === 'provider'
      ? 'from-emerald-600 to-primary-700'
      : role === 'admin'
      ? 'from-purple-700 to-primary-800'
      : role === 'partner'
      ? 'from-indigo-700 to-primary-800'
      : 'from-primary-600 to-primary-800';

  return (
    <div className="px-3 pb-4 space-y-2.5">

      {/* ── Divider ────────────────────────────────── */}
      <div className="border-t border-slate-100/80 mb-1" />

      {/* ── Support Card ───────────────────────────── */}
      <div
        className={`bg-gradient-to-br ${accentClass} rounded-2xl p-4 relative overflow-hidden group shadow-md shadow-primary-900/10`}
      >
        {/* Background icon watermark */}
        <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform duration-300">
          <MessageCircle size={52} className="text-white" />
        </div>

        <div className="relative z-10 space-y-3">
          {/* Label */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/15 rounded-lg flex items-center justify-center">
              <Headphones size={12} className="text-white" />
            </div>
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
              Need Support
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => window.open('https://wa.me/919999999999', '_blank')}
            className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 hover:border-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <MessageCircle size={13} />
            Chat with Support
          </button>
        </div>
      </div>

      {/* ── Logout Button ──────────────────────────── */}
      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2.5 w-full px-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] transition-all duration-150 border border-slate-100 hover:border-slate-200 group"
        style={{ minHeight: '44px' }}
      >
        <LogOut
          size={14}
          className="group-hover:translate-x-0.5 transition-transform duration-150 shrink-0"
        />
        <span>Logout</span>
      </button>
    </div>
  );
}
