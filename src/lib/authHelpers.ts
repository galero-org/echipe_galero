// src/lib/authHelpers.ts
import type { AstroGlobal } from "astro";
// Asigură-te că UserProfile este importat corect și conține proprietatea 'role'
import type { UserProfile } from "./types"; // Presupunând că types.ts este în același director (src/lib/)

// Acest UserProfile este cel pe care îl populează middleware-ul în astro.locals.profile
// și include proprietatea 'role'.

interface AuthResult {
  /** Profilul utilizatorului aplicației, dacă autentificarea și autorizarea au succes. */
  user: UserProfile | null;
  /** Un obiect Response gata de returnat în caz de eroare (401 sau 403), util pentru rute API. */
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
  astro: AstroGlobal, // Tipul simplificat și corect pentru contextul Astro
  allowedRoles: Array<UserProfile["role"]> = []
): AuthResult {
  // TypeScript ar trebui să infereze corect tipurile pentru userFromLocals și profileFromLocals
  // bazându-se pe augmentarea din src/env.d.ts:
  // declare module "astro" {
  //   interface Astro {
  //     locals: {
  //       user: SupabaseUser | null; // Tipul User din @supabase/supabase-js
  //       profile: UserProfile | null; // Tipul tău UserProfile din ./lib/types
  //     };
  //   }
  // }
  const userFromLocals = astro.locals.user;
  const profileFromLocals = astro.locals.profile;

  // Verifică dacă atât utilizatorul Supabase, cât și profilul aplicației sunt prezenți în locals.
  // Prezența lor indică faptul că middleware-ul a autentificat cu succes utilizatorul
  // și a reușit (sau cel puțin a încercat) să încarce profilul.
  if (!userFromLocals || !profileFromLocals) {
    return {
      user: null, // Nu există profil de returnat
      errorResponse: new Response(
        JSON.stringify({ error: "Neautentificat sau profilul lipsește" }),
        {
          status: 401, // Unauthorized
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  // Din acest punct, profileFromLocals este garantat a fi un obiect UserProfile valid (nu null).

  // Verifică rolul, dacă este specificat un set de roluri permise.
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(profileFromLocals.role)
  ) {
    return {
      user: profileFromLocals, // Returnează profilul existent, chiar dacă rolul nu e potrivit
      errorResponse: new Response(
        JSON.stringify({ error: "Acces interzis: Rol insuficient" }),
        {
          status: 403, // Forbidden
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  // Autentificare și autorizare (dacă allowedRoles a fost specificat) cu succes.
  return { user: profileFromLocals, errorResponse: undefined };
}
