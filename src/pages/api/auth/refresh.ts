import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { clearAuthCookies, writeAuthCookies } from "../../../lib/auth/session";

export const POST: APIRoute = async ({ cookies }) => {
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!refreshToken) {
    clearAuthCookies(cookies);
    return new Response(
      JSON.stringify({ ok: false, error: "missing_refresh_token" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    clearAuthCookies(cookies);
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || "refresh_failed" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  writeAuthCookies(cookies, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
