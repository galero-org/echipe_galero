// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import {
  manageAuthSession,
  fetchApplicationUserProfile,
} from "./lib/authService"; // Asigură-te că căile sunt corecte

const publicPaths = [
  "/",
  "/signin",
  "/register",
  "/about",
  "/api/auth/signin",
  "/api/auth/register",
  "/api/auth/callback",
  "/api/auth/signout",
  // Adaugă aici alte rute publice dacă este cazul
];

// Definește căile care necesită rol de admin
const adminPaths = [
  "/admin", // Poate fi o pagină de sumar pentru admin
  "/admin/users", // Pagina pentru lista de utilizatori
  "/api/admin-users", // API endpoint-ul pentru lista de utilizatori
  // Adaugă aici alte rute specifice adminului
];

export const onRequest = defineMiddleware(async (context, next) => {
  let currentPath = context.url.pathname;
  // Normalizare cale (elimină trailing slash dacă nu e rădăcina)
  if (currentPath !== "/" && currentPath.endsWith("/")) {
    currentPath = currentPath.slice(0, -1);
  }

  context.locals.user = null;
  context.locals.profile = null;

  const isPublic = publicPaths.some((path) => currentPath === path);
  const isAdminPath = adminPaths.some((path) => currentPath === path);

  if (isPublic && !isAdminPath) {
    // O cale poate fi publică dar totuși gestionată specific dacă e și admin (ex: un API public de status admin)
    return next();
  }

  // Pentru toate căile non-publice sau căile de admin, verificăm token-urile
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (!accessToken || !refreshToken) {
    if (isPublic) return next(); // Permite accesul la rute publice chiar dacă token-urile lipsesc și nu e admin path
    return context.redirect(
      `/signin?from=${encodeURIComponent(context.url.pathname)}`
    );
  }

  try {
    const sessionResult = await manageAuthSession(accessToken, refreshToken);

    if (sessionResult.error || !sessionResult.user) {
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
      if (isPublic) return next();
      return context.redirect(
        `/signin?error=session_expired_mw&from=${encodeURIComponent(
          context.url.pathname
        )}`
      );
    }

    const authUser = sessionResult.user;
    context.locals.user = authUser;
    const appUserProfile = await fetchApplicationUserProfile(authUser);
    context.locals.profile = appUserProfile;

    // Verificare specifică pentru căile de admin
    if (isAdminPath) {
      if (!appUserProfile || appUserProfile.role !== "admin") {
        // Dacă utilizatorul nu e admin, redirecționează sau returnează eroare
        // Pentru pagini, redirect e mai bun; pentru API, un 403.
        if (currentPath.startsWith("/api/")) {
          return new Response(
            JSON.stringify({ error: "Acces interzis: Rol insuficient" }),
            { status: 403 }
          );
        }
        return context.redirect("/profil?error=unauthorized_admin_access"); // Sau o pagină dedicată "/unauthorized"
      }
    }
    // Dacă e o cale protejată (nu publică, nu admin) și nu există profil (deși user există)
    // s-ar putea să vrei o logică suplimentară aici, dar de obicei fetchApplicationUserProfile ar trebui să reușească.
    else if (!isPublic && !appUserProfile) {
      // Caz rar: utilizator autentificat în Supabase, dar fără profil în DB-ul aplicației.
      console.warn(
        `[MW] Utilizator ${authUser.id} autentificat dar fără profil în aplicație.`
      );
      // Poți decide să redirecționezi la o pagină de completare profil sau să permiți acces limitat.
      // Pentru moment, dacă nu e publică și nu e admin, și nu are profil, e posibil să fie o eroare de configurare.
      // Redirecționare la signin ar putea fi o opțiune sigură.
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
      return context.redirect(
        `/signin?error=profile_missing&from=${encodeURIComponent(
          context.url.pathname
        )}`
      );
    }

    return next();
  } catch (err: any) {
    console.error(
      `[MW] Eroare în middleware pentru ${currentPath}:`,
      err.message
    );
    context.cookies.delete("sb-access-token", { path: "/" });
    context.cookies.delete("sb-refresh-token", { path: "/" });
    // Nu redirecționa dacă eroarea e pe o cale publică unde next() ar fi fost apelat oricum.
    if (!isPublic) {
      return context.redirect(
        `/signin?error=internal_error&from=${encodeURIComponent(
          context.url.pathname
        )}`
      );
    }
    // Pentru rute publice, eroarea ar putea fi din manageAuthSession, dar userul ar trebui să poată vedea pagina.
    // Sau, dacă eroarea e gravă, un răspuns 500 general.
    return new Response(`Eroare internă de server în middleware.`, {
      status: 500,
    });
  }
});
