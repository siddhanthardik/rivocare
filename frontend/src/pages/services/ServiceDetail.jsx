import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, ArrowRight, Phone } from 'lucide-react';

// Reusable service detail page template
function ServiceDetailPage({ breadcrumb, title, subtitle, imageSrc, offerings, benefits, howItWorks, whoCanBenefit, ctaPath }) {
  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={14} />
          <Link to="/services" className="hover:text-blue-600">Services</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium">{breadcrumb}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight" style={{ fontFamily: 'Poppins,sans-serif' }}>{title}</h1>
          <p className="text-slate-500 text-base leading-relaxed mb-6">{subtitle}</p>
          <div className="space-y-3 mb-8">
            {offerings.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <Link to={ctaPath} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
              Book Now <ArrowRight size={16} />
            </Link>
            <Link to="/contact-us" className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-sm">
              <Phone size={15} /> Talk to Expert
            </Link>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <img src={imageSrc} alt={title} className="w-full h-80 object-cover" />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center" style={{ fontFamily: 'Poppins,sans-serif' }}>How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="bg-white rounded-2xl p-6 shadow-sm text-center border border-slate-100">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-4">{i + 1}</div>
                <h3 className="font-bold text-slate-800 mb-2" style={{ fontFamily: 'Poppins,sans-serif' }}>{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose + Who Can Benefit */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-12 items-start">
        {/* Why Choose */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Poppins,sans-serif' }}>Why Choose Our {breadcrumb}?</h2>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Who Can Benefit */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Poppins,sans-serif' }}>Who Can Benefit?</h2>
          <div className="grid grid-cols-2 gap-4">
            {whoCanBenefit.map((p) => (
              <div key={p} className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-slate-700 text-sm font-medium">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Poppins,sans-serif' }}>Need {breadcrumb}?</h2>
            <p className="text-blue-100 text-sm">We'll send a verified expert to your doorstep.</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Link to={ctaPath} className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition text-sm">
              Book Now
            </Link>
            <Link to="/contact-us" className="inline-flex items-center gap-2 border border-white text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition text-sm">
              Talk to Expert
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

// ─── NURSING CARE ───────────────────────────────────────────────
export function NursingCare() {
  return (
    <ServiceDetailPage
      breadcrumb="Home Nursing"
      title="Home Nursing"
      subtitle="Professional nursing care at the comfort of your home. Our experienced and verified home nurses provide expert medical care for post-surgery recovery, wound care, injections, IV drips, and more."
      imageSrc="/images/service-nursing.png"
      offerings={[
        'Post-surgical & wound care management',
        'IV drips & injections at home',
        'Vital monitoring & chronic disease management',
        'Elderly care support',
        '24/7 nursing support',
      ]}
      howItWorks={[
        { title: 'Book a Service', desc: 'Choose your service and schedule a convenient time.' },
        { title: 'Nurse Assigned', desc: 'We assign a qualified nurse as per your requirements.' },
        { title: 'Care Begins', desc: 'Our nurse arrives on time and care begins at your home.' },
      ]}
      benefits={[
        'Qualified & experienced nurses',
        'Background verified professionals',
        'Personalized care plans',
        'Safe, hygienic & reliable',
        '24/7 support',
      ]}
      whoCanBenefit={['Post-surgery patients', 'Chronic illness patients', 'Elderly individuals', 'Bedridden patients']}
      ctaPath="/register"
    />
  );
}

// ─── PHYSIOTHERAPY ───────────────────────────────────────────────
export function Physiotherapy() {
  return (
    <ServiceDetailPage
      breadcrumb="Physiotherapy"
      title="Physiotherapy at Home"
      subtitle="Expert physiotherapy sessions at your doorstep. Our certified physiotherapists design personalized rehabilitation programs to help you recover faster, manage pain, and regain mobility."
      imageSrc="/images/service-physio.png"
      offerings={[
        'Post-surgical rehabilitation',
        'Orthopaedic & sports injury recovery',
        'Neurological physiotherapy',
        'Pain management & mobility training',
        'Elderly mobility & fall prevention',
      ]}
      howItWorks={[
        { title: 'Book a Session', desc: 'Choose physiotherapy and schedule a session at home.' },
        { title: 'Physio Assigned', desc: 'A certified physiotherapist is assigned based on your condition.' },
        { title: 'Therapy Begins', desc: 'Personalized therapy sessions begin at your home.' },
      ]}
      benefits={[
        'Certified & experienced physiotherapists',
        'Customized rehab programs',
        'All equipment brought to your home',
        'Regular progress tracking',
        '24/7 care support',
      ]}
      whoCanBenefit={['Post-surgery patients', 'Sports injury patients', 'Elderly individuals', 'Neurological patients']}
      ctaPath="/register"
    />
  );
}

// ─── DOCTOR AT HOME ───────────────────────────────────────────────
export function DoctorAtHome() {
  return (
    <ServiceDetailPage
      breadcrumb="Doctor at Home"
      title="Doctor at Home"
      subtitle="Consult experienced doctors without leaving your home. Our qualified doctors visit you for diagnosis, treatment, follow-ups, and health check-ups — all at your doorstep in Delhi NCR."
      imageSrc="/images/service-doctor.png"
      offerings={[
        'General physician consultations',
        'Follow-up visits & health check-ups',
        'Prescription management',
        'Elderly & bedridden patient visits',
        'Fever, infections & common illness treatment',
      ]}
      howItWorks={[
        { title: 'Book a Visit', desc: 'Select doctor consultation and choose a convenient slot.' },
        { title: 'Doctor Assigned', desc: 'We assign an experienced doctor matching your needs.' },
        { title: 'Visit at Home', desc: 'Doctor arrives on time for diagnosis and treatment.' },
      ]}
      benefits={[
        'Qualified & licensed doctors',
        'Background verified professionals',
        'Convenient flexible timings',
        'Prescription provided post consultation',
        '24/7 patient support',
      ]}
      whoCanBenefit={['Elderly patients', 'Bedridden patients', 'Busy professionals', 'Post-surgery patients']}
      ctaPath="/register"
    />
  );
}

// ─── ELDER CARE ───────────────────────────────────────────────
export function ElderCare() {
  return (
    <ServiceDetailPage
      breadcrumb="Elder Care"
      title="Elder Care at Home"
      subtitle="Compassionate, round-the-clock elder care from trained professionals. We help your loved ones maintain dignity, independence, and comfort in their own home."
      imageSrc="/images/service-eldercare.png"
      offerings={[
        'Daily personal care & grooming assistance',
        'Meal preparation & nutrition management',
        'Medication reminders & adherence',
        'Mobility & fall prevention support',
        'Companionship & emotional support',
      ]}
      howItWorks={[
        { title: 'Book Care', desc: 'Choose elder care and tell us your loved one\'s needs.' },
        { title: 'Caregiver Assigned', desc: 'We match a compassionate, verified caregiver for them.' },
        { title: 'Care Begins', desc: 'Caregiver visits and provides personalised daily support.' },
      ]}
      benefits={[
        'Compassionate, trained caregivers',
        'Background verified professionals',
        'Flexible hours — full/part day',
        'Regular health monitoring',
        '24/7 family updates & support',
      ]}
      whoCanBenefit={['Senior citizens', 'Post-hospitalization elderly', 'Dementia patients', 'Bedridden elderly']}
      ctaPath="/register"
    />
  );
}

// Default export for direct route
export default NursingCare;
