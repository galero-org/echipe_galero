import { defineMiddleware } from "astro:middleware";
import { getAuthenticatedSession, clearAuthCookies } from "./lib/auth/session";
import type { APIContext } from "astro";

const publicPaths = [
  "/",
  "/signin",
  "/register",
  "/about",
  "/api/auth/signin",
  "/api/auth/register",
  "/api/auth/callback",
  "/api/auth/refresh",
  "/api/auth/signout",
];

const staffPathPrefixes = ["/admin", "/api/admin-users"];

export const onRequest = defineMiddleware(async (context: APIContext, next) => {
  let currentPath = context.url.pathname;
  if (currentPath !== "/" && currentPath.endsWith("/")) {
    currentPath = currentPath.slice(0, -1);
  }

  context.locals.user = null;
  context.locals.profile = null;

  const isPublic = publicPaths.includes(currentPath);
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    try {
      const { session, error } = await getAuthenticatedSession(
        accessToken,
        refreshToken,
      );

      if (!error && session) {
        context.locals.user = session;
        context.locals.profile = session.profile;
      } else if (!isPublic) {
        try {
          const refreshResponse = await fetch(
            `${context.url.origin}/api/auth/refresh`,
            {
              method: "POST",
              headers: { cookie: context.request.headers.get("cookie") || "" },
            },
          );

          if (refreshResponse.ok) {
            const { session: refreshedSession, error: refreshError } =
              await getAuthenticatedSession(
                context.cookies.get("sb-access-token")?.value || "",
                context.cookies.get("sb-refresh-token")?.value || "",
              );

            if (!refreshError && refreshedSession) {
              context.locals.user = refreshedSession;
              context.locals.profile = refreshedSession.profile;
            } else {
              clearAuthCookies(context.cookies);
              return context.redirect(
                `/signin?error=session_expired_mw&from=${encodeURIComponent(currentPath)}`,
              );
            }
          } else {
            clearAuthCookies(context.cookies);
            return context.redirect(
              `/signin?error=session_expired_mw&from=${encodeURIComponent(currentPath)}`,
            );
          }
        } catch (refreshErr) {
          console.error("[MW] Refresh attempt failed", refreshErr);
          clearAuthCookies(context.cookies);
          return context.redirect(
            `/signin?error=internal_error&from=${encodeURIComponent(currentPath)}`,
          );
        }
      }
    } catch (err) {
      console.error("[MW] Error validating token", err);
      if (!isPublic) {
        clearAuthCookies(context.cookies);
        return context.redirect(
          `/signin?error=internal_error&from=${encodeURIComponent(currentPath)}`,
        );
      }
    }
  } else if (!isPublic) {
    return context.redirect(`/signin?from=${encodeURIComponent(currentPath)}`);
  }

  const isStaffPath = staffPathPrefixes.some((prefix) =>
    currentPath.startsWith(prefix),
  );

  if (isStaffPath) {
    const userRole = context.locals.profile?.user_role;
    if (userRole !== "admin" && userRole !== "moderator") {
      console.warn(
        `[MW] Staff access denied for ${currentPath} (role: ${userRole})`,
      );

      if (currentPath.startsWith("/api/")) {
        return new Response(
          JSON.stringify({ error: "Acces interzis: Rol insuficient" }),
          {
            status: 403,
          },
        );
      }

      return context.redirect("/profil?error=unauthorized_staff_access");
    }
  }

  return next();
});
