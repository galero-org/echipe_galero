// src/pages/api/admin-users.ts
import type { APIRoute } from "astro";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../lib/supabaseAdmin"; // Folosește clientul admin pentru listarea utilizatorilor

export const GET: APIRoute = async ({ locals }) => {
  const currentRole = locals.profile?.user_role;
  if (currentRole !== "admin" && currentRole !== "moderator") {
    console.warn(
      "Acces neașteptat la API-ul admin-users de către un non-admin.",
    );
    return new Response(JSON.stringify({ error: "Acces neautorizat." }), {
      status: 403,
    });
  }

  const users: SupabaseUser[] = [];
  const listErrors: string[] = [];
  const pageSize = 100;
  const fetchUsersPage = async (page: number, perPage: number) => {
    let pageUsers: SupabaseUser[] = [];
    let pageError: { message: string } | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (!result.error) {
        pageUsers = result.data.users;
        return { users: pageUsers, error: null };
      }
      pageError = result.error;
    }
    return { users: pageUsers, error: pageError };
  };

  for (let page = 1; page <= 1000; page += 1) {
    const result = await fetchUsersPage(page, pageSize);
    if (result.error) {
      let reachedEnd = false;
      const firstSingleUserPage = (page - 1) * pageSize + 1;

      for (let offset = 0; offset < pageSize; offset += 1) {
        const singleResult = await fetchUsersPage(
          firstSingleUserPage + offset,
          1,
        );
        if (singleResult.error) {
          listErrors.push(
            `utilizatorul de pe poziția ${firstSingleUserPage + offset}: ${singleResult.error.message}`,
          );
          continue;
        }
        if (singleResult.users.length === 0) {
          reachedEnd = true;
          break;
        }
        users.push(...singleResult.users);
      }

      if (reachedEnd) break;
      continue;
    }
    if (result.users.length === 0) break;
    users.push(...result.users);
  }

  if (listErrors.length > 0) {
    console.error("Erori la paginarea utilizatorilor:", listErrors);
  }

  const userIds = users.map((u) => u.id);
  const profileRoles = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles") // Accesează tabela 'profiles'
      .select("id, role") // Selectează ID-ul și rolul
      .in("id", userIds);

    if (profilesError) {
      console.error(
        "Eroare la preluarea profilelor pentru utilizatorii listați:",
        profilesError.message,
      );
      // Poți decide să continui fără roluri sau să returnezi o eroare parțială.
      // Pentru simplitate, continuăm fără rolurile din 'profiles' în caz de eroare aici.
    } else if (profilesData) {
      profilesData.forEach((profile) =>
        profileRoles.set(profile.id, profile.role),
      );
    }
  }

  let usersWithAppRoles = users.map((user) => ({
    id: user.id,
    email: user.email,
    phone: user.phone,
    full_name:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined),
    app_role: (profileRoles.get(user.id) ||
      (user.user_metadata?.user_role as string | undefined) ||
      (user.app_metadata?.role as string | undefined) ||
      "user") as "admin" | "moderator" | "user",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
    providers: user.app_metadata?.providers as string[] | undefined,
  }));

  if (currentRole === "moderator") {
    usersWithAppRoles = usersWithAppRoles.filter(
      (user) => user.app_role === "user",
    );
  }

  return new Response(
    JSON.stringify({ users: usersWithAppRoles, warnings: listErrors }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
