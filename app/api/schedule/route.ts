import { createClient } from "@/utils/supabase/server";
import { isSameOrigin, json } from "@/lib/http";
import { parseSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return json({ error: "Sign in to view your schedule." }, 401);
    const { data, error } = await supabase
      .from("feed_schedule")
      .select("hour, minute, duration_sec")
      .eq("user_id", user.id)
      .order("hour")
      .order("minute");
    if (error) return json({ error: "Unable to load schedule." }, 503);
    return json(parseSchedule(data));
  } catch {
    return json({ error: "Unable to load schedule." }, 503);
  }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return json({ error: "Sign in to save your schedule." }, 401);
    const body = await request.text();
    if (body.length > 4096)
      return json({ error: "Schedule is too large." }, 413);
    let schedule;
    try {
      schedule = parseSchedule(JSON.parse(body));
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Invalid schedule." },
        400,
      );
    }
    const { data, error } = await supabase.rpc("replace_feed_schedule", {
      p_schedule: schedule,
    });
    if (error)
      return json({ error: "Unable to save schedule. Try again." }, 503);
    return json(parseSchedule(data));
  } catch {
    return json({ error: "Unable to save schedule. Try again." }, 503);
  }
}
