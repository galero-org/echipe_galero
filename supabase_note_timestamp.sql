-- Timestamp separat pentru modificarea notei jucatorului.
-- In aplicatie, nota este stocata in coloana players.grade.

alter table public.players
  add column if not exists nota_updated_at timestamptz;

-- Initializeaza timestampul pentru jucatorii existenti.
update public.players
set nota_updated_at = coalesce(updated_at, created_at, now())
where nota_updated_at is null;

create or replace function public.handle_nota_updated_at()
returns trigger
language plpgsql
as $$
begin
  if old.grade is distinct from new.grade then
    new.nota_updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists handle_nota_updated_at on public.players;

create trigger handle_nota_updated_at
before update on public.players
for each row
execute function public.handle_nota_updated_at();
