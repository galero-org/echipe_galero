export interface Player {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  grade: number;
  created_at?: string;
  updated_at?: string;
  nota_updated_at?: string;
  flagged?: boolean;
  position: PlayerField;
  totalEditions: number;
}

export type PlayerWritePayload = Partial<Player> & Record<string, unknown>;

export interface EditionRelation {
  id?: string;
  numar_editie?: number | null;
  date?: string | null;
  data?: string | null;
  created_at?: string | null;
}

export interface PlayerRelation {
  id: string;
  full_name: string;
}

export type EditablePlayerFields = Pick<
  Player,
  "full_name" | "email" | "phone" | "birthdate" | "grade" | "position"
>;

export interface PlayerPreferences {
  pairs?: [string, string][];
  separations?: [string, string][];
}
export interface Team {
  id?: string;
  name: string;
  players: Player[];
  totalGrade: number;
  averageGrade?: number;
  totalEditionsPlayed?: number;
  averageEditionsPlayed?: number;
  color?: string;
  created_at?: string;
  created_by?: string;
}

export type UserRole = "admin" | "moderator" | "user" | "guest";

export interface ManagedUser {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  app_role: UserRole;
  created_at: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  providers?: string[];
}

export interface ManagedUserDetail extends ManagedUser {
  linked_player: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    position?: PlayerField;
  } | null;
}

export interface PlayerLinkCandidate {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  position?: PlayerField;
  score: number;
  match_reasons: Array<"email_confirmat" | "telefon_confirmat" | "nume">;
}

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  user_role: UserRole;
  created_at: string;
  phone?: string;
  full_name?: string;
  linked_player_id?: string | null;
  linked_player?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    grade?: number;
    position?: PlayerField;
    total_presences?: number;
  } | null;
};

export type PlayerField = "GK" | "FIELD";

export type RegistrationStatus = "inscris" | "rezerva" | "retras";

export interface Registration {
  id: string;
  status: RegistrationStatus;
  registered_at: string;
  updated_at?: string;
  players: {
    id: string;
    full_name: string;
    grade?: number;
    email?: string;
  };
  user_id?: string;
  edition_id: string;
}
