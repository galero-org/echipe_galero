import { supabase } from "../lib/supabase";
import type {
  EditionRelation,
  PlayerRelation,
  Registration,
} from "../lib/types";

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : (relation ?? null);
}

export async function getLatestEditionNumber(): Promise<number | null> {
  const { data, error } = await supabase
    .from("editions")
    .select("numar_editie")
    .order("numar_editie", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.numar_editie ?? null;
}

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

export async function getAllPlayersPresenceCounts() {
  const { data, error } = await supabase
    .from("registrations")
    .select(
      `
      player_id
    `,
    )
    .eq("status", "inscris");

  if (error || !data) {
    console.error("Eroare la preluarea prezențelor:", error);
    return { presenceMap: new Map<string, number>(), error };
  }

  const presenceMap = new Map<string, number>();

  for (const registration of data) {
    presenceMap.set(
      registration.player_id,
      (presenceMap.get(registration.player_id) || 0) + 1,
    );
  }

  return { presenceMap, error: null };
}

export async function getLastPresenceForPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("registrations")
    .select("registered_at, edition_id, editions!inner(*)")
    .eq("player_id", playerId)
    .eq("status", "inscris")
    .order("registered_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { last: null, edition: null, error };
  }

  // Setăm ziua de azi la ora 00:00:00 pentru o comparație strictă pe ZILE
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getEditionDate = (item: (typeof data)[0]) => {
    const edition = firstRelation(
      item.editions as EditionRelation | EditionRelation[] | null,
    );
    const rawDate =
      edition?.date ||
      edition?.data ||
      edition?.created_at ||
      item.registered_at;

    if (!rawDate) return null;

    const d = new Date(rawDate);
    d.setHours(0, 0, 0, 0); // Eliminăm ora și de aici
    return d;
  };

  const selectedRegistration = data.find((registration) => {
    const editionDate = getEditionDate(registration);
    return editionDate !== null && editionDate < today;
  });

  if (!selectedRegistration) {
    return { last: null, edition: null, error: null };
  }

  const last = selectedRegistration.registered_at || null;
  const selectedEdition = firstRelation(
    selectedRegistration.editions as EditionRelation | EditionRelation[] | null,
  );
  const edition = selectedEdition
    ? {
        id: selectedRegistration.edition_id,
        numar_editie: selectedEdition.numar_editie ?? null,
        date:
          selectedEdition.date ||
          selectedEdition.data ||
          selectedEdition.created_at ||
          null,
      }
    : null;

  return { last, edition, error: null };
}

// Return a list of players with their last presence timestamp.
// Prefer registrations from editions that already happened (past editions).
export async function getPlayersLastPresence() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Fetch registrations where the edition date is in the past (or today)
  const { data: registrations, error: errorPast } = await supabase
    .from("registrations")
    .select(
      "player_id, registered_at, edition_id, players(id, full_name), editions(*)",
    )
    .eq("status", "inscris")
    .order("registered_at", { ascending: false });

  const map = new Map<
    string,
    {
      id: string;
      full_name: string;
      last: string | null;
      lastEditionNum?: number | null;
      lastEditionDate?: string | null;
    }
  >();

  if (!errorPast && registrations) {
    for (const row of registrations) {
      const edition = firstRelation(
        row.editions as EditionRelation | EditionRelation[] | null,
      );
      const player = firstRelation(
        row.players as PlayerRelation | PlayerRelation[] | null,
      );
      const rawDate = edition?.date || edition?.data || edition?.created_at;
      const editionDate = rawDate ? new Date(rawDate) : null;
      editionDate?.setHours(0, 0, 0, 0);
      if (!editionDate || editionDate >= now) continue;

      const pid = row.player_id;
      if (!map.has(pid)) {
        const lastEditionNum = edition?.numar_editie ?? null;
        const lastEditionDate =
          edition?.date || edition?.created_at || edition?.data || null;
        map.set(pid, {
          id: pid,
          full_name: player?.full_name || "Unknown",
          last: row.registered_at,
          lastEditionNum,
          lastEditionDate,
        });
      }
    }
  }

  // Ensure all players are present in the result (players with no past presence get last = null)
  const { data: allPlayers, error: playersError } = await supabase
    .from("players")
    .select("id, full_name");

  if (playersError || !allPlayers)
    return { list: [], error: playersError || null };

  for (const p of allPlayers) {
    if (!map.has(p.id)) {
      map.set(p.id, {
        id: p.id,
        full_name: p.full_name || "Unknown",
        last: null,
        lastEditionNum: null,
        lastEditionDate: null,
      });
    }
  }

  return { list: Array.from(map.values()), error: null };
}

// Return players whose last presence is older than thresholdDays
export async function getPlayersWithoutRecentPresence(thresholdDays: number) {
  const { list, error } = await getPlayersLastPresence();
  if (error) return { players: [], error };

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

  const stale = list.filter((p) => {
    const referenceDate = p.lastEditionDate || p.last;
    if (!referenceDate) return true;
    return new Date(referenceDate) < thresholdDate;
  });

  return { players: stale, error: null };
}
