import type { APIRoute, APIContext } from "astro";
import { getLastPresenceForPlayer } from "../../../../../src/services/confirmariService";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/players/presence/last?playerId=...
export const GET: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;
  if (!user || !profile) return jsonError("Not authenticated", 401);

  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId");
  if (!playerId) return jsonError("playerId is required", 400);

  try {
    const { last, edition, error } = await getLastPresenceForPlayer(playerId);
    if (error) throw error;
    return new Response(JSON.stringify({ playerId, last, edition }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export default GET;
