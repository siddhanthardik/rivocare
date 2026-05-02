const LAB_DEPARTMENTS = [
  { key: 'pathology', label: 'Pathology' },
  { key: 'radiology', label: 'Radiology' },
  { key: 'cardiology', label: 'Cardiology' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'genetics', label: 'Genetics' },
  { key: 'microbiology', label: 'Microbiology' }
];

const LAB_DEPARTMENT_KEYS = LAB_DEPARTMENTS.map(d => d.key);

/**
 * Automatically assigns a department based on search terms or falls back to pathology.
 * @param {string} input - Name or category of the test
 * @returns {string} - Valid department key
 */
const autoAssignDepartment = (input = '') => {
  const str = input.toLowerCase();
  
  if (str.includes('radiology') || str.includes('imaging') || str.includes('x-ray') || str.includes('mri') || str.includes('ct scan') || str.includes('ultrasound')) {
    return 'radiology';
  }
  
  if (str.includes('cardiology') || str.includes('heart') || str.includes('ecg') || str.includes('echo')) {
    return 'cardiology';
  }
  
  if (str.includes('genetics') || str.includes('dna') || str.includes('genome')) {
    return 'genetics';
  }
  
  if (str.includes('wellness') || str.includes('package') || str.includes('checkup')) {
    return 'wellness';
  }

  if (str.includes('microbiology') || str.includes('culture') || str.includes('fungal')) {
    return 'microbiology';
  }

  // Default fallback
  return 'pathology';
};

module.exports = {
  LAB_DEPARTMENTS,
  LAB_DEPARTMENT_KEYS,
  autoAssignDepartment
};
