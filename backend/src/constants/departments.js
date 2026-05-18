const LAB_DEPARTMENTS = [
  { key: 'pathology', label: 'Pathology' },
  { key: 'microbiology', label: 'Microbiology' },
  { key: 'serology', label: 'Serology' },
  { key: 'immunology', label: 'Immunology' },
  { key: 'biochemistry', label: 'Biochemistry' },
  { key: 'haematology', label: 'Haematology' },
  { key: 'genetics', label: 'Genetics' },
  { key: 'wellness', label: 'Wellness' }
];

const LAB_DEPARTMENT_KEYS = LAB_DEPARTMENTS.map(d => d.key);

/**
 * Automatically assigns a department based on search terms or falls back to pathology.
 * @param {string} input - Name or category of the test
 * @returns {string} - Valid department key
 */
const autoAssignDepartment = (input = '') => {
  const str = input.toLowerCase();
  
  if (str.includes('genetics') || str.includes('dna') || str.includes('genome')) {
    return 'genetics';
  }
  
  if (str.includes('wellness') || str.includes('package') || str.includes('checkup')) {
    return 'wellness';
  }

  if (str.includes('microbiology') || str.includes('culture') || str.includes('fungal')) {
    return 'microbiology';
  }

  if (str.includes('serology') || str.includes('antibody') || str.includes('viral')) {
    return 'serology';
  }

  if (str.includes('immunology') || str.includes('immune')) {
    return 'immunology';
  }

  if (str.includes('biochemistry') || str.includes('sugar') || str.includes('cholesterol') || str.includes('liver') || str.includes('kidney')) {
    return 'biochemistry';
  }

  if (str.includes('haematology') || str.includes('blood') || str.includes('cbc') || str.includes('hemoglobin')) {
    return 'haematology';
  }

  // Default fallback
  return 'pathology';
};

module.exports = {
  LAB_DEPARTMENTS,
  LAB_DEPARTMENT_KEYS,
  autoAssignDepartment
};
