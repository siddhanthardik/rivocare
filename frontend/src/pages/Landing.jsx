import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  HeartPulse, ChevronRight, ChevronDown, Star, CheckCircle2,
  Shield, Clock, Stethoscope, Activity, Users, Phone,
  MapPin, ArrowRight, MessageCircle, Zap, Heart, Award
} from 'lucide-react';
import Footer from '../components/layout/Footer';
import { bookingService } from '../services';

// ─── Animation Variants ───────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Scroll-triggered section wrapper ────────────────────────
function FadeSection({ children, className = '', variants = fadeUp, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ──────────────────────────────────────────────────────
const services = [
  {
    icon: <Stethoscope className="w-7 h-7" />,
    color: 'bg-blue-50 text-blue-600',
    border: 'group-hover:border-blue-200',
    name: 'Nursing Care',
    desc: 'Wound care, injections, IV drips & vital sign monitoring at your home.',
    price: 'From ₹400/hr',
  },
  {
    icon: <Activity className="w-7 h-7" />,
    color: 'bg-emerald-50 text-emerald-600',
    border: 'group-hover:border-emerald-200',
    name: 'Physiotherapy',
    desc: 'Post-surgery rehab, pain management & mobility exercises.',
    price: 'From ₹500/hr',
  },
  {
    icon: <HeartPulse className="w-7 h-7" />,
    color: 'bg-rose-50 text-rose-600',
    border: 'group-hover:border-rose-200',
    name: 'Doctor Visit',
    desc: 'GP consultations, diagnosis & prescription at your doorstep.',
    price: 'From ₹700/visit',
  },
  {
    icon: <Heart className="w-7 h-7" />,
    color: 'bg-amber-50 text-amber-600',
    border: 'group-hover:border-amber-200',
    name: 'Elder Care',
    desc: 'Daily care assistance, companionship & personal hygiene support.',
    price: 'From ₹300/hr',
  },
];

const trustPoints = [
  { icon: <Shield className="w-6 h-6" />, title: 'Verified Professionals', desc: 'Every provider is background-checked, licensed & re-verified every 6 months.', color: 'text-blue-600 bg-blue-50' },
  { icon: <Clock className="w-6 h-6" />, title: '24/7 Support', desc: 'Our care team is available round the clock to assist you and your family.', color: 'text-violet-600 bg-violet-50' },
  { icon: <Heart className="w-6 h-6" />, title: 'Care at Home', desc: 'Skip the hospital. Get the same professional care from your own bed.', color: 'text-rose-600 bg-rose-50' },
  { icon: <Zap className="w-6 h-6" />, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden charges. Pay only for what you book.', color: 'text-amber-600 bg-amber-50' },
];

const steps = [
  { num: '01', icon: <Stethoscope className="w-8 h-8" />, title: 'Choose a Service', desc: 'Select the type of care you need — nursing, physio, doctor, or elder care.' },
  { num: '02', icon: <MapPin className="w-8 h-8" />, title: 'Book Appointment', desc: 'Enter your location and pick a convenient date and time slot.' },
  { num: '03', icon: <HeartPulse className="w-8 h-8" />, title: 'Get Care at Home', desc: 'Your verified professional arrives on time and delivers expert care.' },
];

const testimonials = [
  {
    name: 'Anjali Sharma', city: 'Mumbai', rating: 5,
    text: 'RIVO connected me with a fantastic nurse in under 10 minutes. Absolute lifesaver for my father\'s post-op recovery.',
    avatar: 'AS',
    avatarColor: 'bg-blue-500',
  },
  {
    name: 'Rohan Mehta', city: 'Pune', rating: 5,
    text: 'Booked a physiotherapist for my knee surgery rehab. Professional, punctual, and incredibly skilled.',
    avatar: 'RM',
    avatarColor: 'bg-emerald-500',
  },
  {
    name: 'Priya Nair', city: 'Bangalore', rating: 5,
    text: 'The doctor visit was seamless. No travel, no waiting rooms — I\'m never going back to clinics for minor issues!',
    avatar: 'PN',
    avatarColor: 'bg-rose-500',
  },
];

const stats = [
  { value: '200+', label: 'Verified Providers', icon: <Users className="w-5 h-5" /> },
  { value: '5K+', label: 'Bookings Completed', icon: <CheckCircle2 className="w-5 h-5" /> },
  { value: '4.8★', label: 'Average Rating', icon: <Star className="w-5 h-5" /> },
  { value: '12+', label: 'Cities Served', icon: <MapPin className="w-5 h-5" /> },
];

export default function Landing() {
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState(null); // null | 'available' | 'unavailable'
  const [areaDetails, setAreaDetails] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);

  const checkPincode = async () => {
    if (pincode.length !== 6) return;
    setCheckingPin(true);
    try {
      const res = await bookingService.checkPincode(pincode);
      if (res.data.isServiceable) {
        setPincodeResult('available');
        setAreaDetails(res.data.data);
      } else {
        setPincodeResult('unavailable');
        setAreaDetails(null);
      }
    } catch(err) {
      setPincodeResult('unavailable');
      setAreaDetails(null);
    } finally {
      setCheckingPin(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeUp}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                200+ verified healthcare professionals
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                Healthcare at Home,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                  Simplified
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl leading-relaxed">
                Book verified nurses, doctors, physiotherapists and caretakers — professional care delivered right to your doorstep.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0 duration-200">
                  Book Now <ChevronRight size={18} />
                </Link>
                <a href="#services"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all duration-200">
                  Explore Services <ChevronDown size={18} />
                </a>
              </motion.div>

              {/* Pincode Checker */}
              <motion.div variants={fadeUp} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <p className="text-sm text-blue-200 mb-2 font-medium flex items-center gap-1.5">
                  <MapPin size={14} /> Check availability in your area
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={e => { setPincode(e.target.value.replace(/\D/g, '')); setPincodeResult(null); }}
                    placeholder="Enter your pincode"
                    className="flex-1 bg-white/20 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/50 focus:bg-white/25 transition"
                    onKeyDown={e => e.key === 'Enter' && checkPincode()}
                  />
                  <button
                    onClick={checkPincode}
                    disabled={pincode.length !== 6 || checkingPin}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 text-sm whitespace-nowrap">
                    {checkingPin ? '...' : 'Check'}
                  </button>
                </div>
                {pincodeResult === 'available' && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-300 text-sm mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} /> Great! RIVO is available in {areaDetails?.areaName ? `${areaDetails.areaName}, ${areaDetails.city}` : 'your area'}.
                  </motion.p>
                )}
                {pincodeResult === 'unavailable' && (
                  <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-amber-300 text-sm mt-2">
                    We're expanding soon! We'll notify you when we launch here.
                  </motion.p>
                )}
              </motion.div>
            </motion.div>

            {/* Right — Decorative UI mock */}
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="hidden lg:block relative">
              <div className="relative w-full max-w-sm mx-auto">
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 text-white">
                    <p className="text-xs font-semibold opacity-70 mb-1">TODAY'S BOOKING</p>
                    <h3 className="text-lg font-bold">Nurse Home Visit</h3>
                    <p className="text-sm opacity-80 mt-0.5">10:30 AM · Your Home</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { avatar: 'SS', name: 'Siddhi S.', role: 'Registered Nurse', rating: '4.9', color: 'bg-blue-400' },
                      { avatar: 'AM', name: 'Arjun M.', role: 'Physiotherapist', rating: '5.0', color: 'bg-emerald-400' },
                    ].map(p => (
                      <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>{p.avatar}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">{p.name} <Shield size={12} className="text-emerald-500" /></p>
                          <p className="text-xs text-slate-500">{p.role}</p>
                        </div>
                        <div className="text-xs font-bold text-amber-500">⭐ {p.rating}</div>
                      </div>
                    ))}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-600 font-semibold">✅ Arrival confirmed — 8 min away</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge 1 */}
                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2">
                  <span className="text-emerald-500 text-lg">✅</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Background Verified</p>
                    <p className="text-[10px] text-slate-400">All providers</p>
                  </div>
                </motion.div>

                {/* Floating badge 2 */}
                <motion.div
                  animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">5,000+ Bookings</p>
                    <p className="text-[10px] text-slate-400">This month</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <FadeSection>
        <section className="bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center text-center gap-1">
                  <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-1">{s.icon}</div>
                  <span className="text-2xl font-bold text-slate-900">{s.value}</span>
                  <span className="text-xs text-slate-500 font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── SERVICES ─────────────────────────────────────── */}
      <section id="services" className="py-20 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Professional Care for Every Need</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">From daily nursing to specialized therapy — RIVO brings certified professionals to your home.</p>
          </FadeSection>

          <motion.div
            ref={useRef(null)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc) => (
              <motion.div key={svc.name} variants={fadeUp}
                whileHover={{ scale: 1.04, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`group bg-white rounded-2xl p-6 border-2 border-slate-100 ${svc.border} shadow-sm hover:shadow-xl transition-all duration-300 cursor-default`}>
                <div className={`w-14 h-14 ${svc.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {svc.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{svc.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{svc.desc}</p>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{svc.price}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeSection className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">Built on Trust</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Families Choose RIVO</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">We set the highest standard of safety, reliability, and compassion in home healthcare.</p>
          </FadeSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustPoints.map((pt) => (
              <motion.div key={pt.title} variants={fadeUp}
                whileHover={{ y: -6 }}
                className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className={`w-12 h-12 ${pt.color} rounded-xl flex items-center justify-center mb-4`}>{pt.icon}</div>
                <h3 className="font-bold text-white mb-2">{pt.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{pt.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Get Care in 3 Easy Steps</h2>
            <p className="text-slate-500 text-lg">From search to doorstep — it takes less than 5 minutes.</p>
          </FadeSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[17%] right-[17%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp}
                className="flex flex-col items-center text-center relative z-10">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center mb-6 shadow-xl shadow-blue-200">
                  {step.icon}
                  <span className="text-xs font-bold mt-1 opacity-70">{step.num}</span>
                </motion.div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Real Experiences</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Trusted by Thousands of Families</h2>
            <p className="text-slate-500 text-lg">See what our patients and their families have to say.</p>
          </FadeSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}
                whileHover={{ y: -5, scale: 1.01 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${t.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <FadeSection className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Book Trusted Care Today
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Join 5,000+ families who trust RIVO for safe, professional, and affordable home healthcare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/30 hover:-translate-y-0.5 duration-200 text-base">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
              Already have an account?
            </Link>
          </div>
        </FadeSection>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <Footer />

      {/* ── FLOATING WHATSAPP ────────────────────────────── */}
      <motion.a
        href="https://wa.me/919999999999?text=Hi%2C%20I%20need%20home%20healthcare%20assistance."
        target="_blank"
        rel="noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        title="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center transition-colors duration-200">
        <MessageCircle className="w-7 h-7" />
      </motion.a>

      {/* ── MOBILE STICKY BOOK NOW ───────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden px-4 pb-4 pt-2 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-xl">
        <Link to="/register"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold w-full py-4 rounded-2xl transition-colors shadow-lg shadow-blue-200 text-base">
          <Phone size={18} /> Book Now
        </Link>
      </div>

    </div>
  );
}
