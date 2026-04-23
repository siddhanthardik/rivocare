import { cn } from '../../utils';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400',
  outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-400',
};
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2.5 text-sm rounded',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant], sizes[size], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
