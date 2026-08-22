-- RLS initplan: (select auth.uid()) avaliado uma vez por query, não por linha.
-- Resolve WARN x24 do advisor Supabase (auth_rls_initplan).
-- Sem mudança de semântica — mesma ownership por linha.

-- profiles (ownership via id)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = id);

-- tasks
drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own
  on public.tasks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own
  on public.tasks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own
  on public.tasks
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own
  on public.tasks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- day_history
drop policy if exists day_history_select_own on public.day_history;
create policy day_history_select_own
  on public.day_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists day_history_insert_own on public.day_history;
create policy day_history_insert_own
  on public.day_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists day_history_update_own on public.day_history;
create policy day_history_update_own
  on public.day_history
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists day_history_delete_own on public.day_history;
create policy day_history_delete_own
  on public.day_history
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- notification_preferences
drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own
  on public.notification_preferences
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own
  on public.notification_preferences
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own
  on public.notification_preferences
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notification_preferences_delete_own on public.notification_preferences;
create policy notification_preferences_delete_own
  on public.notification_preferences
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- notifications
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own
  on public.notifications
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
  on public.notifications
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- routine_templates
drop policy if exists routine_templates_select_own on public.routine_templates;
create policy routine_templates_select_own
  on public.routine_templates
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists routine_templates_insert_own on public.routine_templates;
create policy routine_templates_insert_own
  on public.routine_templates
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists routine_templates_update_own on public.routine_templates;
create policy routine_templates_update_own
  on public.routine_templates
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists routine_templates_delete_own on public.routine_templates;
create policy routine_templates_delete_own
  on public.routine_templates
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
