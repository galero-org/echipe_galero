import {
  createClient,
  type WebSocketLikeConstructor,
} from "@supabase/supabase-js";

const realtimeTransport = import.meta.env.SSR
  ? ((await import("ws")).default as unknown as WebSocketLikeConstructor)
  : undefined;

export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: "pkce",
    },
    realtime: {
      transport: realtimeTransport,
    },
  },
);
