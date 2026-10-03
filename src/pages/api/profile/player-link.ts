import type { APIRoute } from "astro";
import { requireAuthAndRole } from "../../../lib/authHelpers";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const normalizeEmail = (value: string | null | undefined) =>
  value?.trim().toLowerCase() || "";
const normalizePhone = (value: string | null | undefined) =>
  value?.replace(/\D/g, "") || "";

export const PATCH: APIRoute = async (context) => {
  const { errorResponse } = requireAuthAndRole(context);
  if (errorResponse) return errorResponse;

  const user = context.locals.user;
  if (!user) return new Response("Neautentificat.", { status: 401 });

  try {
    const body = await context.request.json();
    const playerId = body?.playerId;
    const currentEmail = normalizeEmail(user.email);
    const currentPhone = normalizePhone(user.phone);

    if (playerId !== null && typeof playerId !== "string") {
      return new Response(JSON.stringify({ error: "playerId invalid." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let linkedPlayer = null;
    if (playerId) {
      const { data: player, error } = await supabaseAdmin
        .from("players")
        .select("id, full_name, email, phone, position, linked_user_id")
        .eq("id", playerId)
        .maybeSingle();

      if (error || !player) {
        return new Response(JSON.stringify({ error: "Jucătorul nu există." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (player.linked_user_id && player.linked_user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Acest profil este deja asociat." }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }

      const emailMatches =
        !!user.email_confirmed_at &&
        currentEmail !== "" &&
        normalizeEmail(player.email) === currentEmail;
      const phoneMatches =
        !!user.phone_confirmed_at &&
        currentPhone !== "" &&
        normalizePhone(player.phone) === currentPhone;

      if (!emailMatches && !phoneMatches) {
        return new Response(
          JSON.stringify({ error: "Profilul nu poate fi verificat automat." }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
      const {
        email: _email,
        phone: _phone,
        linked_user_id: _linkedUserId,
        ...safePlayer
      } = player;
      linkedPlayer = safePlayer;
    }

    let playerUpdate = supabaseAdmin
      .from("players")
      .update({ linked_user_id: playerId ? user.id : null })
      .select("id, full_name, position");

    playerUpdate = playerId
      ? playerUpdate.eq("id", playerId)
      : playerUpdate.eq("linked_user_id", user.id);

    const { data: updatedPlayer, error: playerError } =
      await playerUpdate.maybeSingle();

    if (playerError) throw playerError;
    if (playerId && !updatedPlayer) {
      return new Response(
        JSON.stringify({ error: "Profilul nu a putut fi asociat." }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ linked_player: playerId ? linkedPlayer : null }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Cerere invalidă." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
