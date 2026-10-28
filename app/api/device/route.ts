import { createDeviceClient } from "@/utils/supabase/device";
import { json } from "@/lib/http";
import { parseSchedule } from "@/lib/schedule";

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
    const { data, error } = await createDeviceClient().rpc(
      "get_device_schedule",
      { p_token: token },
    );
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
