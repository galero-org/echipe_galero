import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { clearAuthCookies } from "../../../lib/auth/session";

const signOut: APIRoute = async ({ cookies, redirect }) => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("[SignOut] Supabase signOut failed", error);
  }

  clearAuthCookies(cookies);

  return redirect("/signin");
};

export const GET = signOut;
export const POST = signOut;
