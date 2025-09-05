// src/pages/api/admin-users.ts
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabaseAdmin"; // Folosește clientul admin pentru listarea utilizatorilor

export const GET: APIRoute = async ({ locals }) => {
  if (locals.profile?.role !== "admin") {
    console.warn(
      "Acces neașteptat la API-ul admin-users de către un non-admin."
    );
    return new Response(JSON.stringify({ error: "Acces neautorizat." }), {
      status: 403,
    });
  }

  const { data: usersData, error: listUsersError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listUsersError) {
    console.error(
      "Eroare la listarea utilizatorilor (admin):",
      listUsersError.message
    );
    return new Response(
      JSON.stringify({
        error: "Nu s-au putut prelua utilizatorii.",
        details: listUsersError.message,
      }),
      { status: 500 }
    );
  }

  const users = usersData.users || [];
  const userIds = users.map((u) => u.id);
  let usersWithAppRoles = [...users]; // Inițializăm cu datele de bază

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles") // Accesează tabela 'profiles'
      .select("id, role") // Selectează ID-ul și rolul
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Eroare la preluarea profilelor pentru utilizatorii listați:",
        profilesError.message
      );
      // Poți decide să continui fără roluri sau să returnezi o eroare parțială.
      // Pentru simplitate, continuăm fără rolurile din 'profiles' în caz de eroare aici.
    } else if (profilesData) {
      usersWithAppRoles = users.map((user) => {
        const profile = profilesData.find((p) => p.id === user.id);
        return {
          ...user,
          // Adăugăm rolul din 'profiles' dacă există, altfel încercăm din app_metadata
          app_role:
            profile?.role ||
            (user.app_metadata?.role as string) ||
            (Array.isArray(user.app_metadata?.roles)
              ? (user.app_metadata.roles[0] as string)
              : "N/A"),
        };
      });
    }
  }

  return new Response(JSON.stringify(usersWithAppRoles), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
