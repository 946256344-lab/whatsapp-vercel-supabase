import { createClient } from "@supabase/supabase-js";
import { optionalEnv, requiredEnv } from "./env";

export function createServiceClient() {
  const serverKey = optionalEnv("SUPABASE_SERVER_KEY") || requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(requiredEnv("SUPABASE_URL"), serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-app-secret": requiredEnv("APP_DB_SECRET"),
      },
    },
  });
}
