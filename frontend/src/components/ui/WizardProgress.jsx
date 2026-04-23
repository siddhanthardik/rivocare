/**
 * WizardProgress — Reusable animated step progress bar
 * Props:
 *   steps    : string[]   — step labels
 *   current  : number     — 0-indexed active step
 *   className: string
 */
export default function WizardProgress({ steps, current, className = '' }) {
  const pct = Math.round(((current) / (steps.length - 1)) * 100);

  return (
    <div className={`w-full ${className}`}>
      {/* Percentage label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Step {current + 1} of {steps.length}
        </span>
        <span className="text-xs font-bold text-primary-600">{pct}% complete</span>
      </div>

      {/* Track + fill */}
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center">
        {steps.map((label, i) => {
          const done    = i < current;
          const active  = i === current;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 shrink-0
                    ${done   ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' : ''}
                    ${active ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-110' : ''}
                    ${!done && !active ? 'bg-slate-100 text-slate-400' : ''}
                  `}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className={`hidden sm:block text-[10px] font-medium whitespace-nowrap leading-tight
                    ${active ? 'text-primary-700' : done ? 'text-emerald-600' : 'text-slate-400'}
                  `}
                >
                  {label}
                </span>
              </div>
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-1 mb-4 sm:mb-5 rounded-full transition-colors duration-500">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      i < current ? 'bg-emerald-400' : 'bg-slate-100'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
