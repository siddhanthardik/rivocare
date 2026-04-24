import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Clock, Activity, ArrowRight, CheckCircle2, Award, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Verified Professionals', value: '1,000+' },
  { label: 'Cities Served', value: '15+' },
  { label: 'Patient Satisfaction', value: '98%' },
  { label: 'Support Availability', value: '24/7' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Uncompromising Safety',
    text: 'Every provider undergoes stringent background checks and medical credential verification. Your family\'s security is the foundation of our platform.',
  },
  {
    icon: Heart,
    title: 'Empathetic Care',
    text: 'We understand that inviting someone into your home requires immense trust. Our matching algorithms prioritize compassion alongside clinical excellence.',
  },
  {
    icon: Clock,
    title: 'Time-Critical Reliability',
    text: 'Healthcare needs don\'t wait. We engineered our dispatch systems to minimize wait times and provide real-time tracking for ultimate peace of mind.',
  },
];

const pillars = [
  { title: 'Clinical Excellence', text: 'Partnering only with certified nurses, expert physiotherapists, and licensed physicians.' },
  { title: 'Absolute Transparency', text: 'Clear, upfront pricing with zero hidden fees. You see exactly what you pay for before confirming.' },
  { title: 'Continuous Support', text: 'A dedicated patient coordination team available around the clock to assist with your ongoing care.' },
  { title: 'Seamless Technology', text: 'A frictionless app experience for booking, tracking, and communicating with your care team.' },
];

export default function AboutUs() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-slate-950 pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-blue-400 uppercase mb-6">
              <Activity size={14} /> Our Mission
            </span>
            <h1 className="max-w-4xl mx-auto text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Bringing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">world-class healthcare</span> to your doorstep.
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-lg leading-relaxed text-slate-300">
              RIVO is redefining home healthcare by bridging the gap between families and top-tier medical professionals through trust, transparency, and technology.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="relative -mt-16 z-10 mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 divide-x divide-slate-100">
            {stats.map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                key={stat.label} 
                className="text-center px-4"
              >
                <p className="text-4xl font-black tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">The philosophy driving our care</h2>
          <p className="mt-4 text-lg text-slate-600">We don't just facilitate bookings; we engineer peace of mind for families during their most vulnerable moments.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                key={value.title} 
                className="group rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform" />
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Icon size={26} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{value.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-slate-600">{value.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── OUR COMMITMENT SPLIT ── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-[2.5rem] bg-slate-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />
          
          <div className="grid lg:grid-cols-2 relative z-10">
            <div className="p-12 lg:p-16 flex flex-col justify-center">
              <span className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">
                <Award size={16} /> Our Standard
              </span>
              <h2 className="text-3xl font-black text-white sm:text-4xl leading-tight mb-6">
                Elevating the standard of home healthcare delivery.
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                RIVO was built on a simple premise: acquiring high-quality medical care at home should be as seamless and reliable as requesting a premium ride. We handle the heavy lifting of vetting and coordination so you can focus on healing.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="flex gap-3">
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">{pillar.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{pillar.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center bg-slate-800/50 p-12">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center backdrop-blur-sm p-8">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                 <div className="text-center space-y-6 relative z-10">
                   <div className="w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                     <Users size={36} className="text-white" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-bold text-white mb-2">Join the Revolution</h3>
                     <p className="text-slate-300 text-sm">We are rapidly expanding our network of elite care providers.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4">Ready to experience better care?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Create an account today to explore services, view pricing, and book your first verified provider.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white transition hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-0.5"
            >
              Book a Service
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/contact-us"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-8 text-base font-bold text-slate-900 transition hover:bg-slate-200 border border-slate-200"
            >
              Speak with our team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
