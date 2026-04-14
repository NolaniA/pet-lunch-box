import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  console.log(token);

  if (!token) {
    return Response.json({ error: "no token" }, { status: 400 });
  }

  // 1. หา user_id
  const { data: userData } = await supabase
    .from("user_data")
    .select("user_id")
    .eq("device_token", token)
    .single();

  if (!userData) {
    return Response.json({ error: "invalid token" }, { status: 401 });
  }

  // 2. ดึง schedule
  const { data: schedule } = await supabase
    .from("feed_schedule")
    .select("hour, minute, duration_sec")
    .eq("user_id", userData.user_id)
    .order("hour");

  return Response.json(schedule);
}