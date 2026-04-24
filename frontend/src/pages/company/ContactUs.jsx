import { Mail, MapPin, MessageCircle, Phone, Clock3, ArrowRight, LifeBuoy, FileText, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const contactCards = [
  {
    icon: Phone,
    title: 'Priority Phone Support',
    detail: '+91 98765 43210',
    note: 'For urgent booking coordination, real-time tracking, and immediate assistance.',
    href: 'tel:+919876543210',
    color: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Concierge',
    detail: 'Chat instantly',
    note: 'The fastest way to get answers, modify bookings, or request service details.',
    href: 'https://wa.me/919876543210',
    color: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50 text-blue-600 border-blue-100'
  },
  {
    icon: Mail,
    title: 'Email Correspondence',
    detail: 'care@rivocare.in',
    note: 'For account queries, provider onboarding, legal requests, and billing support.',
    href: 'mailto:care@rivocare.in',
    color: 'from-violet-400 to-violet-600',
    bg: 'bg-violet-50 text-violet-600 border-violet-100'
  },
];

const faqs = [
  {
    q: "How fast can a provider reach me?",
    a: "In serviceable areas, providers can arrive in as little as 60 minutes for urgent nursing or doctor visits, depending on real-time availability."
  },
  {
    q: "Are the healthcare providers verified?",
    a: "Absolutely. 100% of our providers undergo strict KYC, medical credential verification, and background checks before they can accept bookings."
  },
  {
    q: "How do I cancel or reschedule?",
    a: "You can modify your bookings directly from your Patient Dashboard. Cancellations made 2 hours prior to the slot are fully refunded."
  }
];

export default function ContactUs() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-slate-950 pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />
        
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 mb-8 backdrop-blur-md">
               <LifeBuoy size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-6">
              We're here when you <br className="hidden sm:block" /> need us most.
            </h1>
            <p className="max-w-2xl mx-auto text-lg leading-relaxed text-slate-300">
              Healthcare requires empathy and urgency. Our dedicated support concierge is ready to assist you with bookings, provider coordination, and account management.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className="relative -mt-16 z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {contactCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                key={card.title}
                href={card.href}
                target={card.href.startsWith('http') ? '_blank' : undefined}
                rel={card.href.startsWith('http') ? 'noreferrer' : undefined}
                className="group relative rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-200 transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden block"
              >
                {/* Decorative background gradient */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`} />
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
                
                <div className="relative z-10">
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${card.bg}`}>
                    <Icon size={26} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2">{card.title}</h2>
                  <p className="text-lg font-bold text-slate-700 mb-4">{card.detail}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{card.note}</p>
                  
                  <div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Connect Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* ── INFO SPLIT SECTION ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* FAQ Area */}
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs mb-4">
              <HelpCircle size={16} /> Quick Answers
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-8">Frequently Asked</h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Details Area */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-900 p-10 text-white shadow-xl">
              <h3 className="text-2xl font-bold mb-8">Headquarters</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                     <MapPin size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Delhi NCR</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Sector 62, Noida<br />Uttar Pradesh 201309<br />India
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                     <Clock3 size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1">Operating Hours</p>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Support: 24/7 for urgent bookings.<br />
                      Corporate Office: Mon - Sat, 9 AM - 7 PM.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
                   <FileText size={24} />
                 </div>
                 <div>
                   <p className="font-bold text-slate-900">Legal & Privacy</p>
                   <p className="text-slate-500 text-sm">Review our platform terms</p>
                 </div>
              </div>
              <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
