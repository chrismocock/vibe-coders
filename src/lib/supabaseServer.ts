import { createClient } from "@supabase/supabase-js";

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const keyToUse = serviceRoleKey || anonKey;
  if (!url || !keyToUse) {
    throw new Error("Supabase env vars are missing");
  }
  // Uses service role key on the server if provided; never expose it to the browser.
  return createClient(url, keyToUse, { auth: { persistSession: false } });
}


