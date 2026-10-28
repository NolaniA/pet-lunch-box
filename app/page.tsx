import FormInput from "@/components/form";
import AboutContent from "@/components/AboutContent";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured()) return <AboutContent />;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? <FormInput /> : <AboutContent />;
}
