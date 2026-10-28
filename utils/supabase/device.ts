import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

// No browser cookies or service-role key: the database RPC validates the device token.
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
