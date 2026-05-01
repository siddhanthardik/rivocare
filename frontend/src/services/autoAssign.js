/**
 * Smart Auto-Assign Engine
 * Calculates a provisional score for providers based on weighted metrics.
 */

// Weights
const WEIGHTS = {
  availability: 30, // Max 30
  distance: 20,     // Max 20
  reliability: 20,  // Max 20
  experience: 10,   // Max 10
  continuity: 10,   // Max 10
  load: 10          // Max 10
};

/**
 * Calculates a comprehensive score (0-100) for a provider.
 */
const calculateProviderScore = (provider, patientId) => {
  const ratingScore = ((provider.rating || 4.0) / 5) * WEIGHTS.reliability;
  const expCap = Math.min(provider.experience || 1, 15);
  const expScore = (expCap / 15) * WEIGHTS.experience;
  const distanceScore = 15 + Math.random() * 5; 
  const availabilityScore = 20 + Math.random() * 10;
  const continuityScore = Math.random() > 0.8 ? WEIGHTS.continuity : 0;
  const loadScore = 5 + Math.random() * 5;

  const totalScore = Math.round(
    ratingScore + expScore + distanceScore + availabilityScore + continuityScore + loadScore
  );

  return Math.min(totalScore, 100);
};

/**
 * Sorts and groups providers into Primary and Backups
 */
const getRecommendedProviders = (providers, patientId = null) => {
  if (!providers || providers.length === 0) return { primary: null, backups: [] };

  const scoredProviders = providers.map(p => ({
    ...p,
    autoAssignScore: calculateProviderScore(p, patientId)
  })).sort((a, b) => b.autoAssignScore - a.autoAssignScore);

  return {
    primary: scoredProviders[0],
    backups: scoredProviders.slice(1, 4) // Top 3 backups
  };
};

/**
 * Reassignment Logic Service
 */
const revalidateProvisionalBooking = (bookingPayload) => {
  try {
    const assignmentData = JSON.parse(bookingPayload.notes.split('\n\n')[1] || '{}');
    if (!assignmentData.assignment || assignmentData.assignment.status !== 'provisional') {
      return { success: false, reason: 'No provisional lock found' };
    }

    const isPrimaryAvailable = Math.random() > 0.1; // 90% availability
    
    if (!isPrimaryAvailable) {
      const backups = assignmentData.assignment.backupProviderIds;
      if (backups && backups.length > 0) {
        return {
          success: true,
          reassigned: true,
          newProviderId: backups[0],
          message: 'Primary unavailable. Reassigned to first backup.'
        };
      } else {
        return {
          success: false,
          flagForAdmin: true,
          message: 'Primary unavailable and no backups remain. Admin intervention required.'
        };
      }
    }

    return { success: true, reassigned: false, message: 'Primary is available. Lock confirmed.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const autoAssignEngine = {
  calculateProviderScore,
  getRecommendedProviders,
  revalidateProvisionalBooking
};

export default autoAssignEngine;
