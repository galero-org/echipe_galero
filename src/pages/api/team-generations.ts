import type { APIRoute, APIContext } from "astro";
import { supabase } from "../../lib/supabase";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/team-generations?edition_id=X
 * Preiau istoricul generărilor de echipe pentru o ediție
 */
export const GET: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;

  if (!user || !profile) {
    return jsonError("Not authenticated", 401);
  }

  const url = new URL(request.url);
  const edition_id = url.searchParams.get("edition_id");

  if (!edition_id) {
    return jsonError("Missing edition_id parameter", 400);
  }

  try {
    const { data, error } = await supabase
      .from("team_generations")
      .select(
        `
        id,
        edition_id,
        created_by_user_id,
        created_at,
        team_count,
        players_per_team,
        generated_teams,
        user_profile:created_by_user_id(username, full_name)
      `,
      )
      .eq("edition_id", edition_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

/**
 * POST /api/team-generations
 * Salvează o nouă generare de echipe
 */
export const POST: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;

  if (!user || !profile) {
    return jsonError("Not authenticated", 401);
  }

  try {
    const body = await request.json();
    const { edition_id, team_count, players_per_team, generated_teams } = body;

    if (!edition_id || !generated_teams) {
      return jsonError("Missing required fields", 400);
    }

    const { data, error } = await supabase
      .from("team_generations")
      .insert([
        {
          edition_id,
          created_by_user_id: user.id,
          created_at: new Date().toISOString(),
          team_count,
          players_per_team,
          generated_teams: JSON.stringify(generated_teams),
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};
