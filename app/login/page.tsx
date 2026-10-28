import { redirect } from "next/navigation";
import FormLogin from "@/components/login/FormLogin";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authAvailable = isSupabaseConfigured();
  if (authAvailable) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }
  return (
    <FormLogin
      authAvailable={authAvailable}
      callbackError={(await searchParams).error === "callback"}
    />
  );
}
