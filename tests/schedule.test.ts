import { describe, expect, it } from "vitest";
import { MAX_FEEDS, parseSchedule, validateField } from "@/lib/schedule";

const meal = { hour: 8, minute: 0, duration_sec: 10 };
describe("shared schedule contract", () => {
  it("accepts an empty schedule and paused meals", () => {
    expect(parseSchedule([])).toEqual([]);
    expect(parseSchedule([{ ...meal, duration_sec: 0 }])[0].duration_sec).toBe(
      0,
    );
  });
  it("sorts chronologically and removes untrusted ownership fields", () => {
    expect(
      parseSchedule([
        { ...meal, hour: 20, user_id: "someone-else" },
        { ...meal, hour: 6 },
      ]),
    ).toEqual([
      { ...meal, hour: 6 },
      { ...meal, hour: 20 },
    ]);
  });
  it.each(
    [
      null,
      {},
      "[]",
      [null],
      [1],
      [{ ...meal, hour: "8" }],
      [{ ...meal, hour: NaN }],
      [{ ...meal, minute: 1.5 }],
      [{ ...meal, hour: -1 }],
      [{ ...meal, hour: 24 }],
      [{ ...meal, minute: 60 }],
      [{ ...meal, duration_sec: 61 }],
      [{ ...meal, duration_sec: -1 }],
      [meal, meal],
      Array.from({ length: MAX_FEEDS + 1 }, (_, minute) => ({
        ...meal,
        minute,
      })),
    ].map((value) => ({ value })),
  )("rejects invalid schedule %#", ({ value }) => {
    expect(() => parseSchedule(value)).toThrow();
  });
  it("accepts all documented boundary values", () => {
    expect(
      parseSchedule([
        { hour: 0, minute: 0, duration_sec: 0 },
        { hour: 23, minute: 59, duration_sec: 60 },
      ]),
    ).toHaveLength(2);
    expect(validateField("hour", 1.1)).toMatch(/whole/);
    expect(validateField("minute", 59)).toBeNull();
  });
});
