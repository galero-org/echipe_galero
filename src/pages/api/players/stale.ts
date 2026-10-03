import type { APIRoute, APIContext } from "astro";
import { playerService } from "../../../services/playersService";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/players/stale?days=30
export const GET: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;
  if (!user || !profile) return jsonError("Not authenticated", 401);

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 30;
  if (isNaN(days) || days < 0) return jsonError("Invalid days parameter", 400);

  try {
    const stale = await playerService.getStalePlayers(days);
    return new Response(JSON.stringify({ days, count: stale.length, players: stale }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export default GET;
