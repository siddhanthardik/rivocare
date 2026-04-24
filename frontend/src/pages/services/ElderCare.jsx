import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, HeartHandshake, Smile, ShieldCheck } from 'lucide-react';

const offerings = [
  'Assistance with Activities of Daily Living (ADL)',
  'Medication Reminders & Management',
  'Mobility Assistance & Fall Prevention',
  'Companionship & Cognitive Engagement',
  'Meal Preparation & Light Support'
];

export default function ElderCare() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="relative overflow-hidden bg-slate-950 pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-blue-400 uppercase mb-6">
              <HeartHandshake size={14} /> Compassionate Care
            </span>
            <h1 className="max-w-4xl mx-auto text-5xl font-black tracking-tight text-white sm:text-6xl">
              Dedicated <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Elder Care</span> at Home.
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-lg leading-relaxed text-slate-300">
              Give your parents the comfort of aging in their own home. Our trained caregivers provide daily assistance, companionship, and safety monitoring while you're away.
            </p>
            <div className="mt-10 flex justify-center">
              <Link to="/register" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-base font-bold text-white transition hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-0.5">
                Find a Caregiver <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6">Dignity, independence, and peace of mind.</h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              We match you with caregivers who are not only trained in elderly assistance but also possess the empathy and patience required to build a meaningful bond with your loved ones.
            </p>
            <div className="space-y-4">
              {offerings.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vetted for Trust</h3>
              <p className="text-slate-600 leading-relaxed">Extensive background checks and psychological profiling ensure only the safest personnel enter your home.</p>
            </div>
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 sm:translate-y-8">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-6">
                <Smile size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Companionship</h3>
              <p className="text-slate-600 leading-relaxed">Mental well-being is as important as physical health. Our caregivers engage elders in activities and conversation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
