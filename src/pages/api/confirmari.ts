import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import {
  getConfirmari,
  insertConfirmare,
  updateConfirmare,
  deleteConfirmare,
} from "../../services/confirmariService";

export const GET: APIRoute = async ({ request }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  const url = new URL(request.url);
  const edition_id_str = url.searchParams.get("editionId");

  if (!edition_id_str || isNaN(parseInt(edition_id_str))) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid editionId" }),
      {
        status: 400,
      }
    );
  }

  const edition_id = parseInt(edition_id_str);
  const { data, error } = await getConfirmari(edition_id);

  console.log(data);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const { status, registered_at, player_id, numar_editie } = body;

  if (numar_editie === undefined) {
    return new Response(JSON.stringify({ error: "Missing edition_id" }), {
      status: 400,
    });
  }

  const { data, error } = await insertConfirmare({
    status,
    registered_at,
    player_id,
    numar_editie,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();

  const { id, ...updates } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID for update" }), {
      status: 400,
    });
  }

  const { data, error } = await updateConfirmare(id, updates);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();

  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID for deletion" }), {
      status: 400,
    });
  }

  const { data, error } = await deleteConfirmare(id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  });
};
