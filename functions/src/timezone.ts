/**
 * Returns the YYYY-MM-DD date string for a given UTC instant, converted
 * to the given IANA timezone.
 */
export function todayInTz(nowUtc: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    // en-CA gives YYYY-MM-DD directly
    return formatter.format(nowUtc);
  } catch {
    // Invalid timezone — fall back to UTC
    return nowUtc.toISOString().slice(0, 10);
  }
}

/**
 * Returns the HH:MM (24h) for a given UTC instant in the given timezone.
 */
export function hhmmInTz(nowUtc: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(nowUtc);
  } catch {
    // Invalid timezone — return UTC time
    return nowUtc.toISOString().slice(11, 16);
  }
}

/**
 * Returns true if the user's local time (in their timezone) matches their
 * configured reminder time for the given UTC instant.
 */
export function shouldRemindNow(
  nowUtc: Date,
  reminderTime: string, // "HH:MM"
  timezone: string,
): boolean {
  // Validate timezone first — shouldRemindNow should return false for invalid tz
  try {
    Intl.DateTimeFormat('en-GB', { timeZone: timezone });
  } catch {
    return false;
  }
  return hhmmInTz(nowUtc, timezone) === reminderTime;
}
