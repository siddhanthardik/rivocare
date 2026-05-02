/**
 * Haversine distance between two [lng, lat] points in km
 */
const getDistance = (p1, p2) => {
  const R = 6371; // km
  const dLat = (p2[1] - p1[1]) * Math.PI / 180;
  const dLon = (p2[0] - p1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Smart Provider Scoring Function
 * Weights:
 * - Distance (max 30)
 * - Availability (max 25)
 * - Rating (max 15)
 * - Experience (max 10)
 * - Completion (max 10)
 * - Cancellation (max -10)
 */
const calculateProviderScore = (provider, targetLocation, isAvailable) => {
  let score = 0;

  // 1. Distance (30 pts)
  const distance = getDistance(provider.location.coordinates, targetLocation);
  if (distance < 2) score += 30;
  else if (distance < 5) score += 20;
  else if (distance < 10) score += 10;
  else if (distance < 20) score += 5;

  // 2. Availability (25 pts)
  if (isAvailable) score += 25;
  else if (provider.isOnline) score += 15;

  // 3. Rating (15 pts)
  score += (provider.rating || 0) * 3;

  // 4. Experience (10 pts)
  score += Math.min(provider.experience || 0, 10);

  // 5. Completion (10 pts)
  if (provider.completedBookings > 50) score += 10;
  else if (provider.completedBookings > 10) score += 5;

  // 6. Cancellation (-10 pts)
  score -= Math.min((provider.cancellationCount || 0) * 2, 10);

  return { score, distance };
};

/**
 * Mock Pincode to Lat/Lng resolver
 * In production, this would use a DB lookup or Google Geocoding
 */
const resolvePincode = (pincode) => {
  const mockDB = {
    "110001": [77.2219, 28.6324], // Connaught Place
    "110074": [77.1724, 28.5034], // Chhattarpur
    "400001": [72.8347, 18.9388], // Mumbai Fort
  };
  return mockDB[pincode] || [77.1025, 28.7041]; // Default Delhi
};

module.exports = {
  getDistance,
  calculateProviderScore,
  resolvePincode
};
