import { supabase } from "./supabase"; // Asigură-te că ai configurat exportul supabase în ./supabase.ts
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "./types"; // Asigură-te că tipul UserProfile este definit corect în ./types.ts

interface SessionResult {
  user: SupabaseUser | null;
  error?: { message: string; status?: number };
}

/**
 * Setează și validează sesiunea Supabase folosind token-urile furnizate.
 * @param accessToken Token-ul de acces Supabase.
 * @param refreshToken Token-ul de reîmprospătare Supabase.
 * @returns Un obiect conținând utilizatorul Supabase sau o eroare.
 */
export async function manageAuthSession(
  accessToken: string,
  refreshToken: string
): Promise<SessionResult> {
  console.log("[AuthService] Încercare de a seta sesiunea Supabase.");
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.warn(
      "[AuthService] Eroare la supabase.auth.setSession:",
      error.message
    );
    return {
      user: null,
      error: { message: error.message, status: error.status },
    };
  }
  if (!data?.user) {
    console.warn(
      "[AuthService] setSession a reușit, dar nu a returnat date despre utilizator."
    );
    return {
      user: null,
      error: { message: "Nicio dată de utilizator returnată după setSession." },
    };
  }
  console.log(
    `[AuthService] Sesiune Supabase setată cu succes pentru utilizatorul: ${data.user.id}`
  );
  return { user: data.user, error: undefined };
}

/**
 * Prelucrează profilul specific aplicației pentru un utilizator Supabase autentificat.
 * @param authUser Obiectul utilizator Supabase (rezultatul autentificării).
 * @returns Obiectul UserProfile specific aplicației sau null în caz de eroare/neprofil.
 */
export async function fetchApplicationUserProfile(
  authUser: SupabaseUser
): Promise<UserProfile | null> {
  if (!authUser) {
    console.warn(
      "[AuthService] fetchApplicationUserProfile apelat fără authUser."
    );
    return null;
  }

  console.log(
    `[AuthService] Preluare profil din DB pentru utilizatorul: ${authUser.id}`
  );
  try {
    const { data: dbProfile, error: dbProfileError } = await supabase
      .from("profiles")
      .select("role") // Asigură-te că selectezi toate câmpurile necesare pentru UserProfile
      .eq("id", authUser.id)
      .single();

    if (dbProfileError) {
      console.warn(
        `[AuthService] Eroare la preluarea profilului din DB pentru utilizatorul ${authUser.id}:`,
        dbProfileError.message
      );
      return null; // Returnează null dacă există o eroare la interogarea bazei de date
    }
    if (!dbProfile) {
      console.warn(
        `[AuthService] Profilul nu a fost găsit în DB pentru utilizatorul ${authUser.id}. Utilizatorul ar putea fi nou.`
      );
      // Poți alege să creezi un profil implicit aici sau să returnezi null
      // și să lași alte părți ale aplicației să gestioneze acest caz.
      return null;
    }

    console.log(
      `[AuthService] Profil din DB găsit pentru utilizatorul ${authUser.id}. Se construiește UserProfile.`
    );
    // Construiește obiectul UserProfile
    const userProfile: UserProfile = {
      id: authUser.id,
      username:
        dbProfile.username ||
        authUser.user_metadata?.full_name ||
        authUser.email!,
      avatar_url:
        authUser.user_metadata?.avatar_url || dbProfile.avatar_url || null,
      role: dbProfile.role as UserProfile["role"], // Este important ca 'role' să existe în dbProfile
      created_at: authUser.created_at,
      email: authUser.email, // Poate fi null dacă nu este expus de Supabase Auth sau nu e în user_metadata
      phone: dbProfile.phone,
      full_name: dbProfile.full_name || authUser.user_metadata?.full_name,
    };
    return userProfile;
  } catch (e: any) {
    console.error(
      "[AuthService] Excepție în timpul preluării profilului utilizatorului:",
      e.message,
      e.stack
    );
    return null;
  }
}
