import { supabase } from "../lib/supabase";
import type { Registration } from "../lib/types";

export async function getEditionIdByNumarEditie(numar_editie: number) {
  const { data, error } = await supabase
    .from("editions")
    .select("id")
    .eq("numar_editie", numar_editie)
    .single();

  if (error || !data) {
    throw new Error("Ediția nu a fost găsită.");
  }

  return data.id;
}

export async function getPlayersRegistrations(playerName: string) {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      `
      edition_id,
      players!inner(full_name)
    `,
    )
    .eq("players.full_name", playerName)
    .eq("status", "inscris");

  if (error) {
    console.error("Eroare la preluarea înregistrărilor jucătorului:", error);
    return { totalEditions: 0, error };
  }

  if (!data || data.length === 0) {
    return { totalEditions: 0, error: null };
  }

  const distinctEditionIds = [...new Set(data.map((reg) => reg.edition_id))];

  return {
    totalEditions: distinctEditionIds.length,
    error: null,
  };
}

export async function getPrezenteSiRetrageriPeJucator() {
  const { data, error } = await supabase.rpc("get_player_stats");

  if (error) {
    console.error("Eroare la obținerea statisticilor:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getConfirmari(numarEditie: number) {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      `
      id,
      status,
      registered_at,
      players(id, full_name),
      edition_id,
      editions!inner(numar_editie)
    `,
    )
    .eq("editions.numar_editie", numarEditie)
    .order("registered_at", { ascending: true });

  if (error || !data) {
    return { data: null, error };
  }

  return { data, error: null };
}

export async function insertConfirmare(registration: {
  status: string;
  registered_at: string;
  player_id: string;
  numar_editie: number;
}) {
  const edition_id = await getEditionIdByNumarEditie(registration.numar_editie);

  const { data: insertedData, error: insertError } = await supabase
    .from("registrations")
    .insert([
      {
        status: registration.status,
        registered_at: registration.registered_at,
        player_id: registration.player_id,
        edition_id: edition_id,
      },
    ])
    .select();

  if (insertError || !insertedData || insertedData.length === 0) {
    return { data: null, error: insertError };
  }

  // Fetch the complete registration with player data
  const { data: completeData, error: selectError } = await supabase
    .from("registrations")
    .select(
      `
      id,
      status,
      registered_at,
      players(id, full_name),
      edition_id
    `,
    )
    .eq("id", insertedData[0].id)
    .single();

  return { data: completeData, error: selectError };
}

// ✅ UPDATE - Actualizează o confirmare existentă
export async function updateConfirmare(
  id: string,
  updates: Partial<Registration>,
) {
  const { data, error } = await supabase
    .from("registrations")
    .update(updates)
    .eq("id", id);

  return { data, error };
}

// ✅ DELETE - Șterge o confirmare
export async function deleteConfirmare(id: string) {
  const { data, error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id);

  return { data, error };
}
