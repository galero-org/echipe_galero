// src/lib/authService.ts
import { supabase } from "./supabase"; // Ajustează calea
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "./types"; // Tipul tău UserProfile

// Extindem tipul de bază al utilizatorului Supabase
export type AuthenticatedUserWithProfile = SupabaseUser & {
  profile: UserProfile;
};

interface SessionResult {
  session: AuthenticatedUserWithProfile | null;
  error?: { message: string; status?: number };
}

/**
 * ⚡ OPTIMIZAT: Setează și validează sesiunea Supabase
 * și extrage datele profilului din metadatele User.
 * Elimină al doilea apel la tabela 'profiles'.
 */
export async function getAuthenticatedSession(
  accessToken: string,
  refreshToken: string,
): Promise<SessionResult> {
  console.log("[AuthService] Tentativă de a seta sesiunea (Single-Call).");

  // UN SINGUR APEL LA SUPABASE AUTH
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data?.user) {
    console.warn(
      "[AuthService] Eroare la setSession sau lipsă user:",
      error?.message || "User missing",
    );
    return {
      session: null,
      error: {
        message: error?.message || "Nicio dată de utilizator returnată.",
        status: error?.status,
      },
    };
  }

  const user = data.user;

  // Extragem profilul direct din metadata sincronizată de trigger
  let profileMetadata = user.user_metadata as Partial<UserProfile>;

  // FALLBACK: Dacă metadata lipsește (de ex. pentru utilizatori creați înainte de trigger),
  // setăm valorile implicite
  if (!profileMetadata) {
    profileMetadata = {};
  }

  // ⚠️ IMPORTANT: Asigură că au user_role, username, etc.
  if (!profileMetadata.user_role) {
    console.warn(
      `[AuthService] User ${user.id} autentificat, dar user_role lipsește din metadata. Setez default: 'user'`,
    );
    profileMetadata.user_role = "user";
  }

  if (!profileMetadata.username) {
    profileMetadata.username =
      user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`;
  }

  if (!profileMetadata.full_name) {
    profileMetadata.full_name =
      user.user_metadata?.full_name || profileMetadata.username;
  }

  if (!profileMetadata.email) {
    profileMetadata.email = user.email;
  }

  if (!profileMetadata.id) {
    profileMetadata.id = user.id;
  }

  if (!profileMetadata.created_at) {
    profileMetadata.created_at = user.created_at || new Date().toISOString();
  }

  // Alias for camelCase usage across the codebase
  // (some modules expect `userRole` while metadata uses `user_role`)
  try {
    (profileMetadata as any).userRole = profileMetadata.user_role;
  } catch (e) {
    // ignore
  }

  // Construim obiectul final, complet și rapid
  const sessionWithProfile: AuthenticatedUserWithProfile = {
    ...user,
    profile: profileMetadata as UserProfile,
  };

  return { session: sessionWithProfile, error: undefined };
}

// ATENȚIE: Șterge funcțiile vechi manageAuthSession și fetchApplicationUserProfile
