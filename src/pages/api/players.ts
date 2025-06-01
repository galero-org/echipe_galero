import { supabase } from "../../lib/supabase";
import { playerService } from "../../services/playersService";
import type { APIRoute } from "astro";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Not authenticated", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log(profile);

  try {
    const data = await playerService.getAll(profile!.role);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Not authenticated", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log(profile);

  if (profile?.role !== "admin") return jsonError("Unauthorized", 403);

  const body = await request.json();

  try {
    const newPlayer = await playerService.create(body);
    return new Response(JSON.stringify(newPlayer), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Not authenticated", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return jsonError("Unauthorized", 403);

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return jsonError("Missing player ID", 400);

  try {
    const updatedPlayer = await playerService.update(id, updates);
    return new Response(JSON.stringify(updatedPlayer), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonError("Not authenticated", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return jsonError("Unauthorized", 403);

  const body = await request.json();
  const { id } = body;

  if (!id) return jsonError("Missing player ID", 400);

  try {
    await playerService.remove(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return jsonError(msg, 500);
  }
};
