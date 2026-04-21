// src/pages/api/players/[id].ts
import { supabase } from "../../../lib/supabase";
import { playerService } from "../../../services/playersService"; // Adjust path
import type { APIRoute, APIContext } from "astro";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET a single player by ID
export const GET: APIRoute = async ({ params, locals }: APIContext) => {
  const { user, profile } = locals; // <-- Luăm brățara de la portar
  const { id } = params;

  if (!user || !profile) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required", 400);

  // Aici poți adăuga logica de rol dacă e nevoie
  // de ex: if (profile.userRole !== 'admin' && player.private_data) { ... }
  // Dar pentru un simplu GET, probabil e ok.

  try {
    // Folosim direct rolul din profilul deja încărcat, dacă e necesar
    const player = await playerService.getById(id /*, profile.userRole */);

    if (!player) return jsonError("Player not found", 404);

    return new Response(JSON.stringify(player), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

// PUT (update) an existing player
export const PUT: APIRoute = async ({
  request,
  params,
  locals,
}: APIContext) => {
  const { user, profile } = locals; // <-- Magie!
  const { id } = params;

  if (!user || !profile) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required in URL path", 400);

  // Orice user autentificat poate actualiza jucători
  // (nu avem check de rol pentru update, doar pentru delete care e mai restrictiv)

  try {
    const updates = await request.json();
    if (Object.keys(updates).length === 0) {
      return jsonError("No update data provided", 400);
    }

    // Acum facem un singur drum la DB, pentru update
    const updatedPlayer = await playerService.update(id, updates);
    if (!updatedPlayer)
      return jsonError("Player not found or update failed", 404);

    return new Response(JSON.stringify(updatedPlayer), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unexpected error updating player";
    console.error(msg, err);
    return jsonError(msg, 500);
  }
};

// DELETE a player
export const DELETE: APIRoute = async ({ params, locals }: APIContext) => {
  const { user, profile } = locals; // <-- Folosim locals!
  const { id } = params;

  if (!user || !profile) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required in URL path", 400);

  // Verificarea rolului. Instant.
  if (profile.user_role !== "admin") {
    return jsonError("Unauthorized to delete player", 403);
  }

  try {
    // Un singur drum la DB, pentru ștergere
    await playerService.remove(id);

    return new Response(
      JSON.stringify({ success: true, message: "Player deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
    // Sau, dacă preferi 204:
    // return new Response(null, { status: 204 });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unexpected error deleting player";
    console.error(msg, err);
    if (msg.toLowerCase().includes("not found")) {
      return jsonError("Player not found", 404);
    }
    return jsonError(msg, 500);
  }
};
