"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
