import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils';

/**
 * StarRating — interactive 1-5 star selector or read-only display.
 *
 * Props:
 *   value       {number}   – current rating (controlled)
 *   onChange    {function} – called with new value; if omitted → read-only
 *   size        {string}   – 'sm' | 'md' | 'lg'
 *   showLabel   {boolean}  – show rating label text
 */
const SIZE = { sm: 14, md: 20, lg: 28 };

export default function StarRating({ value = 0, onChange, size = 'md', showLabel = false }) {
  const [hovered, setHovered] = useState(0);
  const interactive = typeof onChange === 'function';
  const px = SIZE[size] || SIZE.md;

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const displayValue = hovered || value;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange(star)}
              onMouseEnter={() => interactive && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(0)}
              className={cn(
                'transition-all duration-100',
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
                'focus:outline-none'
              )}
            >
              <Star
                size={px}
                className={cn(
                  'transition-colors duration-100',
                  filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showLabel && displayValue > 0 && (
        <span className="text-sm font-semibold text-amber-600 ml-1">
          {LABELS[displayValue]}
        </span>
      )}
    </div>
  );
}
