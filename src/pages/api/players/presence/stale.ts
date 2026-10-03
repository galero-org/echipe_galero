import type { APIRoute, APIContext } from "astro";
import { getPlayersWithoutRecentPresence } from "../../../../services/confirmariService";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/players/presence/stale?days=60
export const GET: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;
  if (!user || !profile) return jsonError("Not authenticated", 401);

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 60;
  if (isNaN(days) || days < 0) return jsonError("Invalid days parameter", 400);

  try {
    const { players, error } = await getPlayersWithoutRecentPresence(days);
    if (error) throw error;
    return new Response(
      JSON.stringify({ days, count: players.length, players }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export default GET;
