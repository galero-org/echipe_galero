import type { APIRoute, APIContext } from "astro";
import { getPlayersWithoutRecentPresence } from "../../../../services/confirmariService";
import { playerService } from "../../../../services/playersService";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/players/flag/stale?days=90
export const POST: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;
  if (!user || !profile) return jsonError("Not authenticated", 401);

  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : 90;
    if (!Number.isInteger(days) || days <= 0) {
      return jsonError("days must be a positive integer", 400);
    }

    const { players, error } = await getPlayersWithoutRecentPresence(days);
    if (error) throw error;

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const p of players) {
      try {
        await playerService.setFlag(p.id, true);
        results.push({ id: p.id, ok: true });
      } catch (e: any) {
        results.push({ id: p.id, ok: false, error: e?.message || String(e) });
      }
    }

    return new Response(
      JSON.stringify({ days, total: players.length, results }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export default POST;
