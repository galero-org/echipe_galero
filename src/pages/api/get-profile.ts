import { supabase } from "../../lib/supabase";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies }) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Resetează sesiunea cu cele două token-uri
  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

  if (sessionError) {
    return new Response(JSON.stringify({ error: "Session error" }), {
      status: 401,
    });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  console.log("Profile from DB:", profile, "Error:", profileError);

  if (error || !user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { full_name, avatar_url } = user.user_metadata;

  const userProfile = {
    id: user.id,
    username: full_name || user.email,
    avatar_url: avatar_url || null,
    role: profile!.role,
    created_at: user.created_at,
  };

  return new Response(JSON.stringify(userProfile));
};
