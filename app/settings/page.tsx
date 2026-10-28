import { redirect } from "next/navigation";
import SettingApi from "@/components/settings/SettingApi";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const dynamic = "force-dynamic";

export default async function Settings() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <SettingApi />;
}
