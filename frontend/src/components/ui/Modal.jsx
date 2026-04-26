import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import Button from './Button';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer, hideHeader = false, className }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', custom: 'modal-custom' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-modal w-full animate-slide-up overflow-hidden', sizes[size], className)}>
        {/* Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className={cn(hideHeader ? 'p-0' : 'px-6 py-5')}>{children}</div>
        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
