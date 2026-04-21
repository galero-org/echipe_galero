import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (error || errorDescription) {
    // Redirecționează către o pagină de eroare cu parametrii corespunzători
    return redirect(
      `/eroare?e=${encodeURIComponent(error || "Auth Error")}&d=${encodeURIComponent(errorDescription || "Unknown error")}`
    );
  }

  // GESTIONAREA CALLBACK-ULUI DE SUCCES
  if (!authCode) {
    // Dacă nu există nici cod, nici eroare explicită
    return new Response("No code provided, and no explicit error.", {
      status: 400,
    });
  }

  // 2. SCHIMBĂ CODUL CU SESIUNEA
  const { data, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(authCode);

  if (sessionError) {
    // GESTIONAREA ERORILOR DE LA exchangeCodeForSession
    return redirect(
      `/eroare?e=${encodeURIComponent("Supabase Session Error")}&d=${encodeURIComponent(sessionError.message)}`
    );
  }

  const { access_token, refresh_token } = data.session;

  cookies.set("sb-access-token", access_token, {
    path: "/",
    httpOnly: true, // Recomandat pentru securitate
    secure: import.meta.env.PROD, // Setează `secure: true` doar în producție
    maxAge: 60 * 60 * 24 * 7, // 1 săptămână
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
    httpOnly: true, // Recomandat pentru securitate
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 7,
  });

  return redirect("/profil");
};
