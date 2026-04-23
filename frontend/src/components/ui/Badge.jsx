import { cn, STATUS_CONFIG } from '../../utils';

export default function Badge({ status, label, className }) {
  const config = STATUS_CONFIG[status] || { label: label || status, color: 'bg-slate-100 text-slate-600 border border-slate-200' };
  return (
    <span className={cn('badge', config.color, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
}

export function SimpleBadge({ children, color = 'slate', className }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border border-blue-200',
    green:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    amber:  'bg-amber-50 text-amber-700 border border-amber-200',
    red:    'bg-red-50 text-red-700 border border-red-200',
    slate:  'bg-slate-100 text-slate-600 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };
  return <span className={cn('badge', colors[color], className)}>{children}</span>;
}
