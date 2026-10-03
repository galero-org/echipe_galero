import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { writeAuthCookies } from "../../../lib/auth/session";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error || errorDescription) {
    console.error("[Callback] OAuth error:", error, errorDescription);
    return redirect(
      `/eroare?e=${encodeURIComponent(error || "Auth Error")}&d=${encodeURIComponent(errorDescription || "Unknown error")}`,
    );
  }

  if (!authCode) {
    return new Response("No code provided, and no explicit error.", {
      status: 400,
    });
  }

  const { data, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(authCode);

  if (sessionError) {
    console.error("[Callback] Session exchange error:", sessionError.message);
    return redirect(
      `/eroare?e=${encodeURIComponent("Supabase Session Error")}&d=${encodeURIComponent(sessionError.message)}`,
    );
  }

  const { access_token, refresh_token } = data.session;

  writeAuthCookies(cookies, {
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  return redirect("/profil");
};
