export interface Player {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  grade: number;
  created_at?: string;
  position: PlayerField;
  totalEditions: number;
}

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

export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  user_role: UserRole;
  created_at: string;
  phone?: string;
  full_name?: string;
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
