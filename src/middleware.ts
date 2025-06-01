import type { MiddlewareHandler } from "astro";
import { supabase } from "./lib/supabase";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const accessToken = context.cookies.get("sb-access-token");
  const refreshToken = context.cookies.get("sb-refresh-token");

  const isProtected = context.url.pathname.startsWith("/dashboard"); // sau alt prefix

  if (!accessToken?.value || !refreshToken?.value) {
    if (isProtected) {
      return context.redirect("/signin");
    }
    return next(); // continuă fără sesiune
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (error || !data?.user) {
    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });
    return context.redirect("/signin");
  }

  return next();
};
