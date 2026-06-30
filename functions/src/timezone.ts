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
