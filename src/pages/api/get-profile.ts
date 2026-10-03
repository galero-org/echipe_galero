import type { APIRoute } from "astro";
import { requireAuthAndRole } from "../../lib/authHelpers";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const GET: APIRoute = async (context) => {
  // 'context' este APIContext
  // Apelează requireAuthAndRole. Deoarece nu specificăm roluri,
  // va verifica doar dacă utilizatorul este autentificat și are un profil.
  const { user: userProfile, errorResponse } = requireAuthAndRole(context);

  // Dacă errorResponse există, înseamnă că utilizatorul nu este autentificat
  // sau profilul nu a putut fi încărcat (funcția returnează 401 în acest caz).
  if (errorResponse) {
    return errorResponse; // Returnează răspunsul de eroare (401 JSON)
  }

  // Dacă nu există errorResponse, atunci userProfile este garantat a fi obiectul UserProfile.
  // Nu mai este nevoie de verificarea 'if (context.locals.profile)' aici,
  // deoarece requireAuthAndRole a făcut deja această validare.
  const currentUserId = context.locals.user?.id;
  let linkedPlayer = null;

  if (currentUserId) {
    const { data: player } = await supabaseAdmin
      .from("players")
      .select("id, full_name, position")
      .eq("linked_user_id", currentUserId)
      .maybeSingle();

    if (player) {
      const { count } = await supabaseAdmin
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("player_id", player.id)
        .eq("status", "inscris");
      linkedPlayer = { ...player, total_presences: count || 0 };
    }
  }

  return new Response(
    JSON.stringify({
      ...userProfile,
      linked_player_id: linkedPlayer?.id || null,
      linked_player: linkedPlayer,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
