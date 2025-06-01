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

// Optional: GET a single player by ID
export const GET: APIRoute = async ({ params, locals }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = params;

  if (!user) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required", 400);

  // You might still want a profile check here depending on requirements
  // const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  // if (!profile) return jsonError("Profile not found", 404);

  try {
    const player = await playerService.getById(
      id /*, profile.role (optional) */
    );
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
export const PUT: APIRoute = async ({ request, params }: APIContext) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = params;

  if (!user) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required in URL path", 400);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return jsonError("Profile not found for auth check", 404);
  if (profile.role !== "admin" && profile.role !== "moderator")
    return jsonError("Unauthorized to update player", 403);

  try {
    const updates = await request.json();
    // Add validation for updates here if needed
    if (Object.keys(updates).length === 0) {
      return jsonError("No update data provided", 400);
    }

    const updatedPlayer = await playerService.update(id, updates);
    if (!updatedPlayer)
      return jsonError("Player not found or update failed", 404); // Or playerService.update throws

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
  // const { data: { user } } = await supabase.auth.getUser(); // Or use locals
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { id } = params;

  if (!user) return jsonError("Not authenticated", 401);
  if (!id) return jsonError("Player ID is required in URL path", 400);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) return jsonError("Profile not found for auth check", 404);
  if (profile.role !== "admin")
    return jsonError("Unauthorized to delete player", 403);

  try {
    const result = await playerService.remove(id); // Assume remove throws if not found or returns a status
    // If playerService.remove doesn't throw on "not found" but returns null/false:
    // if (!result) return jsonError("Player not found or delete failed", 404);

    return new Response(
      JSON.stringify({ success: true, message: "Player deleted successfully" }),
      {
        status: 200, // Or 204 No Content with an empty body
        headers: { "Content-Type": "application/json" },
      }
    );
    // Alternative for 204:
    // return new Response(null, { status: 204 });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unexpected error deleting player";
    console.error(msg, err);
    // Handle specific errors, e.g., if playerService.remove indicates "not found" via error
    if (msg.toLowerCase().includes("not found")) {
      // Example check
      return jsonError("Player not found", 404);
    }
    return jsonError(msg, 500);
  }
};
