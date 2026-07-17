-- Motor de rotinas recorrentes: templates + vínculo das instâncias em tasks.

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------

create table if not exists public.routine_templates (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  category text not null
    check (category in ('Focus', 'Criativo', 'Saúde', 'Entretenimento')),
  duration integer not null default 0 check (duration >= 0),
  priority public.task_priority not null default 'medium',
  scheduled_time text,
  weekdays smallint[] not null check (
    array_length(weekdays, 1) between 1 and 7
    and weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routine_templates_user_id_idx
  on public.routine_templates (user_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'routine_templates_set_updated_at'
      and tgrelid = 'public.routine_templates'::regclass
  ) then
    create trigger routine_templates_set_updated_at
      before update on public.routine_templates
      for each row
      execute function public.set_updated_at();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.routine_templates enable row level security;

drop policy if exists routine_templates_select_own on public.routine_templates;
create policy routine_templates_select_own
  on public.routine_templates
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists routine_templates_insert_own on public.routine_templates;
create policy routine_templates_insert_own
  on public.routine_templates
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists routine_templates_update_own on public.routine_templates;
create policy routine_templates_update_own
  on public.routine_templates
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists routine_templates_delete_own on public.routine_templates;
create policy routine_templates_delete_own
  on public.routine_templates
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (tabela nova não é coberta pelo grant global do schema inicial)
-- ---------------------------------------------------------------------------

grant all on public.routine_templates to postgres, service_role;
grant select, insert, update, delete on public.routine_templates to authenticated;

-- ---------------------------------------------------------------------------
-- Instâncias de rotina em tasks (nullable, sem FK: preserva histórico ao
-- excluir o template de uma instância já concluída).
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists routine_template_id text,
  add column if not exists routine_date text;

notify pgrst, 'reload schema';
