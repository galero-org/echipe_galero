// src/lib/supabaseAdmin.ts
import {
  createClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";

const realtimeTransport = (await import("ws"))
  .default as unknown as WebSocketLikeConstructor;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Supabase URL or Service Role Key is not defined in environment variables."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: realtimeTransport,
  },
});
