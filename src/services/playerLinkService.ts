import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import type { PlayerLinkCandidate } from "../lib/types";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || "";
}

function normalizeName(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("ro-RO") || "";
}

export async function findPlayerMatches(user: SupabaseUser) {
  const email = normalizeEmail(user.email);
  const phone = normalizePhone(user.phone);
  const name = normalizeName(
    (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined),
  );
  const { data, error } = await supabaseAdmin
    .from("players")
    .select("id, full_name, email, phone, position, linked_user_id")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  const matches = (data ?? [])
    .filter(
      (player) => !player.linked_user_id || player.linked_user_id === user.id,
    )
    .map((player): PlayerLinkCandidate | null => {
      const reasons: PlayerLinkCandidate["match_reasons"] = [];
      let score = 0;
      const emailMatch =
        !!user.email_confirmed_at &&
        !!email &&
        normalizeEmail(player.email) === email;
      const phoneMatch =
        !!user.phone_confirmed_at &&
        !!phone &&
        normalizePhone(player.phone) === phone;
      const nameMatch = !!name && normalizeName(player.full_name) === name;

      if (emailMatch) {
        score += 100;
        reasons.push("email_confirmat");
      }
      if (phoneMatch) {
        score += 90;
        reasons.push("telefon_confirmat");
      }
      if (nameMatch) {
        score += 50;
        reasons.push("nume");
      }
      if (score === 0) return null;

      return {
        id: player.id,
        full_name: player.full_name,
        email: player.email,
        phone: player.phone,
        position: player.position,
        score,
        match_reasons: reasons,
      };
    })
    .filter((player): player is PlayerLinkCandidate => player !== null)
    .sort((left, right) => right.score - left.score);

  const topScore = matches[0]?.score ?? 0;
  const topMatches = matches.filter((player) => player.score === topScore);
  return {
    players: matches,
    suggested_player:
      topMatches.length === 1 && topScore >= 90 ? topMatches[0] : null,
  };
}
