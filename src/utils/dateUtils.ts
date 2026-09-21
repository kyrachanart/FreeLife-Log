import { TimeSession } from '../types';

/**
 * Format Date to ISO 8601 UTC string
 */
export function toISOUTC(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Get Local YYYY-MM-DD from a Date or ISO string
 */
export function getLocalDateString(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    const d = new Date();
    return formatLocalYMD(d);
  }
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return formatLocalYMD(d);
}

function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get Local HH:mm from a Date or ISO string
 */
export function getLocalTimeString(dateInput?: Date | string | number | null): string {
  if (!dateInput) {
    const d = new Date();
    return formatLocalHM(d);
  }
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return '00:00';
  }
  return formatLocalHM(d);
}

function formatLocalHM(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Determines whether a session spans across midnight.
 */
export function isCrossMidnightSession(session: TimeSession): boolean {
  if (session.isCrossMidnight) return true;
  if (session.startDate && session.endDate && session.startDate !== session.endDate) return true;
  if (session.startISO && session.endISO) {
    const sDate = getLocalDateString(session.startISO);
    const eDate = getLocalDateString(session.endISO);
    if (sDate !== eDate) return true;
  }
  // Check string times e.g. 23:30 to 00:30
  if (session.startTime && session.endTime && session.startTime !== '--:--' && session.endTime !== '--:--') {
    const [sh, sm] = session.startTime.split(':').map(Number);
    const [eh, em] = session.endTime.split(':').map(Number);
    if (!isNaN(sh) && !isNaN(eh)) {
      if (eh < sh || (eh === sh && em < sm)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Format time range display for a session with cross-midnight support.
 * Returns e.g. "23:41 - 00:02 (+1日)" or "2026-09-20 23:41 - 2026-09-21 00:02"
 */
export function formatSessionTimeRange(session: TimeSession, showFullDate: boolean = false): string {
  if (!session.startTime || session.startTime === '--:--') {
    return '手動工時';
  }
  const end = session.endTime || '結束';
  const isCross = isCrossMidnightSession(session);

  if (showFullDate) {
    const startDate = session.startDate || session.date;
    const endDate = session.endDate || (isCross ? getNextDayString(startDate) : startDate);
    return `${startDate} ${session.startTime} - ${endDate} ${end}`;
  }

  if (isCross) {
    return `${session.startTime} - ${end} (+1日)`;
  }
  return `${session.startTime} - ${end}`;
}

/**
 * Checks if a session falls on a specific filter date (either starts or ends on that date)
 */
export function isSessionOnDate(session: TimeSession, targetDate: string): boolean {
  if (session.date === targetDate) return true;
  if (session.startDate === targetDate) return true;
  if (session.endDate === targetDate) return true;
  if (session.startISO && getLocalDateString(session.startISO) === targetDate) return true;
  if (session.endISO && getLocalDateString(session.endISO) === targetDate) return true;
  return false;
}

function getNextDayString(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    return formatLocalYMD(date);
  } catch {
    return dateStr;
  }
}
