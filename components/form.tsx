"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { Clock3, Plus, Trash2, Save, Wifi, CalendarClock } from "lucide-react";
import {
  FEED_TIMEZONE,
  MAX_FEEDS,
  parseSchedule,
  type FeedSchedule,
  type ScheduleField,
} from "@/lib/schedule";

type Meal = FeedSchedule & { key: string };
const withKeys = (schedule: FeedSchedule[]): Meal[] =>
  schedule.map((meal) => ({ ...meal, key: crypto.randomUUID() }));

export default function FormInput() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/schedule", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Unable to load schedule.");
        setMeals(withKeys(parseSchedule(data)));
        setLoaded(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(
          error instanceof Error ? error.message : "Unable to load schedule.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  function update(key: string, field: ScheduleField, value: string) {
    setMeals((previous) =>
      previous.map((meal) =>
        meal.key === key
          ? { ...meal, [field]: value === "" ? NaN : Number(value) }
          : meal,
      ),
    );
    setSaved(false);
    setError("");
  }

  function addMeal() {
    const used = new Set(meals.map((meal) => meal.hour * 60 + meal.minute));
    let time = 8 * 60;
    while (used.has(time)) time = (time + 30) % (24 * 60);
    setMeals((previous) => [
      ...previous,
      {
        key: crypto.randomUUID(),
        hour: Math.floor(time / 60),
        minute: time % 60,
        duration_sec: 10,
      },
    ]);
    setSaved(false);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    let schedule;
    try {
      schedule = parseSchedule(meals);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Check your meals.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to save schedule.");
      setMeals(withKeys(parseSchedule(data)));
      setSaved(true);
      addToast({
        title: "Schedule saved",
        description:
          "Your feeder will fetch the update within 5 minutes while online.",
        color: "success",
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save schedule.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl py-6 md:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            A little care, every day
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Their next meal, taken care of.
          </h1>
          <p className="mt-3 max-w-xl text-default-500">
            Build a daily feeding routine for your companion. All times follow
            Bangkok time.
          </p>
        </div>
        <span className="rounded-full border border-default-200 px-3 py-1.5 text-xs text-default-500">
          {FEED_TIMEZONE} · UTC+7
        </span>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: CalendarClock,
            label: "Daily meals",
            value: `${meals.length} / ${MAX_FEEDS}`,
          },
          {
            icon: Clock3,
            label: "Total dispense time",
            value: `${meals.reduce((sum, meal) => sum + (Number.isFinite(meal.duration_sec) ? meal.duration_sec : 0), 0)} seconds`,
          },
          { icon: Wifi, label: "Schedule refresh", value: "Every 5 minutes" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-default-200 bg-content1 p-5"
          >
            <Icon aria-hidden className="mb-3 h-5 w-5 text-primary" />
            <p className="text-xs text-default-500">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={save}
        className="overflow-hidden rounded-3xl border border-default-200 bg-content1"
      >
        <div className="flex items-center justify-between gap-3 border-b border-default-200 p-5 md:px-7">
          <div>
            <h2 className="font-semibold">Daily schedule</h2>
            <p className="mt-1 text-xs text-default-500">
              0 seconds pauses a meal. An empty schedule pauses all meals.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Plus size={16} aria-hidden />}
            isDisabled={
              loading || saving || !loaded || meals.length >= MAX_FEEDS
            }
            onPress={addMeal}
          >
            Add meal
          </Button>
        </div>
        <div className="space-y-4 p-5 md:p-7" aria-busy={loading}>
          {loading ? (
            <p role="status" className="py-10 text-center text-default-500">
              Loading your routine…
            </p>
          ) : meals.length === 0 ? (
            <div className="py-10 text-center">
              <Clock3 aria-hidden className="mx-auto mb-3 text-primary" />
              <p className="font-medium">Room for a new routine</p>
              <p className="mt-2 text-sm text-default-500">
                Add your first meal, then save your schedule.
              </p>
            </div>
          ) : (
            meals.map((meal, index) => (
              <fieldset
                key={meal.key}
                disabled={saving}
                className="grid grid-cols-[repeat(3,minmax(0,1fr))_2.5rem] items-center gap-3 rounded-2xl bg-default-50 p-4 sm:flex"
              >
                <legend className="sr-only">Meal {index + 1}</legend>
                <span className="col-span-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                {(["hour", "minute", "duration_sec"] as const).map((field) => (
                  <Input
                    key={field}
                    isRequired
                    type="number"
                    step={1}
                    min={0}
                    max={field === "hour" ? 23 : field === "minute" ? 59 : 60}
                    label={
                      field === "duration_sec"
                        ? "Sec"
                        : field === "hour"
                          ? "Hour"
                          : "Minute"
                    }
                    aria-label={`Meal ${index + 1} ${field}`}
                    value={Number.isNaN(meal[field]) ? "" : String(meal[field])}
                    onValueChange={(value) => update(meal.key, field, value)}
                    className="min-w-0 flex-1"
                    size="sm"
                    variant="bordered"
                  />
                ))}
                <Button
                  isIconOnly
                  type="button"
                  variant="light"
                  color="danger"
                  aria-label={`Remove meal ${index + 1}`}
                  onPress={() => {
                    setMeals((previous) =>
                      previous.filter((row) => row.key !== meal.key),
                    );
                    setSaved(false);
                  }}
                >
                  <Trash2 size={17} aria-hidden />
                </Button>
              </fieldset>
            ))
          )}
          {error ? (
            <div
              role="alert"
              className="rounded-xl bg-danger-50 p-4 text-sm text-danger"
            >
              {error}{" "}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => setRetry((value) => value + 1)}
              >
                Reload saved schedule
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 bg-default-50/50 p-5 md:px-7">
          <p role="status" className="text-xs text-default-500">
            {saved
              ? "Saved. Waiting for the feeder’s next refresh."
              : "Changes take effect after you save."}
          </p>
          <Button
            type="submit"
            color="primary"
            startContent={<Save size={16} aria-hidden />}
            isLoading={saving}
            isDisabled={loading || saving || !loaded}
          >
            Save schedule
          </Button>
        </div>
      </form>
    </section>
  );
}
