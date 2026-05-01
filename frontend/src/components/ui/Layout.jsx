import React, { memo } from 'react';
import { cn } from '../../utils';
import { STATUS_COLORS } from '../../utils/constants';

/**
 * Standard page wrapper to ensure consistent max-width and spacing.
 */
export const PageWrapper = ({ children, maxWidth = '800px', className }) => (
  <div className={cn("page-wrapper min-h-screen bg-slate-50/30", className)}>
    <div className={cn(
      "page-container mx-auto p-3 space-y-3", 
      maxWidth === '800px' ? 'max-w-[800px]' : maxWidth === '1200px' ? 'max-w-[1200px]' : ''
    )}>
      {children}
    </div>
  </div>
);

/**
 * Standard card container for grouping related content.
 * Enforces p-3 spacing.
 */
export const Card = ({ children, className, noPadding = false }) => (
  <div className={cn("compact-card transition-all duration-200", !noPadding && "p-3", className)}>
    {children}
  </div>
);

/**
 * Standard list row for consistent high-density data display.
 * Optimized with React.memo.
 */
export const Row = memo(({ children, className, onClick, noBorder = false }) => (
  <div 
    onClick={onClick}
    className={cn(
      "table-row flex justify-between items-center transition-colors hover:bg-slate-50/50",
      onClick && "cursor-pointer active:scale-[0.99]",
      noBorder && "!border-0",
      className
    )}
  >
    {children}
  </div>
));

/**
 * Section header component to replace raw h1/h2 tags.
 */
export const Section = ({ title, subtitle, action, children, className }) => (
  <div className={cn("space-y-3", className)}>
    <div className={cn("flex items-center justify-between px-1")}>
      <div className="space-y-0.5">
        <h2 className="typo-title !text-[18px] tracking-tight">{title}</h2>
        {subtitle && <p className="typo-micro font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

/**
 * High-density KPI indicator.
 */
export const KPIChip = ({ label, value, icon: Icon, color = 'text-slate-900', bg = 'bg-white' }) => (
  <Card className={cn("flex items-center gap-3 border-transparent shadow-sm", bg)}>
    {Icon && (
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/50")}>
        <Icon size={16} className={color} />
      </div>
    )}
    <div className="min-w-0">
      <p className="typo-micro font-bold text-slate-400 uppercase leading-none mb-1">{label}</p>
      <p className={cn("typo-kpi leading-tight font-black", color)}>{value}</p>
    </div>
  </Card>
);

/**
 * Standardized status indicator.
 */
export const StatusPill = ({ status, label, className }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md typo-micro font-black border uppercase tracking-tighter",
      colorClass,
      className
    )}>
      {label || status.replace('_', ' ')}
    </span>
  );
};
