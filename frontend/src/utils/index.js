import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:   { label: 'Confirmed',   color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'in-progress': { label: 'In Progress', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
  completed:   { label: 'Completed',   color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-50 text-red-700 border border-red-200' },
};

export const SERVICE_CONFIG = {
  nurse:           { label: 'Nurse',           icon: '💉', color: 'bg-pink-50 text-pink-700' },
  physiotherapist: { label: 'Physiotherapist', icon: '🦴', color: 'bg-orange-50 text-orange-700' },
  doctor:          { label: 'Doctor',          icon: '👨‍⚕️', color: 'bg-blue-50 text-blue-700' },
  caretaker:       { label: 'Caretaker',       icon: '🤲', color: 'bg-green-50 text-green-700' },
};
