import type { APIRoute } from "astro";
import { requireAuthAndRole } from "../../../lib/authHelpers";
import { findPlayerMatches } from "../../../services/playerLinkService";

export const GET: APIRoute = async (context) => {
  const { errorResponse } = requireAuthAndRole(context);
  if (errorResponse) return errorResponse;

  const user = context.locals.user;
  if (!user) return new Response("Neautentificat.", { status: 401 });

  const matches = await findPlayerMatches(user);

  return new Response(JSON.stringify(matches), {
    headers: { "Content-Type": "application/json" },
  });
};
