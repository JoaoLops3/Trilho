-- Dia agendado de tarefas avulsas (visão semanal da Agenda).

alter table public.tasks
  add column if not exists scheduled_date text;

alter table public.tasks
  drop constraint if exists tasks_scheduled_date_format;

alter table public.tasks
  add constraint tasks_scheduled_date_format
    check (
      scheduled_date is null
      or scheduled_date ~ '^\d{4}-\d{2}-\d{2}$'
    );

comment on column public.tasks.scheduled_date is
  'Dia agendado YYYY-MM-DD (local). Null = legado tratado como hoje no app.';
