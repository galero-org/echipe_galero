// src/pages/api/admin-users.ts
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify(data.users), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
