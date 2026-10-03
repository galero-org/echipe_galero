import { supabase } from "../supabase";
import type { APIContext } from "astro";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "../types";

export type AuthenticatedUserWithProfile = SupabaseUser & {
  profile: UserProfile;
};

interface SessionResult {
  session: AuthenticatedUserWithProfile | null;
  error?: { message: string; status?: number };
}

type CookieContext = Pick<APIContext, "cookies">;

const COOKIE_PATH = "/";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function normalizeProfile(user: SupabaseUser): UserProfile {
  const profileMetadata = (user.user_metadata || {}) as Partial<UserProfile> & {
    picture?: string;
  };

  const profile: UserProfile = {
    id: user.id,
    email: user.email || profileMetadata.email || "",
    username:
      profileMetadata.username ||
      user.email?.split("@")[0] ||
      `user_${user.id.slice(0, 8)}`,
    full_name:
      profileMetadata.full_name || profileMetadata.username || user.email || "",
    // Supabase populează atât "avatar_url" cât și "picture" pentru
    // autentificarea prin Google — încercăm ambele chei.
    avatar_url: profileMetadata.avatar_url || profileMetadata.picture || null,
    // "phone" e un câmp nativ Supabase (numărul verificat prin SMS),
    // separat de user_metadata.
    phone: user.phone || profileMetadata.phone || null,
    user_role: profileMetadata.user_role || "user",
    linked_player_id: profileMetadata.linked_player_id || null,
    created_at:
      profileMetadata.created_at || user.created_at || new Date().toISOString(),
  } as UserProfile;

  (profile as UserProfile & { userRole?: string }).userRole = profile.user_role;
  return profile;
}

export async function getAuthenticatedSession(
  accessToken: string,
  refreshToken: string,
): Promise<SessionResult> {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data?.user) {
    return {
      session: null,
      error: {
        message: error?.message || "Nicio dată de utilizator returnată.",
        status: error?.status,
      },
    };
  }

  const user = data.user;
  return {
    session: {
      ...user,
      profile: normalizeProfile(user),
    },
  };
}

export function writeAuthCookies(
  cookies: CookieContext["cookies"],
  data: { accessToken: string; refreshToken: string },
) {
  cookies.set("sb-access-token", data.accessToken, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: import.meta.env.PROD,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  cookies.set("sb-refresh-token", data.refreshToken, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: import.meta.env.PROD,
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export function clearAuthCookies(cookies: CookieContext["cookies"]) {
  cookies.delete("sb-access-token", { path: COOKIE_PATH });
  cookies.delete("sb-refresh-token", { path: COOKIE_PATH });
}
