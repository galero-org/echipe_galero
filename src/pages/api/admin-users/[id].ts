import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import type { UserRole } from "../../../lib/types";

const validRoles: UserRole[] = ["user", "moderator", "admin"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const PATCH: APIRoute = async ({ params, locals, request }) => {
  const currentRole = locals.profile?.user_role;
  if (currentRole !== "admin" && currentRole !== "moderator") {
    return jsonResponse({ error: "Acces neautorizat." }, 403);
  }

  const userId = params.id;
  if (!userId) return jsonResponse({ error: "ID utilizator lipsă." }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Cerere JSON invalidă." }, 400);
  }

  const newRole =
    typeof body === "object" && body !== null && "role" in body
      ? (body as { role?: unknown }).role
      : undefined;

  const playerId =
    typeof body === "object" && body !== null && "player_id" in body
      ? (body as { player_id?: unknown }).player_id
      : undefined;

  if (
    newRole !== undefined &&
    (typeof newRole !== "string" || !validRoles.includes(newRole as UserRole))
  ) {
    return jsonResponse({ error: "Rol invalid." }, 400);
  }

  if (
    playerId !== undefined &&
    playerId !== null &&
    typeof playerId !== "string"
  ) {
    return jsonResponse({ error: "Player invalid." }, 400);
  }

  if (newRole === undefined && playerId === undefined) {
    return jsonResponse({ error: "Nu există modificări." }, 400);
  }

  if (
    currentRole === "moderator" &&
    newRole !== undefined &&
    newRole !== "user"
  ) {
    return jsonResponse(
      { error: "Moderatorii pot gestiona doar utilizatori simpli." },
      403,
    );
  }

  const { data: targetUser, error: targetError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (targetError || !targetUser.user) {
    return jsonResponse({ error: "Utilizatorul nu a fost găsit." }, 404);
  }

  const targetRole =
    (targetUser.user.user_metadata?.user_role as string | undefined) ||
    (targetUser.user.app_metadata?.role as string | undefined) ||
    "user";
  if (currentRole === "moderator" && targetRole !== "user") {
    return jsonResponse(
      { error: "Moderatorii pot gestiona doar utilizatori simpli." },
      403,
    );
  }

  if (newRole !== undefined) {
    const metadata = {
      ...targetUser.user.user_metadata,
      user_role: newRole,
    };
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      });

    if (updateError) {
      return jsonResponse({ error: "Rolul nu a putut fi actualizat." }, 500);
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (profileError) {
      return jsonResponse(
        { error: "Profilul nu a putut fi sincronizat." },
        500,
      );
    }
  }

  if (playerId !== undefined) {
    if (playerId) {
      const { data: player, error: playerError } = await supabaseAdmin
        .from("players")
        .select("id, full_name, email, phone, position, linked_user_id")
        .eq("id", playerId)
        .maybeSingle();
      if (playerError || !player) {
        return jsonResponse({ error: "Jucătorul nu a fost găsit." }, 404);
      }
      if (player.linked_user_id && player.linked_user_id !== userId) {
        return jsonResponse({ error: "Jucătorul este deja asociat." }, 409);
      }
    }

    const { error: unlinkError } = await supabaseAdmin
      .from("players")
      .update({ linked_user_id: null })
      .eq("linked_user_id", userId);
    if (unlinkError)
      return jsonResponse(
        { error: "Linkul curent nu a putut fi eliminat." },
        500,
      );

    if (playerId) {
      const { error: linkError } = await supabaseAdmin
        .from("players")
        .update({ linked_user_id: userId })
        .eq("id", playerId);
      if (linkError)
        return jsonResponse({ error: "Jucătorul nu a putut fi asociat." }, 500);
    }
  }

  return jsonResponse({
    id: userId,
    email: targetUser.user.email,
    app_role: newRole ?? targetRole,
    linked_player_id: playerId === undefined ? undefined : playerId,
  });
};

export const GET: APIRoute = async ({ params, locals }) => {
  const currentRole = locals.profile?.user_role;
  if (currentRole !== "admin" && currentRole !== "moderator") {
    return jsonResponse({ error: "Acces neautorizat." }, 403);
  }

  const userId = params.id;
  if (!userId) return jsonResponse({ error: "ID utilizator lipsă." }, 400);

  const { data: targetUser, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !targetUser.user) {
    return jsonResponse({ error: "Utilizatorul nu a fost găsit." }, 404);
  }

  const targetRole =
    (targetUser.user.user_metadata?.user_role as string | undefined) ||
    (targetUser.user.app_metadata?.role as string | undefined) ||
    "user";
  if (currentRole === "moderator" && targetRole !== "user") {
    return jsonResponse(
      { error: "Moderatorii pot vedea doar utilizatori simpli." },
      403,
    );
  }

  const { data: linkedPlayer } = await supabaseAdmin
    .from("players")
    .select("id, full_name, email, phone, position")
    .eq("linked_user_id", userId)
    .maybeSingle();

  return jsonResponse({
    id: targetUser.user.id,
    email: targetUser.user.email,
    phone: targetUser.user.phone,
    full_name:
      targetUser.user.user_metadata?.full_name ||
      targetUser.user.user_metadata?.name,
    app_role: targetRole,
    created_at: targetUser.user.created_at,
    last_sign_in_at: targetUser.user.last_sign_in_at,
    email_confirmed_at: targetUser.user.email_confirmed_at,
    providers: targetUser.user.app_metadata?.providers,
    linked_player: linkedPlayer,
  });
};
