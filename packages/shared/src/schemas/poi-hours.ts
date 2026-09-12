import { z } from "zod";

// ISO 8601 day-of-week: 1=Monday...7=Sunday — matches Postgres's
// EXTRACT(ISODOW FROM ...), so the "open now" query lines up directly.
export const dayOfWeekSchema = z.number().int().min(1).max(7);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

export const poiHourSchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: dayOfWeekSchema,
  opensAt: timeOfDaySchema,
  closesAt: timeOfDaySchema,
});
export type PoiHour = z.infer<typeof poiHourSchema>;

export const createPoiHourSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  opensAt: timeOfDaySchema,
  closesAt: timeOfDaySchema,
});
export type CreatePoiHourPayload = z.infer<typeof createPoiHourSchema>;

// Replace-all semantics: PUT /pois/:id/hours takes the full week's schedule
// at once rather than incremental add/remove — simpler to reason about than
// diffing individual day/slot changes, and a full-week edit is how an owner
// naturally thinks about "set my hours" anyway. No rows for a given
// dayOfWeek means closed that day.
export const setPoiHoursSchema = z.array(createPoiHourSchema).max(50);
export type SetPoiHoursPayload = z.infer<typeof setPoiHoursSchema>;
