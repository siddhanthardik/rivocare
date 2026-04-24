import { Link } from 'react-router-dom';
import { BriefcaseBusiness, HeartHandshake, ArrowRight } from 'lucide-react';

export default function Careers() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/70 sm:p-12">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BriefcaseBusiness size={26} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Careers</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">We are building carefully and hiring thoughtfully.</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
            RIVO is focused on building a dependable healthcare coordination experience. We may share future openings across product, operations, provider success, and growth as the platform expands.
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">No public openings listed yet</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  If you are interested in mission-aligned work related to home healthcare operations, provider quality, or product design, reach out and tell us how you could help.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:care@rivocare.in?subject=Career%20Interest%20at%20RIVO"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Share Your Profile
              <ArrowRight size={18} />
            </a>
            <Link
              to="/about-us"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Learn About RIVO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
