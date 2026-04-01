// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient(await cookies());
    await supabase.auth.exchangeCodeForSession(code); // 🔥 ตัวสำคัญ
  }

  return NextResponse.redirect(`${origin}/`);
}