import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight, Star, Shield, Plus, Minus, Phone, ArrowRight, MapPin,
  Stethoscope, FlaskConical, Activity, HeartHandshake, Siren, Truck, UserRoundPlus, HeartPulse, Accessibility, HandHelping
} from 'lucide-react';
import Footer from '../components/layout/Footer';
import { serviceIcons } from '../constants/serviceIcons';

// ─── Animation Wrapper ───────────────────────────────────────
function FadeSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const services = [
  { id: 'nursing', bgClass: 'bg-blue-50/50', icon: serviceIcons.nursing, title: 'Home Nursing', desc: 'Trained nurses for post-surgery, wound care & injections.' },
  { id: 'doctor', bgClass: 'bg-indigo-50/50', icon: serviceIcons.doctor, title: 'Doctor Visit', desc: 'Consult experienced doctors at home for illness & follow-up.' },
  { id: 'physio', bgClass: 'bg-emerald-50/50', icon: serviceIcons.physio, title: 'Physiotherapy', desc: 'Pain management, mobility training and rehabilitation.' },
  { id: 'lab', bgClass: 'bg-violet-50/50', icon: serviceIcons.lab, title: 'Lab Tests', desc: 'Book lab tests at home with accurate reports & fast collection.' },
  { id: 'elder', bgClass: 'bg-orange-50/50', icon: serviceIcons.elder, title: 'Elder Care', desc: 'Compassionate elder care services including daily assistance.' },
  { id: 'attendant', bgClass: 'bg-pink-50/50', icon: serviceIcons.attendant, title: 'Caregiver', desc: 'Trained attendants for patient care, elder & newborn care.' },
  { id: 'icu', bgClass: 'bg-cyan-50/50', icon: serviceIcons.icu, title: 'ICU at Home', desc: 'Advanced ICU setup and critical care by expert medical team.' },
  { id: 'ambulance', bgClass: 'bg-sky-50/50', icon: serviceIcons.ambulance, title: 'Ambulance', desc: 'Quick and reliable transport services for medical needs.' },
];

const steps = [
  { num: '1', title: 'Book Request', desc: 'Choose your service and schedule a convenient time.', icon: <CalendarIcon /> },
  { num: '2', title: 'Expert Assigned', desc: 'We assign the best care expert as per your requirements.', icon: <UserAssignIcon /> },
  { num: '3', title: 'Care Begins at Home', desc: 'Our expert arrives on time and care begins at your home.', icon: <HomeHeartIcon /> },
];

const testimonials = [
  { text: "The nurse was very professional and took great care of my mother during her recovery. Highly recommended!", name: "Anita Sharma", location: "Delhi", avatar: "https://i.pravatar.cc/150?img=5", rating: 5 },
  { text: "Rivo Care's physiotherapy service helped my father recover faster than we expected.", name: "Rahul Mehta", location: "Gurgaon", avatar: "https://i.pravatar.cc/150?img=11", rating: 5 },
  { text: "Very reliable and compassionate team. They truly care for your loved ones.", name: "Sneha Iyer", location: "Noida", avatar: "https://i.pravatar.cc/150?img=9", rating: 5 },
];

const faqs = [
  { q: 'How do I book a service?', a: 'You can book a service directly through our website by clicking "Book Now" or by calling our 24/7 support line.' },
  { q: 'Are your caregivers verified?', a: 'Yes, all our professionals undergo strict background checks and medical credential verification.' },
  { q: 'What areas do you serve?', a: 'We currently serve major cities including Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Pune, Kolkata, and Ahmedabad.' },
  { q: 'Is there 24/7 support available?', a: 'Absolutely. Our care coordination team is available round the clock.' },
  { q: 'Can I change or reschedule a booking?', a: 'Yes, you can easily manage your bookings through your patient dashboard.' },
  { q: 'Do you provide medical equipment?', a: 'We arrange necessary medical equipment for services like ICU at home through our partners.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden text-slate-800">

      {/* ── HERO SECTION ── */}
      <section className="relative bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] overflow-hidden pt-4 pb-16 lg:pt-8 lg:pb-24">
        {/* Decorative Grid Background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12">

          {/* Left Content */}
          <div className="w-full lg:w-[45%]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-8 border border-primary-100">
                <Shield size={14} className="text-primary-500" /> India's Trusted Home Healthcare Partner
              </div>

              <h1 className="font-poppins text-[44px] sm:text-[56px] lg:text-[64px] font-black leading-[1.05] tracking-tight text-[#1E293B] mb-6">
                Care, Reimagined at <span className="text-[#2563EB]">Home</span>
              </h1>

              <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
                Professional nursing, elderly care, doctor visits and recovery support delivered to your doorstep.
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-6 mb-10 pb-10 border-b border-slate-200">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-2">
                    <UserGroupIcon />
                  </div>
                  <p className="font-bold text-[#1E293B] text-xl">10,000+</p>
                  <p className="text-xs text-slate-500 font-medium">Families Served</p>
                </div>
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-2">
                    <ClockOutlineIcon />
                  </div>
                  <p className="font-bold text-[#1E293B] text-xl">24/7</p>
                  <p className="text-xs text-slate-500 font-medium">Support</p>
                </div>
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-2">
                    <DoctorIcon />
                  </div>
                  <p className="font-bold text-[#1E293B] text-xl">500+</p>
                  <p className="text-xs text-slate-500 font-medium">Care Experts</p>
                </div>
                <div className="h-12 w-px bg-slate-200 hidden lg:block" />
                <div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-600 mb-2">
                    <StarOutlineIcon />
                  </div>
                  <p className="font-bold text-[#1E293B] text-xl">4.8/5</p>
                  <p className="text-xs text-slate-500 font-medium">Customer Rating</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-800 transition-all shadow-xl shadow-primary-500/20 text-base">
                  Book Consultation <ChevronRight size={18} />
                </Link>
                <a href="#services" className="inline-flex items-center justify-center gap-2 border-2 border-[#2563EB] text-[#2563EB] font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-all text-base">
                  Explore Services <ChevronRight size={18} />
                </a>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="user" />
                  <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="user" />
                  <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="user" />
                  <img src="https://i.pravatar.cc/100?img=4" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="user" />
                </div>
                <p className="text-sm text-slate-600 font-medium text-left">
                  Trusted by <span className="font-bold text-slate-900">10,000+</span> families across Delhi NCR
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Image */}
          <div className="w-full lg:w-[55%] relative">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Hero Image */}
                <img src="/images/hero-nurse.png" alt="Nurse with elderly patient" className="w-full h-auto object-cover" />

                {/* Floating Badge */}
                <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
                  <div>
                    <p className="font-bold text-[#1E293B] leading-tight mb-1 text-sm">Background Verified</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-none">Care Professionals</p>
                  </div>
                  <div className="w-10 h-10 bg-[#22c55e] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <ShieldCheckIconSmall className="text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ── COMPREHENSIVE CARE AT HOME ── */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <FadeSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4 border border-primary-100">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span> Our Services
            </div>
            <h2 className="font-poppins text-[32px] sm:text-[40px] font-black text-[#1E293B] mb-4 tracking-tight">Comprehensive Care at Home</h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">From everyday support to advanced medical care, we bring hospital-quality services to your home.</p>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {services.map((svc, i) => (
              <FadeSection key={i} delay={i * 0.05}>
                <Link to="/register" className="group block h-full bg-white border border-slate-100 rounded-3xl p-6 md:p-7 shadow-sm hover:shadow-xl hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-1 flex flex-col min-h-[280px]">
                  <img 
                    src={svc.icon} 
                    alt={svc.title} 
                    className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4 group-hover:scale-[1.08] transition-transform duration-300 block"
                    loading="lazy"
                  />
                  <h3 className="font-poppins font-bold text-[#1E293B] text-xl mb-3">{svc.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-7 mb-6 font-medium line-clamp-2">{svc.desc}</p>
                  <p className="text-sm font-bold text-[#2563EB] flex items-center gap-2 mt-auto group-hover:translate-x-1 transition-transform duration-300">
                    Learn More <ArrowRight size={18} />
                  </p>
                </Link>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE RIVO CARE ── */}
      <section className="py-24 bg-[#f8fafc]">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <FadeSection>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-6 border border-primary-100">
                <CheckCircleOutlineIcon /> Why Choose Rivo Care
              </div>
              <h2 className="font-poppins text-[36px] sm:text-[48px] font-black text-[#1E293B] leading-[1.1] mb-6 tracking-tight">
                Trusted Care.<br />Every Time.
              </h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">
                We combine technology, compassion and clinical excellence to deliver the best care experience.
              </p>

              <div className="space-y-4">
                {['NABH aligned practices', 'Verified & Trained Care Experts', 'Transparent Pricing', '24/7 Customer Support'].map((pt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
                      <CheckIconSmall />
                    </div>
                    <span className="text-[#1E293B] font-semibold">{pt}</span>
                  </div>
                ))}
              </div>
            </FadeSection>

            {/* Right - Grid */}
            <FadeSection delay={0.2} className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { val: '500+', label: 'Care Experts', icon: <DoctorIcon /> },
                { val: '10,000+', label: 'Families Served', icon: <UserGroupIcon /> },
                { val: '98%', label: 'Satisfaction Rate', icon: <CheckCircleOutlineIcon /> },
                { val: '4.8/5', label: 'Google Rating', icon: <StarOutlineIcon /> }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 text-center shadow-lg shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-transform">
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#2563EB]">
                    {stat.icon}
                  </div>
                  <h3 className="font-poppins text-3xl font-black text-[#1E293B] mb-1">{stat.val}</h3>
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                </div>
              ))}
            </FadeSection>

          </div>
        </div>
      </section>

      {/* ── HEALTHCARE IN 3 SIMPLE STEPS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <FadeSection className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4 border border-primary-100">
              How It Works
            </div>
            <h2 className="font-poppins text-[32px] sm:text-[40px] font-black text-[#1E293B] mb-4 tracking-tight">Healthcare in 3 Simple Steps</h2>
          </FadeSection>

          <div className="relative max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-primary-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {steps.map((step, i) => (
                <FadeSection key={i} delay={i * 0.15} className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-white rounded-full border border-primary-100 flex items-center justify-center text-[#2563EB] shadow-xl shadow-blue-100">
                      {step.icon}
                    </div>
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="font-poppins text-xl font-bold text-[#1E293B] mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[250px]">{step.desc}</p>
                </FadeSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STORIES OF TRUST & CARE ── */}
      <section className="py-24 bg-[#f8fafc] border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <FadeSection className="mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4 border border-primary-100">
              <CheckCircleOutlineIcon /> What Families Say
            </div>
            <h2 className="font-poppins text-[32px] sm:text-[40px] font-black text-[#1E293B] tracking-tight">Stories of Trust & Care</h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeSection key={i} delay={i * 0.1} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <QuoteIcon className="text-blue-100 mb-6 w-10 h-10" />
                <p className="text-slate-600 italic leading-relaxed mb-8 font-medium">"{t.text}"</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <p className="font-bold text-[#1E293B] text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{t.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={14} className={idx < t.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
          </div>
        </div>
      </section>

      {/* ── DARK BLUE TRUST BANNER ── */}
      <section className="bg-[#1e293b] text-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
          <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {[
              { icon: <ShieldCheckIcon />, title: "Verified Care Experts", desc: "All caregivers are background verified and trained" },
              { icon: <SirenIcon />, title: "24/7 Support", desc: "Round-the-clock assistance for all your care needs" },
              { icon: <SparklesIcon />, title: "Hygiene & Safety", desc: "Strict hygiene protocols for your safety" },
              { icon: <TagIcon />, title: "Transparent Pricing", desc: "No hidden charges. What you see is what you pay." },
              { icon: <LockIcon />, title: "Data Privacy", desc: "Your data is safe and protected" }
            ].map((item, i) => (
              <div key={i} className="flex-1 min-w-[200px] flex items-start gap-4 pt-6 md:pt-0 md:px-4 first:pl-0 last:pr-0">
                <div className="text-[#38bdf8] shrink-0 opacity-80">{item.icon}</div>
                <div>
                  <h4 className="font-poppins font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEED URGENT CARE TODAY BANNER ── */}
      <section className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="relative rounded-[2rem] bg-gradient-to-r from-[#2563EB] to-blue-600 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between p-10 lg:p-14">
            <div className="relative z-10 w-full md:w-2/3">
              <h2 className="font-poppins text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Need Professional Care Today?</h2>
              <p className="text-blue-100 text-lg mb-8 font-medium">Get reliable assistance from our care experts at home.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-[#2563EB] font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                  Book Now <ArrowRight size={18} />
                </Link>
                <a href="tel:+919910638995" className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white font-bold px-8 py-4 rounded-xl border border-primary-500 hover:bg-primary-800 transition-colors">
                  Call Now <Phone size={18} />
                </a>
              </div>
            </div>
            {/* Absolute positioned doctor image on the right */}
            <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:block">
              <img src="/images/doctor-banner.png" alt="Doctor" className="absolute bottom-0 right-10 h-[120%] object-contain object-bottom" />
            </div>
          </div>
        </div>
      </section>



      {/* ── FAQ ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-6 border border-primary-100">
            FAQs
          </div>
          <h2 className="font-poppins text-3xl font-black text-[#1E293B] mb-10 tracking-tight">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-[#f8fafc] transition-colors hover:bg-slate-50">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-[#1E293B] pr-4">{faq.q}</span>
                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors ${openFaq === i ? 'bg-[#2563EB] text-white' : 'bg-primary-100 text-[#2563EB]'}`}>
                    {openFaq === i ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 font-medium text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Internal SVG Icons to match mockup
function UserGroupIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>; }
function ClockOutlineIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>; }
function DoctorIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6"></path><path d="M22 11h-6"></path></svg>; }
function StarOutlineIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>; }
function CheckCircleOutlineIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>; }
function CheckIconSmall() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>; }
function CalendarIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>; }
function UserAssignIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>; }
function HomeHeartIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>; }
function QuoteIcon(props) { return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>; }
function ShieldCheckIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>; }
function SirenIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M5 5l1.5 1.5"></path><path d="M17.5 17.5L19 19"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M5 19l1.5-1.5"></path><path d="M17.5 6.5L19 5"></path><circle cx="12" cy="12" r="5"></circle></svg>; }
function SparklesIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path></svg>; }
function SvcNurseIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M5 20v-5c0-3 3-5 7-5s7 2 7 5v5" />
      <path d="M9 10c0-2.5 1-3.5 3-3.5s3 1 3 3.5" />
      <path d="M12 12v4" stroke="#10B981" />
      <path d="M10 14h4" stroke="#10B981" />
    </svg>
  );
}

function TagIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>; }
function LockIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>; }

function ShieldCheckIconSmall(props) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>; }
