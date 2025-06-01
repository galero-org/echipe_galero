import { supabase } from "../lib/supabase";

export const playerService = {
  async getAll(role: string) {
    const selectFields = role === "admin" ? "*" : "id,full_name";

    const { data, error } = await supabase
      .from("players")
      .select(selectFields)
      .order("grade", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
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

  async create(player: any) {
    const { data, error } = await supabase
      .from("players")
      .insert(player)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(id: string, updates: any) {
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
};
