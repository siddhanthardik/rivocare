import { cn, getInitials } from '../../utils';

export default function Avatar({ name = '', src, size = 'md', className }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold bg-primary-100 text-primary-700 shrink-0', sizes[size], className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
