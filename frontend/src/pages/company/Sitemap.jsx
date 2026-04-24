import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const sections = [
  {
    title: 'Company',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about-us' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-of-service' },
    ],
  },
  {
    title: 'Access',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Register', href: '/register' },
      { label: 'Join as Provider', href: '/join' },
    ],
  },
];

export default function Sitemap() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70 sm:p-12">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Compass size={26} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Sitemap</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">A quick map of the public RIVO experience.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
            Use this page to navigate the primary public routes for company information, legal policies, and account access.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block rounded-2xl border border-white bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
