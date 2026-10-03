import type { APIContext } from "astro";
import type { UserProfile } from "./types";

type AuthContext = Pick<APIContext, "locals">;

export const STAFF_ROLES: Array<UserProfile["user_role"]> = [
  "admin",
  "moderator",
];

interface AuthResult {
  user: UserProfile | null;
  errorResponse?: Response;
}

/**
 * Verifică dacă utilizatorul este autentificat (prin prezența astro.locals.user și astro.locals.profile)
 * și dacă profilul utilizatorului are unul dintre rolurile permise.
 *
 * Se bazează pe `astro.locals.user` (obiectul User din Supabase) și `astro.locals.profile` (obiectul UserProfile specific aplicației)
 * care ar trebui populate de către middleware-ul tău.
 *
 * @param astro Obiectul global Astro, disponibil în middleware, rute API și frontmatter-ul paginilor .astro.
 * @param allowedRoles Un array opțional de roluri permise. Dacă este gol, se verifică doar autentificarea.
 * @returns Un obiect AuthResult conținând profilul utilizatorului sau un errorResponse.
 */
export function requireAuthAndRole(
  astro: AuthContext,
  allowedRoles: Array<UserProfile["user_role"]> = [],
): AuthResult {
  const userFromLocals = astro.locals.user;
  const profileFromLocals = astro.locals.profile;

  if (!userFromLocals || !profileFromLocals) {
    return {
      user: null, // Nu există profil de returnat
      errorResponse: new Response(
        JSON.stringify({ error: "Neautentificat sau profilul lipsește" }),
        {
          status: 401, // Unauthorized
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profileFromLocals.user_role)
  ) {
    return {
      user: profileFromLocals,
      errorResponse: new Response(
        JSON.stringify({ error: "Acces interzis: Rol insuficient" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { user: profileFromLocals, errorResponse: undefined };
}
