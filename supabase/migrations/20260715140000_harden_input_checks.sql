-- Espelha validações do front-end (auth-errors, NewTaskSheet, profile-storage).

-- profiles.display_name: 2–50 chars (validateDisplayName)
update public.profiles
set display_name = left(trim(display_name), 50)
where char_length(trim(display_name)) > 50;

update public.profiles
set display_name = 'Alex'
where char_length(trim(display_name)) < 2;

-- profiles.nickname: null ou 2–20 chars (PROFILE_HEADER_NAME_MAX_LENGTH)
update public.profiles
set nickname = left(trim(nickname), 20)
where nickname is not null
  and char_length(trim(nickname)) > 20;

update public.profiles
set nickname = null
where nickname is not null
  and char_length(trim(nickname)) < 2;

-- profiles.daily_goal_minutes: 15–720 min
update public.profiles
set daily_goal_minutes = 180
where daily_goal_minutes < 15 or daily_goal_minutes > 720;

-- tasks.title: 1–120 chars
update public.tasks
set title = left(trim(title), 120)
where char_length(trim(title)) > 120;

update public.tasks
set title = 'Tarefa'
where char_length(trim(title)) < 1;

-- tasks.category: enum fixo do app
update public.tasks
set category = 'Focus'
where category not in ('Focus', 'Criativo', 'Saúde', 'Entretenimento');

alter table public.profiles
  add constraint profiles_display_name_len
    check (char_length(trim(display_name)) between 2 and 50),
  add constraint profiles_nickname_len
    check (nickname is null or char_length(trim(nickname)) between 2 and 20),
  add constraint profiles_daily_goal_range
    check (daily_goal_minutes between 15 and 720);

alter table public.tasks
  add constraint tasks_title_len
    check (char_length(trim(title)) between 1 and 120),
  add constraint tasks_category_allowed
    check (category in ('Focus', 'Criativo', 'Saúde', 'Entretenimento'));
