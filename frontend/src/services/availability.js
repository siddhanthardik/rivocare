/**
 * Provider Availability Engine
 * Handles schedule validation, blocked slots, and conflict resolution.
 */

const getProviderAvailabilityConfig = (provider) => {
  const defaultConfig = {
    isAvailable: true,
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    startTime: '09:00',
    endTime: '19:00',
    shiftType: 'custom',
    blockedSlots: [],
  };

  if (!provider || !provider.notes) return defaultConfig;

  try {
    const parsed = JSON.parse(provider.notes);
    return parsed.availability ? { ...defaultConfig, ...parsed.availability } : defaultConfig;
  } catch (err) {
    return defaultConfig;
  }
};

const isWithinWorkingHours = (dateStr, timeStr, config) => {
  if (!config.isAvailable) return false;

  const requestDate = new Date(`${dateStr}T${timeStr}`);
  const dayOfWeek = requestDate.getDay(); 

  if (!config.workingDays.includes(dayOfWeek)) return false;

  if (config.shiftType === '24h') return true;

  const [reqHour, reqMin] = timeStr.split(':').map(Number);
  const [startHour, startMin] = config.startTime.split(':').map(Number);
  const [endHour, endMin] = config.endTime.split(':').map(Number);

  const reqTimeVal = reqHour * 60 + reqMin;
  const startVal = startHour * 60 + startMin;
  const endVal = endHour * 60 + endMin;

  return reqTimeVal >= startVal && reqTimeVal < endVal;
};

const isBlockedSlot = (dateStr, timeStr, config) => {
  const target = `${dateStr}T${timeStr}`;
  return config.blockedSlots.includes(target);
};

const hasConflictingBookings = (dateStr, timeStr, durationHours, providerBookings) => {
  if (!providerBookings || providerBookings.length === 0) return false;

  const reqStart = new Date(`${dateStr}T${timeStr}`).getTime();
  const reqEnd = reqStart + durationHours * 60 * 60 * 1000;

  return providerBookings.some(b => {
    if (['completed', 'cancelled'].includes(b.status)) return false;
    
    const bStart = new Date(b.scheduledAt).getTime();
    const bEnd = bStart + (b.durationHours || 1) * 60 * 60 * 1000;

    return (reqStart < bEnd && reqEnd > bStart);
  });
};

const checkAvailability = (provider, dateStr, timeStr, durationHours = 1, activeBookings = []) => {
  const config = getProviderAvailabilityConfig(provider);

  if (!config.isAvailable) return false;
  if (!isWithinWorkingHours(dateStr, timeStr, config)) return false;
  if (isBlockedSlot(dateStr, timeStr, config)) return false;
  
  if (activeBookings.length > 0) {
    if (hasConflictingBookings(dateStr, timeStr, durationHours, activeBookings)) return false;
  }

  return true;
};

const availabilityEngine = {
  getProviderAvailabilityConfig,
  isWithinWorkingHours,
  isBlockedSlot,
  hasConflictingBookings,
  checkAvailability
};

export default availabilityEngine;
