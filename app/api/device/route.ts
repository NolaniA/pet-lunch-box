import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  const { data } = await supabase
    .from("feed_schedule")
    .select("hour, minute, duration_sec")
    .eq("user_id", user_id)
    .order("hour");

  return Response.json(data);
}