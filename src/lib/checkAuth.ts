import { supabase } from "./supabase";

export async function checkAuth(Astro: any) {
  const accessToken = Astro.cookies.get("sb-access-token");
  const refreshToken = Astro.cookies.get("sb-refresh-token");

  if (!accessToken?.value || !refreshToken?.value) {
    return { redirect: true };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (error || !data?.user) {
    Astro.cookies.delete("sb-access-token", { path: "/" });
    Astro.cookies.delete("sb-refresh-token", { path: "/" });
    return { redirect: true };
  }

  return { user: data.user };
}
