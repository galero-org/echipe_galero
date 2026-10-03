-- Relatie persistenta intre contul Supabase si profilul de jucator.
-- Ruleaza in Supabase SQL Editor.

alter table public.players
  add column if not exists linked_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists players_linked_user_id_unique
  on public.players (linked_user_id)
  where linked_user_id is not null;

-- Migreaza legaturile salvate anterior in user_metadata.
update public.players p
set linked_user_id = u.id
from auth.users u
where p.linked_user_id is null
  and (u.raw_user_meta_data ->> 'linked_player_id')::uuid = p.id
  and not exists (
    select 1 from public.players already_linked
    where already_linked.linked_user_id = u.id
  );

-- Dupa verificarea migrarii, metadata poate fi curatata manual.
