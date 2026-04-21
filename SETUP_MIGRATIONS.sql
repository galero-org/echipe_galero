-- ============================================================================
-- MIGRAȚIE: Adauga tabel pentru istoricul generărilor de echipe
-- ============================================================================
-- Rulează această migrație în SQL Editor din Supabase.
-- Merge direct cu copy-paste.

-- Creează tabela team_generations
create table if not exists public.team_generations (
   id                 uuid primary key default gen_random_uuid(),
   edition_id         uuid not null
      references editions ( id )
         on delete cascade,
   created_by_user_id uuid not null
      references auth.users ( id )
         on delete cascade,
   created_at         timestamp with time zone not null default now(),
   team_count         integer not null,
   players_per_team   integer not null,
   generated_teams    jsonb not null,
   constraint team_gen_valid_team_count check ( team_count > 0 ),
   constraint team_gen_valid_players_per_team check ( players_per_team > 0 )
);

-- Creează indecsi pentru performanță
create index if not exists idx_team_generations_edition_id on
   public.team_generations (
      edition_id
   );

create index if not exists idx_team_generations_created_by on
   public.team_generations (
      created_by_user_id
   );

create index if not exists idx_team_generations_created_at on
   public.team_generations (
      created_at
   desc );

-- Notă RLS:
-- RLS este activat automat pentru tabelele Supabase noi.
-- Asigură-te că politicile sunt configurate corespunzător în tabul "Auth" din Supabase.

-- Grant permisiuni de access (opțional, deja e configurat în Supabase)
-- GRANT SELECT, INSERT ON public.team_generations TO authenticated;