import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/", origin));
    } catch {
      // Show a recoverable error on the sign-in page.
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
