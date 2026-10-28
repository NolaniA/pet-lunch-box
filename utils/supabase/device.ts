import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

// Use only the device token and existing database permissions; no user cookies or service-role key.
export function createDeviceClient() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
