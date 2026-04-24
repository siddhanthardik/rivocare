import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, ShieldCheck, Star, Phone } from 'lucide-react';

const services = [
  {
    title: 'Home Nursing',
    desc: 'Trained nurses for post-surgery, chronic illness, wound care & injections.',
    path: '/services/nursing-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16h24l-3-8H15z" /><path d="M24 10v4m-2-2h4" />
        <path d="M14 16c-3 0-5 2-5 6v2c0 2 1 4 3 6" /><path d="M34 16c3 0 5 2 5 6v2c0 2-1 4-3 6" />
        <path d="M17 22v4a7 7 0 0 0 14 0v-4" />
      </svg>
    ),
  },
  {
    title: 'Elder Care',
    desc: 'Compassionate elder care services including assistance with daily activities.',
    path: '/services/elder-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="12" r="4" /><path d="M20 18c-3 0-5 2-5 5v7h4v12" />
        <path d="M24 30v12" /><path d="M20 18c2 0 4 1 5 3l4 6" /><path d="M31 22v20" />
      </svg>
    ),
  },
  {
    title: 'ICU at Home',
    desc: 'Advanced ICU setup and critical care by expert medical team at home.',
    path: '/services/nursing-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="10" width="32" height="24" rx="3" /><path d="M16 34v4M32 34v4M12 38h24" />
        <path d="M18 22h12M24 16v12" stroke="#6EE7B7" />
      </svg>
    ),
  },
  {
    title: 'Physiotherapy',
    desc: 'Pain management, mobility training and rehabilitation at your home.',
    path: '/services/physiotherapy',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="12" r="4" /><path d="M30 18l-8 8-4 14" /><path d="M22 26l6 12" />
        <path d="M30 18c-4-2-8 0-10 4l-4 8" /><path d="M8 38h32" />
      </svg>
    ),
  },
  {
    title: 'Doctor Visit',
    desc: 'Consult experienced doctors at home for illness, follow-up and elderly care.',
    path: '/services/doctor-at-home',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 10v8a8 8 0 0 0 16 0v-8" /><path d="M13 8h6M29 8h6" />
        <path d="M24 26v10" /><circle cx="24" cy="40" r="4" />
      </svg>
    ),
  },
  {
    title: 'Attendant Services',
    desc: 'Trained attendants for patient care, elder and newborn care.',
    path: '/services/elder-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 24l-4.5-4.5a4.5 4.5 0 0 1 6.3-6.3L24 14.5l-1.8-1.3a4.5 4.5 0 0 1 6.3 6.3z" stroke="#6EE7B7" strokeWidth="2.5" />
        <path d="M14 30l4 4 6 2 6-2 4-4" /><path d="M8 26c0 4 4 8 8 10" /><path d="M40 26c0 4-4 8-8 10" />
      </svg>
    ),
  },
  {
    title: 'Lab Tests',
    desc: 'Book lab tests at home with accurate reports and fast sample collection.',
    path: '/services/nursing-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 8h8" /><path d="M24 8v12l-10 20h20l-10-20V8" />
        <path d="M17 32h14" stroke="#6EE7B7" /><circle cx="21" cy="36" r="1.5" fill="#6EE7B7" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Recovery Care',
    desc: 'Personalized recovery programs for faster healing and better strength.',
    path: '/services/physiotherapy',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 32V20a12 12 0 0 1 24 0v12" /><path d="M8 32h32v4H8z" /><path d="M6 36h36v4H6z" />
        <path d="M24 28v-8" stroke="#6EE7B7" />
      </svg>
    ),
  },
  {
    title: 'Palliative Care',
    desc: 'Specialised care for palliative conditions, comfort and pain management.',
    path: '/services/nursing-care',
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 38 C16 32 8 24 8 16 a8 8 0 0 1 16-2 a8 8 0 0 1 16 2 c0 8-8 16-16 22z" stroke="#6EE7B7" />
      </svg>
    ),
  },
];

const trustItems = [
  { icon: ShieldCheck, label: 'Verified Experts' },
  { icon: ShieldCheck, label: 'Safe & Hygienic' },
  { icon: Star, label: 'Affordable Pricing' },
  { icon: Phone, label: '24/7 Support' },
];

export default function Services() {
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium">Services</span>
        </div>
      </div>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Poppins,sans-serif' }}>Our Services</h1>
        <p className="text-slate-500 text-base max-w-xl">Comprehensive healthcare and support services delivered at your doorstep.</p>
      </section>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((svc) => (
            <div key={svc.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                {svc.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2" style={{ fontFamily: 'Poppins,sans-serif' }}>{svc.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{svc.desc}</p>
              <Link to={svc.path} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:gap-2 transition-all">
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="bg-gradient-to-r from-[#1E293B] to-[#1e3a6e] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl mb-1" style={{ fontFamily: 'Poppins,sans-serif' }}>Not sure which service is right for you?</h3>
              <p className="text-slate-300 text-sm">Our care coordinators are here to help you find the right care plan.</p>
            </div>
          </div>
          <Link to="/contact-us" className="shrink-0 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm whitespace-nowrap">
            Talk to an Expert <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center gap-8">
          {trustItems.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Icon size={18} className="text-blue-600" />
                {t.label}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
