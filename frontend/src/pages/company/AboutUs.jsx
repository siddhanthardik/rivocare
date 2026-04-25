import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Award, CheckCircle2, ChevronRight } from 'lucide-react';

const stats = [
  { value: '10,000+', label: 'Families Served' },
  { value: '500+', label: 'Care Experts' },
  { value: '24/7', label: 'Support' },
  { value: '98%', label: 'Satisfaction' },
];

const trustPillars = [
  { icon: ShieldCheck, title: 'Verified & Trained', desc: 'All professionals are background verified and medically trained.' },
  { icon: ShieldCheck, title: 'Safety & Hygiene First', desc: 'Strict safety protocols for infection control and hygiene.' },
  { icon: CheckCircle2, title: 'Personalized Care Plans', desc: 'Customized care plans tailored to each patient\'s needs.' },
  { icon: Award, title: 'Transparent Pricing', desc: 'No hidden fees. Upfront pricing for all services.' },
  { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock support from our patient coordination team.' },
];





export default function AboutUs() {
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium">About Us</span>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight" style={{fontFamily:'Poppins,sans-serif'}}>
            About <span className="text-blue-600">Rivo Care</span>
          </h1>
          <p className="text-slate-600 text-base leading-relaxed mb-4">
            Rivo Care is India's trusted home healthcare partner delivering compassionate, professional, and affordable care to your doorstep. We combine technology, compassion and clinical excellence to ensure patients receive comfort and care within their own home.
          </p>
          <p className="text-slate-500 text-sm leading-relaxed">
            Our experienced and verified nursing professionals provide expert medical care for post-surgery recovery, physiotherapy, wound care and more — right at your home in Delhi NCR.
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/book" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
              Book a Service <ChevronRight size={16} />
            </Link>
            <Link to="/contact-us" className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-sm">
              Contact Us
            </Link>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <img src="/images/about-hero.png" alt="Rivo Care — Nurse with patient" className="w-full h-80 object-cover" />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-10 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-blue-600" style={{fontFamily:'Poppins,sans-serif'}}>{s.value}</p>
              <p className="text-slate-600 text-sm mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <img src="/images/service-eldercare.png" alt="Mission" className="rounded-2xl shadow-lg w-full h-72 object-cover" />
        </div>
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{fontFamily:'Poppins,sans-serif'}}>Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
              To provide quality home healthcare that is accessible and affordable for every family at home. We believe every patient deserves the dignity of recovering in the comfort of their own home.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3" style={{fontFamily:'Poppins,sans-serif'}}>Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">
              To become the most trusted home healthcare platform in India — where technology and human compassion work together so that every home can have hospital-quality healthcare.
            </p>
          </div>
        </div>
      </section>



      {/* Why Families Trust Rivo */}
      <section className="bg-[#1E293B] py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-10 text-center" style={{fontFamily:'Poppins,sans-serif'}}>Why Families Trust Rivo Care</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {trustPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon size={22} className="text-blue-400" />
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1">{p.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Banner */}
      <section className="bg-blue-600 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{fontFamily:'Poppins,sans-serif'}}>Ready to Experience Better Care at Home?</h2>
          <p className="text-blue-100 mb-8 text-base">Book a verified care professional today and experience the Rivo difference.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition text-sm">
              Book a Service <ChevronRight size={16} />
            </Link>
            <Link to="/contact-us" className="inline-flex items-center justify-center gap-2 border border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition text-sm">
              Talk to an Expert
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
