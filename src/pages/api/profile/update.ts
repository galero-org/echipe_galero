import type { APIRoute } from "astro";
import { requireAuthAndRole } from "../../../lib/authHelpers";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const PATCH: APIRoute = async (context) => {
  const { errorResponse } = requireAuthAndRole(context);
  if (errorResponse) return errorResponse;

  const user = context.locals.user;
  if (!user) return jsonError("Neautentificat.", 401);

  try {
    const body = await context.request.json();
    const fullName =
      typeof body?.full_name === "string" ? body.full_name.trim() : undefined;
    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : undefined;

    if (fullName === undefined && phone === undefined) {
      return jsonError("Nu există date editabile.", 400);
    }
    if (
      fullName !== undefined &&
      (fullName.length < 2 || fullName.length > 100)
    ) {
      return jsonError(
        "Numele trebuie să aibă între 2 și 100 de caractere.",
        400,
      );
    }
    if (phone !== undefined && phone.length > 30) {
      return jsonError("Numărul de telefon este prea lung.", 400);
    }

    const metadata: Record<string, string> = {};
    if (fullName !== undefined) metadata.full_name = fullName;
    if (phone !== undefined) metadata.phone = phone;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: metadata },
    );

    if (error) return jsonError("Profilul nu a putut fi actualizat.", 500);

    return new Response(JSON.stringify({ success: true, user: data.user }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonError("Cerere invalidă.", 400);
  }
};
