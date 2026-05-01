/**
 * ── Provider Smart Decision Engine ──────────────────────────────────────────
 * Utility functions for provider-side booking intelligence:
 * - End time calculation
 * - Availability conflict detection
 * - Distance estimation (Haversine formula)
 * - Booking request time-to-expiry
 * - Smart acceptance score
 */

/**
 * Given a start time (HH:MM) and duration in hours, returns the end time (HH:MM).
 */
export const calculateEndTime = (start, duration) => {
  if (!start || !duration) return '-';
  try {
    const [h, m] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setHours(date.getHours() + Number(duration));
    return date.toTimeString().slice(0, 5);
  } catch {
    return '-';
  }
};

/**
 * Detects whether a booking conflicts with the provider's shift window
 * or any of their existing confirmed bookings.
 *
 * Returns: "AVAILABLE" | "CONFLICT" | "OUTSIDE_SHIFT" | "UNKNOWN"
 */
export const checkAvailabilityConflict = (booking, provider) => {
  try {
    const availability = provider?.availability || {};

    const start = new Date(`${booking.date} ${booking.time}`);
    const end = new Date(start);
    end.setHours(end.getHours() + (booking.durationHours || 1));

    // Check shift window
    if (availability.startTime && availability.endTime) {
      const startHour = Number(availability.startTime.split(':')[0]);
      const endHour = Number(availability.endTime.split(':')[0]);

      if (start.getHours() < startHour || end.getHours() > endHour) {
        return 'OUTSIDE_SHIFT';
      }
    }

    // Check against confirmed bookings
    const clash = provider?.bookings?.some(b => {
      if (!b.date || !b.time) return false;
      const bStart = new Date(`${b.date} ${b.time}`);
      const bEnd = new Date(bStart);
      bEnd.setHours(bEnd.getHours() + (b.durationHours || 1));
      return start < bEnd && end > bStart;
    });

    return clash ? 'CONFLICT' : 'AVAILABLE';
  } catch {
    return 'UNKNOWN';
  }
};

/**
 * Calculates straight-line distance between two lat/lon points (Haversine).
 * Returns distance in km as a string (e.g. "3.7"), or null if coords missing.
 */
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lat2 == null || lon1 == null || lon2 == null) return null;
  try {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  } catch {
    return null;
  }
};

/**
 * Returns a human-readable countdown string (e.g. "7:42") until a booking
 * request expires (default 10-minute window from creation).
 *
 * Returns: "M:SS" string, "EXPIRED" if past, or null if no timestamp.
 */
export const getTimeLeft = (createdAt, windowMs = 10 * 60 * 1000) => {
  if (!createdAt) return null;
  try {
    const diff = windowMs - (Date.now() - new Date(createdAt).getTime());
    if (diff <= 0) return 'EXPIRED';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } catch {
    return null;
  }
};

/**
 * Computes a composite "Smart Score" for a booking request from the
 * provider's perspective.
 *
 * Scoring weights:
 *  - 40% Availability (no conflict = 1, else 0)
 *  - 30% Proximity (inverse of distance; 0 if unavailable)
 *  - 30% Earning rate (₹ per hour, normalised by /1000 to keep scale)
 *
 * Returns a float. Higher = better opportunity.
 */
export const getSmartScore = (booking, provider, distance) => {
  try {
    const earning = booking?.totalAmount || booking?.price || 0;
    const duration = booking?.durationHours || 1;
    const earningPerHour = earning / duration;

    const availabilityScore =
      checkAvailabilityConflict(booking, provider) === 'AVAILABLE' ? 1 : 0;

    // Normalize distance: closer = higher score. Cap at 50 km.
    const distanceScore = distance != null ? Math.max(0, 1 - Number(distance) / 50) : 0;

    // Normalize earning: ₹500/hr baseline = score of 0.5
    const earningScore = Math.min(earningPerHour / 1000, 1);

    return (
      availabilityScore * 0.4 +
      distanceScore * 0.3 +
      earningScore * 0.3
    ).toFixed(3);
  } catch {
    return '0.000';
  }
};
