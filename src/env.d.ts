/// <reference types="astro/client" />

import type { AuthenticatedUserWithProfile } from "./lib/auth/session";

declare global {
  namespace App {
    interface Locals {
      user: AuthenticatedUserWithProfile | null;

      profile: AuthenticatedUserWithProfile["profile"] | null;
    }
  }

  interface ImportMetaEnv {
    readonly SUPABASE_URL: string;
    readonly SUPABASE_ANON_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
