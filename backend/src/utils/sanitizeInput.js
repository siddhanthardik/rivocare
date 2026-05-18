const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const cleanString = (value, maxLength = 500) => {
  if (typeof value !== 'string') return value;
  return escapeHtml(value.trim()).slice(0, maxLength);
};

const cleanObject = (source, schema) => {
  return Object.entries(schema).reduce((acc, [key, options]) => {
    const value = source?.[key];
    if (value === undefined || value === null) return acc;

    if (options.type === 'string') {
      acc[key] = cleanString(value, options.maxLength);
      return acc;
    }

    if (options.type === 'number') {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) acc[key] = numeric;
      return acc;
    }

    if (options.type === 'boolean') {
      acc[key] = Boolean(value);
      return acc;
    }

    if (options.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      acc[key] = cleanObject(value, options.schema || {});
    }

    return acc;
  }, {});
};

module.exports = { cleanString, cleanObject };
