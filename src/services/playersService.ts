import { supabase } from "../lib/supabase";
import type { Player, PlayerWritePayload } from "../lib/types";

export const playerService = {
  async getAll(role: string): Promise<Player[]> {
    const selectFields = role === "admin" ? "*" : "id,full_name";

    const { data, error } = await supabase
      .from("players")
      .select(selectFields)
      .order("grade", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Player[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async create(player: PlayerWritePayload) {
    const { data, error } = await supabase
      .from("players")
      .insert(player)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, updates: PlayerWritePayload) {
    const { data, error } = await supabase
      .from("players")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },

  // Set a simple persistent flag on a player. Useful for marking long-absent players.
  async setFlag(id: string, flagged: boolean) {
    const { data, error } = await supabase
      .from("players")
      .update({ flagged })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async flagPlayers(ids: string[]) {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("players")
      .update({ flagged: true })
      .in("id", ids)
      .select();

    if (error) throw new Error(error.message);
    return data;
  },

  // Return players whose note (grade) was not updated within `thresholdDays`.
  async getStalePlayers(thresholdDays: number) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const { data, error } = await supabase
      .from("players")
      .select("id, full_name, nota_updated_at")
      .or(
        `nota_updated_at.is.null,nota_updated_at.lt.${thresholdDate.toISOString()}`,
      );

    if (error) throw new Error(error.message);
    return data;
  },

  // Return the `updated_at` timestamp for a single player id
  async getLastUpdated(id: string) {
    const { data, error } = await supabase
      .from("players")
      .select("updated_at")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data?.updated_at || null;
  },
};
