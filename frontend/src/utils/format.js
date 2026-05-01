/**
 * Formats a number as Indian Rupee (INR) with 2 decimal places.
 * @param {number|string} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return `₹${Number(amount ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formats a date as DD/MM/YYYY string.
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a date as a compact string (Centralized to DD/MM/YYYY).
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatDateCompact = (date) => {
  return formatDate(date);
};
