/**
 * Safely access nested values with fallback
 * @param {any} val - Value to check
 * @param {any} fallback - Fallback value if val is null or undefined
 * @returns {any}
 */
export const safe = (val, fallback = "-") => (val !== undefined && val !== null ? val : fallback);
