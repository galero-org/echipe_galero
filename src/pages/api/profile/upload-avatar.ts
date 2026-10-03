import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { requireAuthAndRole } from "../../../lib/authHelpers";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_FILE_SIZE_BYTES,
} from "../../../lib/avatar";

const BUCKET_NAME = "avatars";

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async (context) => {
  const { user: userProfile, errorResponse } = requireAuthAndRole(context);
  if (errorResponse) return errorResponse;
  // Dacă am ajuns aici, requireAuthAndRole a garantat că userProfile nu e null.
  const userId = userProfile!.id;

  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return jsonError("Cerere invalidă.", 400);
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return jsonError("Niciun fișier trimis.", 400);
  }

  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type)) {
    return jsonError("Format neacceptat. Folosește JPG, PNG sau WEBP.", 400);
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    return jsonError("Fișierul depășește limita de 5MB.", 400);
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/avatar.${fileExt}`;

  // Ștergem orice avatar vechi al userului (poate avea altă extensie decât
  // cel nou) ca să nu rămână fișiere orfane în bucket la fiecare schimbare.
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    const pathsToRemove = existingFiles.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from(BUCKET_NAME).remove(pathsToRemove);
  }

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Eroare la upload avatar:", uploadError);
    return jsonError("Eroare la încărcarea imaginii.", 500);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Cache-bust: fără parametrul ?v=, browserul/CDN-ul poate continua să
  // servească poza veche la exact același URL după un upsert.
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateError) {
    console.error("Eroare la actualizarea profilului:", updateError);
    return jsonError(
      "Poza a fost încărcată, dar profilul nu a putut fi actualizat.",
      500,
    );
  }

  return new Response(JSON.stringify({ avatar_url: avatarUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
