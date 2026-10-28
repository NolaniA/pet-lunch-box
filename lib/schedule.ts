export const MAX_FEEDS = 10;
export const MAX_DURATION_SEC = 60;
export const FEED_TIMEZONE = "Asia/Bangkok";

export interface FeedSchedule {
  hour: number;
  minute: number;
  duration_sec: number;
}
export type ScheduleField = keyof FeedSchedule;

export function validateField(
  field: ScheduleField,
  value: number,
): string | null {
  if (!Number.isInteger(value)) return "Enter a whole number.";
  const max =
    field === "hour" ? 23 : field === "minute" ? 59 : MAX_DURATION_SEC;
  return value < 0 || value > max ? `Enter a value from 0 to ${max}.` : null;
}

export function parseSchedule(value: unknown): FeedSchedule[] {
  if (!Array.isArray(value) || value.length > MAX_FEEDS) {
    throw new Error(`A schedule must contain 0–${MAX_FEEDS} meals.`);
  }
  const seen = new Set<number>();
  const schedule = value.map((row: unknown) => {
    if (!row || typeof row !== "object") throw new Error("Invalid meal.");
    const record = row as Record<string, unknown>;
    const meal = {} as FeedSchedule;
    for (const field of ["hour", "minute", "duration_sec"] as const) {
      const number = record[field];
      if (typeof number !== "number" || validateField(field, number)) {
        throw new Error(`Invalid ${field}.`);
      }
      meal[field] = number;
    }
    const time = meal.hour * 60 + meal.minute;
    if (seen.has(time))
      throw new Error("Each meal must have a different time.");
    seen.add(time);
    return meal;
  });
  return schedule.sort((a, b) => a.hour - b.hour || a.minute - b.minute);
}
