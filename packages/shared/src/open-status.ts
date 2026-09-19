import type { PoiHour } from "./schemas/poi-hours";

// Mirrors the backend's OPEN_NOW_SQL (apps/backend/src/pois/pois.service.ts)
// in JS so a POI detail page can show a live open/closed line without a
// dedicated endpoint — same Romania-only hardcoded timezone, same
// overnight-wraparound handling (closesAt <= opensAt, e.g. 20:00-02:00).
// Shared between web and mobile since it's pure logic, no platform deps.
export function isOpenNow(hours: PoiHour[], now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const nowMinutes = Number(hour) * 60 + Number(minute);

  // ISO 1=Monday...7=Sunday, matching poi_hours.dayOfWeek.
  const dayOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekdayShort) + 1;

  return hours.some((h) => {
    if (h.dayOfWeek !== dayOfWeek) return false;
    const opens = toMinutes(h.opensAt);
    const closes = toMinutes(h.closesAt);
    if (closes > opens) return nowMinutes >= opens && nowMinutes < closes;
    return nowMinutes >= opens || nowMinutes < closes;
  });
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
