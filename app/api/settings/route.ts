import { randomUUID } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { isSameOrigin, json } from "@/lib/http";
import { isMissingRpc } from "@/lib/supabase-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return json({ error: "Sign in to manage your device." }, 401);
    const { data, error } = await supabase
      .from("user_data")
      .select("device_token")
      .eq("user_id", user.id)
      .single();
    if (error || !data)
      return json(
        {
          error: "Unable to load your device settings. Please try again later.",
        },
        503,
      );
    return json({ email: user.email, device_token: data.device_token });
  } catch {
    return json({ error: "Unable to load device settings." }, 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return json({ error: "Invalid request origin." }, 403);
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return json({ error: "Sign in to manage your device." }, 401);
    const { data, error } = await supabase.rpc("rotate_device_token");
    if (isMissingRpc(error)) {
      const token = randomUUID();
      const { data: profile, error: updateError } = await supabase
        .from("user_data")
        .update({ device_token: token })
        .eq("user_id", user.id)
        .select("device_token")
        .single();
      if (updateError || profile?.device_token !== token)
        return json({ error: "Unable to rotate device token." }, 503);
      return json({ device_token: token });
    }
    if (error || !data)
      return json({ error: "Unable to rotate device token." }, 503);
    return json({ device_token: data });
  } catch {
    return json({ error: "Unable to rotate device token." }, 503);
  }
}
