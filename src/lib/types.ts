// Reprezintă un jucător individual
export interface Player {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  birthdate?: string; // ISO date string: YYYY-MM-DD
  grade: number;
  created_at?: string; // ISO datetime
}

// Reprezintă o echipă formată din mai mulți jucători
export interface Team {
  id?: string;
  name: string;
  players: Player[];
  totalGrade: number;
  averageGrade?: number;
  color?: string; // hex (#FFAA00) sau nume ('blue')
  created_at?: string;
  created_by?: string; // user id
}

// Informații despre profilul unui utilizator
export type UserProfile = {
  id: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  role: "admin" | "moderator" | "user";
  created_at: string;
  phone?: string;
  full_name?: string;
};

// Posibilele stări ale unei înscrieri
export type RegistrationStatus = "inscris" | "rezerva" | "retras";

// Reprezintă o înscriere într-un eveniment, cu jucători asociați
export interface Registration {
  id: string;
  status: RegistrationStatus;
  registered_at: string; // ISO datetime
  updated_at?: string;
  players: {
    id: string;
    full_name: string;
    grade?: number;
    email?: string;
  }[];
  user_id?: string; // cine a făcut înscrierea
  edition_id: number; // Adaugă câmpul edition_id
}
