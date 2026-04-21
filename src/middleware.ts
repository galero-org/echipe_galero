// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
// Am schimbat importul pentru a folosi noua funcție optimizată
import { getAuthenticatedSession } from "./lib/authService";
// Importă noul tip pentru a avea acces la profile.user_role
import type { APIContext } from "astro";

const publicPaths = [
  "/",
  "/signin",
  "/register",
  "/about",
  "/api/auth/signin",
  "/api/auth/register",
  "/api/auth/callback",
  "/api/auth/signout",
];

// Folosim PREFIXE pentru a acoperi TOATE sub-rutele de admin
const adminPathPrefixes = [
  "/admin", // Prinde /admin, /admin/users, /admin/settings, etc.
  "/api/admin-users", // Prinde /api/admin-users, /api/admin-users/delete/1, etc.
];

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  let currentPath = context.url.pathname;
  if (currentPath !== "/" && currentPath.endsWith("/")) {
    currentPath = currentPath.slice(0, -1);
  }

  // Inițializare locals
  context.locals.user = null;
  context.locals.profile = null;

  // 1. Verificare Căi Publice (Meci Exact)
  const isPublic = publicPaths.includes(currentPath);

  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // Dacă avem token-uri încercăm să validăm sesiunea și să populăm `locals`.
  // Facem asta chiar și pentru pagini publice, ca Navbar/Layout să poată afișa starea corectă.
  if (accessToken && refreshToken) {
    try {
      const { session, error } = await getAuthenticatedSession(
        accessToken,
        refreshToken
      );

      if (!error && session) {
        context.locals.user = session;
        context.locals.profile = session.profile;
      } else {
        // Dacă sesiunea nu e validă și nu suntem pe o pagină publică, forțăm re-login.
        if (!isPublic) {
          context.cookies.delete("sb-access-token", { path: "/" });
          context.cookies.delete("sb-refresh-token", { path: "/" });
          return context.redirect(
            `/signin?error=session_expired_mw&from=${encodeURIComponent(
              currentPath
            )}`
          );
        }
        // Daca e public, pur și simplu continuăm fără profile.
      }
    } catch (err) {
      // În caz de eroare la validare a token-ului, comportament similar: dacă ruta e protejată, redirect.
      console.error("[MW] Eroare validare token public-path check:", err);
      if (!isPublic) {
        context.cookies.delete("sb-access-token", { path: "/" });
        context.cookies.delete("sb-refresh-token", { path: "/" });
        return context.redirect(
          `/signin?error=internal_error&from=${encodeURIComponent(currentPath)}`
        );
      }
    }
  } else {
    // Nu sunt token-uri
    if (!isPublic) {
      return context.redirect(`/signin?from=${encodeURIComponent(currentPath)}`);
    }
  }

  // 3. Verificare Autorizare (Rol de Admin)
  const isAdminPath = adminPathPrefixes.some((prefix) =>
    currentPath.startsWith(prefix)
  );

  if (isAdminPath) {
    const userRole = context.locals.profile?.userRole || context.locals.profile?.user_role;
    if (userRole !== "admin") {
      console.warn(`[MW] Acces admin INTERZIS pentru la ${currentPath} (rol: ${userRole})`);
      if (currentPath.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Acces interzis: Rol insuficient" }), {
          status: 403,
        });
      }
      return context.redirect("/profil?error=unauthorized_admin_access");
    }
  }

  // 4. Totul este în regulă
  return next();
});
