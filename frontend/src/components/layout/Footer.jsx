import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  HeartPulse, Phone, Mail, MapPin,
  MessageCircle, Instagram, Linkedin,
  ChevronRight, Shield, CheckCircle2, Lock, Clock, Zap
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────
const services = [
  { label: 'Nursing Care',      href: '/register' },
  { label: 'Physiotherapy',     href: '/register' },
  { label: 'Doctor at Home',    href: '/register' },
  { label: 'Elder Care',        href: '/register' },
];

const company = [
  { label: 'About Us',            href: '#' },
  { label: 'Contact Us',          href: '#' },
  { label: 'Careers',             href: '#' },
  { label: 'Privacy Policy',      href: '#' },
  { label: 'Terms & Conditions',  href: '#' },
];

const contact = [
  { icon: <Phone size={15} />,  text: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: <Mail size={15} />,   text: 'care@rivocare.in',  href: 'mailto:care@rivocare.in' },
  { icon: <MapPin size={15} />, text: 'Delhi NCR, India', href: '#' },
];

const socials = [
  { icon: <MessageCircle size={18} />, href: 'https://wa.me/919876543210', label: 'WhatsApp', color: 'hover:bg-emerald-500 hover:border-emerald-500' },
  { icon: <Instagram size={18} />,     href: 'https://instagram.com',      label: 'Instagram', color: 'hover:bg-pink-500 hover:border-pink-500' },
  { icon: <Linkedin size={18} />,      href: 'https://linkedin.com',       label: 'LinkedIn',  color: 'hover:bg-blue-500 hover:border-blue-500' },
];

const trustBadges = [
  { icon: <CheckCircle2 size={18} />, label: 'Verified Professionals', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: <Lock size={18} />,         label: 'Secure Payments',         color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: <Clock size={18} />,        label: '24/7 Support',            color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
];

const areas = [
  'Delhi', 'Noida', 'Gurgaon', 'Faridabad',
  'Mumbai', 'Pune', 'Bangalore', 'Hyderabad',
  'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur',
];

// ─── Fade-in on scroll helper ─────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reusable footer link ─────────────────────────────────────
function FooterLink({ href, children }) {
  const cls =
    'flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors duration-200 text-sm leading-relaxed group';
  const arrow = (
    <ChevronRight
      size={13}
      className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
    />
  );
  if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) {
    return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={cls}>{arrow}{children}</a>;
  }
  return <Link to={href} className={cls}>{arrow}{children}</Link>;
}

// ─── Main Footer ──────────────────────────────────────────────
export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      {/* Accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-60" />

      {/* ── TRUST BADGES ───────────────────────────────────── */}
      <FadeIn>
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest shrink-0">Trusted & Secure</p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-3">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${badge.color} ${badge.bg}`}
                >
                  {badge.icon}
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── MAIN GRID ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

        {/* 1 — Brand */}
        <FadeIn delay={0} className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-xl mb-3 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <HeartPulse size={17} className="text-white" />
            </div>
            RIVO
          </Link>
          <p className="text-emerald-400 text-sm font-semibold mb-3 flex items-center gap-1">
            <Shield size={13} /> Care at Your Doorstep
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-5">
            Trusted home healthcare services — nursing, physiotherapy, and doctor visits — delivered by certified professionals.
          </p>

          {/* Quick Booking CTA */}
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-blue-900/30 mb-5 group"
          >
            <Zap size={14} className="group-hover:rotate-12 transition-transform" />
            Book Now — It's Free
          </Link>

          {/* Social icons */}
          <div className="flex gap-2.5">
            {socials.map((s) => (
              <motion.a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.92 }}
                className={`w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 ${s.color}`}
              >
                {s.icon}
              </motion.a>
            ))}
          </div>
        </FadeIn>

        {/* 2 — Services */}
        <FadeIn delay={0.1}>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Services</h3>
          <ul className="space-y-3">
            {services.map((s) => (
              <li key={s.label}><FooterLink href={s.href}>{s.label}</FooterLink></li>
            ))}
          </ul>
        </FadeIn>

        {/* 3 — Company */}
        <FadeIn delay={0.15}>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Company</h3>
          <ul className="space-y-3">
            {company.map((c) => (
              <li key={c.label}><FooterLink href={c.href}>{c.label}</FooterLink></li>
            ))}
          </ul>
        </FadeIn>

        {/* 4 — Contact */}
        <FadeIn delay={0.2}>
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Contact</h3>
          <ul className="space-y-4">
            {contact.map((c) => (
              <li key={c.text}>
                <a href={c.href} className="flex items-start gap-3 text-slate-400 hover:text-emerald-400 transition-colors duration-200 text-sm group">
                  <span className="mt-0.5 shrink-0 w-7 h-7 bg-slate-800 group-hover:bg-emerald-500/10 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-all duration-200">
                    {c.icon}
                  </span>
                  <span>{c.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>

      {/* ── SERVICEABLE AREAS ──────────────────────────────── */}
      <FadeIn>
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest shrink-0">
                <MapPin size={13} className="text-blue-500" /> Available in:
              </div>
              <div className="flex flex-wrap gap-2">
                {areas.map((city) => (
                  <span
                    key={city}
                    className="text-xs font-medium text-slate-300 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-300 border border-slate-700 hover:border-blue-700 px-3 py-1 rounded-full transition-all duration-200 cursor-default"
                  >
                    {city}
                  </span>
                ))}
                <span className="text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  + More cities soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── BOTTOM BAR ─────────────────────────────────────── */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RIVO Healthcare Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <span className="text-slate-700">|</span>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <span className="text-slate-700">|</span>
            <a href="#" className="hover:text-slate-300 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
