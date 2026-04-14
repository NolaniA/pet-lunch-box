import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

//   if (!user) return </>;

  const { data } = await supabase
    .from("feed_schedule")
    .select("hour, minute, duration_sec, id")
    .eq("user_id", user?.id)
    .order("hour");


  return Response.json(data);
}