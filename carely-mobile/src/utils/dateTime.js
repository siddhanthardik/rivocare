export const padNumber = (value) => String(value).padStart(2, '0');

export const formatDateDDMMYYYY = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return `${padNumber(date.getDate())}-${padNumber(date.getMonth() + 1)}-${date.getFullYear()}`;
};

export const formatTimeHM = (value) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
};

export const formatScheduleWindow = (scheduledAt, durationHours = 1) => {
  const start = new Date(scheduledAt);

  if (Number.isNaN(start.getTime())) {
    return 'Schedule unavailable';
  }

  const end = new Date(start.getTime() + Number(durationHours || 1) * 60 * 60 * 1000);
  return `${formatDateDDMMYYYY(start)} | ${formatTimeHM(start)} - ${formatTimeHM(end)}`;
};

export const parseDateAndTimeToISO = (dateText, timeText) => {
  const [day, month, year] = dateText.split('-').map(Number);
  const [hours, minutes] = timeText.split(':').map(Number);

  if (!day || !month || !year || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const scheduledAt = new Date(year, month - 1, day, hours, minutes);
  return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt.toISOString();
};
