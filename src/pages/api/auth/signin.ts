import type { APIRoute } from "astro";
import type { Provider } from "@supabase/supabase-js";

import { supabase } from "../../../lib/supabase";
import { writeAuthCookies } from "../../../lib/auth/session";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();
  const redirectTo = import.meta.env.PUBLIC_SUPABASE_REDIRECT;

  const validProviders = ["google"];

  if (provider && validProviders.includes(provider)) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("[SignIn] OAuth error:", error.message);
      return redirect("/signin?error=oauth_failed");
    }

    return redirect(data.url);
  }

  if (!email || !password) {
    return redirect("/signin?error=missing_credentials");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[SignIn] Password sign-in error:", error.message);
    return redirect("/signin?error=invalid_credentials");
  }

  const { access_token, refresh_token } = data.session;

  writeAuthCookies(cookies, {
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  return redirect("/profil");
};
