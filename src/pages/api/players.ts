import { playerService } from "../../services/playersService";
import type { APIRoute, APIContext } from "astro";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/players
 * Preia toți jucătorii.
 * Autorizarea e gestionată de middleware.
 */
export const GET: APIRoute = async ({ locals }: APIContext) => {
  const { user, profile } = locals;

  if (!user || !profile) {
    return jsonError("Not authenticated (middleware failed)", 401);
  }

  try {
    const data = await playerService.getAll(profile.user_role);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

/**
 * POST /api/players
 * Creează un jucător nou. Doar pentru admini.
 */
export const POST: APIRoute = async ({ request, locals }: APIContext) => {
  const { user, profile } = locals;

  if (!user || !profile) {
    return jsonError("Not authenticated (middleware failed)", 401);
  }

  // Middleware-ul ar trebui să blocheze accesul la /api/admin-users
  // Dar dacă /api/players e ruta (și nu /api/admin-users),
  // e bine să avem o verificare de rol și aici, ca dublă siguranță.
  // Folosim 'userRole' pe care l-am definit în middleware.
  if (profile.user_role !== "admin") {
    return jsonError("Unauthorized: Admin access required", 403);
  }

  const body = await request.json();

  // TODO: Adaugă validare pentru 'body' aici folosind Zod sau altceva.
  // Nu te încrede niciodată în datele primite de la client.

  try {
    const newPlayer = await playerService.create(body);
    return new Response(JSON.stringify(newPlayer), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    // S-ar putea să vrei să gestionezi erorile de validare (ex: 400 Bad Request)
    return jsonError(msg, 500);
  }
};
