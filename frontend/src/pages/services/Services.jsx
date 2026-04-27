import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, ShieldCheck, Star, Phone } from 'lucide-react';
import { serviceIcons } from '../../constants/serviceIcons';

const services = [
  {
    title: 'Home Nursing',
    desc: 'Trained nurses for post-surgery, chronic illness, wound care & injections.',
    path: '/services/nursing-care',
    icon: serviceIcons.nursing,
    bgClass: 'bg-blue-50/50'
  },
  {
    title: 'Doctor Visit',
    desc: 'Consult experienced doctors at home for illness, follow-up and elderly care.',
    path: '/services/doctor-at-home',
    icon: serviceIcons.doctor,
    bgClass: 'bg-indigo-50/50'
  },
  {
    title: 'Physiotherapy',
    desc: 'Pain management, mobility training and rehabilitation at your home.',
    path: '/services/physiotherapy',
    icon: serviceIcons.physio,
    bgClass: 'bg-emerald-50/50'
  },
  {
    title: 'Lab Tests',
    desc: 'Book lab tests at home with accurate reports and fast sample collection.',
    path: '/services/nursing-care',
    icon: serviceIcons.lab,
    bgClass: 'bg-violet-50/50'
  },
  {
    title: 'Elder Care',
    desc: 'Compassionate elder care services including assistance with daily activities.',
    path: '/services/elder-care',
    icon: serviceIcons.elder,
    bgClass: 'bg-orange-50/50'
  },
  {
    title: 'Attendant Services',
    desc: 'Trained attendants for patient care, elder and newborn care.',
    path: '/services/elder-care',
    icon: serviceIcons.attendant,
    bgClass: 'bg-pink-50/50'
  },
  {
    title: 'ICU at Home',
    desc: 'Advanced ICU setup and critical care by expert medical team at home.',
    path: '/services/nursing-care',
    icon: serviceIcons.icu,
    bgClass: 'bg-cyan-50/50'
  },
  {
    title: 'Ambulance',
    desc: 'Quick and reliable transport services for medical needs.',
    path: '/services/doctor-at-home',
    icon: serviceIcons.ambulance,
    bgClass: 'bg-sky-50/50'
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
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((svc) => (
            <div key={svc.title} className="bg-white border border-slate-100 rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col min-h-[280px]">
              <img 
                src={svc.icon} 
                alt={svc.title} 
                className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4 group-hover:scale-[1.08] transition-transform duration-300 block"
                loading="lazy"
              />
              <h3 className="font-bold text-slate-900 text-xl mb-3" style={{ fontFamily: 'Poppins,sans-serif' }}>{svc.title}</h3>
              <p className="text-slate-600 text-[15px] leading-7 mb-6 font-medium line-clamp-3">{svc.desc}</p>
              <Link to={svc.path} className="inline-flex items-center gap-1 text-blue-600 text-sm font-bold mt-auto hover:gap-2 transition-all group-hover:translate-x-1">
                Learn More <ArrowRight size={16} />
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
