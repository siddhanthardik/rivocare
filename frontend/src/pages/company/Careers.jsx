import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Heart, TrendingUp, Users, Gift, Send } from 'lucide-react';

const whyWork = [
  { icon: Heart, title: 'Meaningful Impact', desc: 'Make a real difference in people\'s lives every single day by providing quality care.' },
  { icon: TrendingUp, title: 'Growth Opportunities', desc: 'Fast-track your career with continuous learning, training, and advancement.' },
  { icon: Users, title: 'Supportive Culture', desc: 'Work with a team that cares about you as much as the patients we serve.' },
  { icon: Gift, title: 'Employee Benefits', desc: 'Competitive pay, flexible schedules, insurance and performance bonuses.' },
];

const positions = [
  { title: 'Staff Nurse', type: 'Full-Time', location: 'Multiple locations' },
  { title: 'Physiotherapist', type: 'Full-Time', location: 'Multiple locations' },
  { title: 'Caregiver / Attendant', type: 'Full-Time / Part-Time', location: 'Multiple locations' },
  { title: 'Business Development Executive', type: 'Full-Time', location: 'Multiple locations' },
  { title: 'Customer Support Executive', type: 'Full-Time', location: 'Delhi / Remote' },
];

export default function Careers() {
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium">Careers</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E293B] to-[#1e3a6e] py-16">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Poppins,sans-serif' }}>
              Build Your Career<br />with <span className="text-blue-400">Rivo Care</span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mb-6">
              We are passionate about revolutionizing home healthcare in India. Make a difference in people's lives every day.
            </p>
            <a href="#positions" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
              View Openings <ArrowRight size={16} />
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src="/images/careers-team.png" alt="Rivo Care Team" className="w-full h-72 object-cover" />
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center" style={{ fontFamily: 'Poppins,sans-serif' }}>Why Work With Us?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyWork.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2 text-sm" style={{ fontFamily: 'Poppins,sans-serif' }}>{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Poppins,sans-serif' }}>Open Positions</h2>
          <div className="space-y-4">
            {positions.map((pos) => (
              <div key={pos.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
                <div>
                  <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Poppins,sans-serif' }}>{pos.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">{pos.type} · {pos.location}</p>
                </div>
                <a
                  href="mailto:careers@rivocare.in?subject=Application for {pos.title}"
                  className="shrink-0 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                >
                  Apply Now <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Drop */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Poppins,sans-serif' }}>Don't see the right role?</h2>
            <p className="text-blue-100 text-sm">Share your resume and we'll reach out when a match comes up.</p>
          </div>
          <a
            href="mailto:careers@rivocare.in?subject=General Application"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition text-sm"
          >
            <Send size={15} /> Submit Resume
          </a>
        </div>
      </section>

    </div>
  );
}
