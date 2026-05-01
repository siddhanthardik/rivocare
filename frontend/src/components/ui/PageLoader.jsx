import React from 'react';
import { cn } from '../../utils';

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <svg className={cn('animate-spin text-primary-600', sizes[size], className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/30 backdrop-blur-sm fixed inset-0 z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
           <Spinner size="lg" className="text-blue-600" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
           </div>
        </div>
        <div className="space-y-1 text-center">
           <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Rivo Labs</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initializing OS...</p>
        </div>
      </div>
    </div>
  );
}
