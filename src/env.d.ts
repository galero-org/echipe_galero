/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "./lib/types"; // Adică din src/lib/types.ts

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      profile: UserProfile | null;
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
