import type { CreatePoiHourPayload } from "./schemas/poi-hours";

// Form-side draft of a POI's weekly schedule, index 0 = Monday ... 6 = Sunday
// (ISO day = index + 1, matching poi_hours.day_of_week). One range per day —
// the editor doesn't do lunch-break splits, though the API itself allows them.
export interface DayHoursDraft {
  closed: boolean;
  opensAt: string;
  closesAt: string;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultWeekHours(): DayHoursDraft[] {
  return Array.from({ length: 7 }, () => ({ closed: false, opensAt: "09:00", closesAt: "20:00" }));
}

/** Copies one day's hours (and open/closed state) onto every day. */
export function applyDayToAllDays(week: DayHoursDraft[], dayIndex: number): DayHoursDraft[] {
  const source = week[dayIndex];
  if (!source) return week;
  return week.map(() => ({ ...source }));
}

/**
 * Converts the draft to the PUT /pois/:id/hours payload. Closed days produce
 * no rows (the API's "closed" convention). Returns the first invalid day
 * (0-based) instead of a payload when an open day has a malformed time.
 */
export function weekHoursToPayload(
  week: DayHoursDraft[],
): { ok: true; payload: CreatePoiHourPayload[] } | { ok: false; invalidDayIndex: number } {
  const payload: CreatePoiHourPayload[] = [];
  for (const [i, day] of week.entries()) {
    if (day.closed) continue;
    if (!TIME_RE.test(day.opensAt) || !TIME_RE.test(day.closesAt)) return { ok: false, invalidDayIndex: i };
    payload.push({ dayOfWeek: i + 1, opensAt: day.opensAt, closesAt: day.closesAt });
  }
  return { ok: true, payload };
}
