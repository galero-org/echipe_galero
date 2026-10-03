import type { APIRoute, APIContext } from "astro";
import { playerService } from "../../../services/playersService";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/players/flag
export const POST: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;
  if (!user || !profile) return jsonError("Not authenticated", 401);
  if (profile.user_role !== "admin" && profile.user_role !== "moderator") {
    return jsonError("Unauthorized to update player flags", 403);
  }

  try {
    const body = await request.json();
    const playerId = body?.playerId;
    const flagged = !!body?.flagged;
    if (!playerId) return jsonError("playerId is required", 400);

    const updated = await playerService.setFlag(playerId, flagged);
    return new Response(JSON.stringify({ player: updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export default POST;
