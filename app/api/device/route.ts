import { createDeviceClient } from "@/utils/supabase/device";
import { json } from "@/lib/http";
import { parseSchedule } from "@/lib/schedule";
import { isMissingRpc } from "@/lib/supabase-errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const bearer = request.headers.get("authorization");
  // Query token remains supported for existing v4 devices.
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice(7)
    : new URL(request.url).searchParams.get("token");
  if (
    !token ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  ) {
    return json({ error: "A valid device token is required." }, 401);
  }
  try {
    const supabase = createDeviceClient();
    const { data, error } = await supabase.rpc("get_device_schedule", {
      p_token: token,
    });
    if (isMissingRpc(error)) {
      // Match the original firmware API on existing databases, with the same
      // anonymous client and RLS permissions; never use a service-role key.
      const { data: profile, error: profileError } = await supabase
        .from("user_data")
        .select("user_id")
        .eq("device_token", token)
        .single();
      if (profileError && profileError.code !== "PGRST116")
        return json({ error: "Unable to load schedule." }, 503);
      if (!profile) return json({ error: "Invalid device token." }, 401);
      const { data: meals, error: mealsError } = await supabase
        .from("feed_schedule")
        .select("hour, minute, duration_sec")
        .eq("user_id", profile.user_id)
        .order("hour")
        .order("minute");
      if (mealsError) return json({ error: "Unable to load schedule." }, 503);
      return json(parseSchedule(meals));
    }
    if (error)
      return json(
        {
          error:
            error.code === "28000"
              ? "Invalid device token."
              : "Unable to load schedule.",
        },
        error.code === "28000" ? 401 : 503,
      );
    return json(parseSchedule(data));
  } catch {
    return json({ error: "Unable to load schedule." }, 503);
  }
}
