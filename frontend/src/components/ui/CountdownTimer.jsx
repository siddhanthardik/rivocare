import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = Math.max(0, targetTime - now);
      
      if (difference === 0) {
        if (!isExpired) {
          setIsExpired(true);
          setTimeLeft(0);
          if (onExpire) onExpire();
        }
        return;
      }
      
      setIsExpired(false);
      setTimeLeft(difference);
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isExpired, onExpire]);

  if (!expiresAt) return null;

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');

  const isCritical = totalSeconds > 0 && totalSeconds < 60; // Less than 1 minute

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-sm font-semibold border border-slate-200 w-fit">
        <Clock size={16} />
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold border transition-colors w-fit ${
      isCritical 
        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
        : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100'
    }`}>
      <Clock size={16} />
      <span className="tabular-nums tracking-wider text-base">
        {formattedMinutes}:{formattedSeconds}
      </span>
    </div>
  );
}
