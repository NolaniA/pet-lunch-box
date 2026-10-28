import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSchedule, type FeedSchedule } from "@/lib/schedule";

type TableClient = Pick<SupabaseClient, "from">;
type RowId = string | number;
interface ExistingMeal {
  id: RowId;
  hour: number;
  minute: number;
}

// Older installations already grant account-scoped table access but do not have
// replace_feed_schedule. Keep those installations usable without a schema change.
export async function saveLegacySchedule(
  client: TableClient,
  userId: string,
  input: FeedSchedule[],
) {
  const desired = parseSchedule(input);
  const { data: existing, error: readError } = await client
    .from("feed_schedule")
    .select("id, hour, minute")
    .eq("user_id", userId)
    .order("hour")
    .order("minute");
  if (readError) throw readError;
  if (!Array.isArray(existing))
    throw new Error("Unable to read the existing schedule.");
  const current: ExistingMeal[] = existing.map((row) => {
    const validId =
      typeof row.id === "string"
        ? row.id.length > 0
        : Number.isSafeInteger(row.id);
    if (
      !validId ||
      !Number.isInteger(row.hour) ||
      !Number.isInteger(row.minute)
    ) {
      throw new Error("Invalid existing schedule.");
    }
    return { id: row.id, hour: row.hour, minute: row.minute };
  });

  // Reserve exact time matches before reusing any remaining IDs. This avoids
  // collisions with an existing per-account unique time constraint.
  const matches = desired.map((meal) =>
    current.find((row) => row.hour === meal.hour && row.minute === meal.minute),
  );
  const reserved = new Set(
    matches.filter((row) => row !== undefined).map((row) => row.id),
  );
  const spare = current.filter((row) => !reserved.has(row.id));
  const retained = new Set<RowId>();
  const records = desired.map((meal, index) => {
    const previous = matches[index] ?? spare.shift();
    if (previous) retained.add(previous.id);
    return {
      ...(previous ? { id: previous.id } : {}),
      user_id: userId,
      hour: meal.hour,
      minute: meal.minute,
      duration_sec: meal.duration_sec,
    };
  });

  // Write the whole batch first. A failed upsert must never clear the old meals.
  // Missing IDs use database defaults when old and new meals share one batch.
  if (records.length > 0) {
    const { data: written, error } = await client
      .from("feed_schedule")
      .upsert(records, { onConflict: "id", defaultToNull: false })
      .select("id");
    if (error) throw error;
    if (!Array.isArray(written) || written.length !== records.length) {
      throw new Error("Unable to confirm saved meals.");
    }
  }
  const removedIds = current
    .filter((row) => !retained.has(row.id))
    .map((row) => row.id);
  if (removedIds.length > 0) {
    const { error } = await client
      .from("feed_schedule")
      .delete()
      .eq("user_id", userId)
      .in("id", removedIds);
    if (error) throw error;
  }
  const { data: persisted, error: verifyError } = await client
    .from("feed_schedule")
    .select("hour, minute, duration_sec")
    .eq("user_id", userId)
    .order("hour")
    .order("minute");
  if (verifyError) throw verifyError;
  const saved = parseSchedule(persisted);
  if (JSON.stringify(saved) !== JSON.stringify(desired)) {
    throw new Error("The saved schedule changed. Reload and try again.");
  }
  return saved;
}
