import type { APIRoute } from "astro";
import { requireAuthAndRole } from "../../lib/authHelpers";
// Importă funcția ajutătoare - ajustează calea dacă este necesar

export const GET: APIRoute = async (context) => {
  // 'context' este APIContext
  // Apelează requireAuthAndRole. Deoarece nu specificăm roluri,
  // va verifica doar dacă utilizatorul este autentificat și are un profil.
  const { user: userProfile, errorResponse } = requireAuthAndRole(context);

  // Dacă errorResponse există, înseamnă că utilizatorul nu este autentificat
  // sau profilul nu a putut fi încărcat (funcția returnează 401 în acest caz).
  if (errorResponse) {
    return errorResponse; // Returnează răspunsul de eroare (401 JSON)
  }

  // Dacă nu există errorResponse, atunci userProfile este garantat a fi obiectul UserProfile.
  // Nu mai este nevoie de verificarea 'if (context.locals.profile)' aici,
  // deoarece requireAuthAndRole a făcut deja această validare.
  return new Response(JSON.stringify(userProfile), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
