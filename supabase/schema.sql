-- Weight Journal — Supabase schema
-- Run this once in your Supabase project's SQL editor (Dashboard > SQL Editor > New query).
-- Before running: Dashboard > Authentication > Providers > enable "Anonymous sign-ins".

create extension if not exists "pgcrypto";

-- One row per user: body stats used for the calorie calculator
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric,
  age integer,
  sex text check (sex in ('male','female')),
  activity text check (activity in ('sedentary','light','moderate','active','very_active')),
  goal_type text check (goal_type in ('lose','maintain','gain')),
  pace_kg_per_week numeric default 0.5,
  updated_at timestamptz default now()
);

-- One row per user: weight-loss goal
create table if not exists goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unit text check (unit in ('kg','lb')) default 'kg',
  start_weight numeric not null,
  goal_weight numeric not null,
  start_date date not null,
  updated_at timestamptz default now()
);

-- One row per logged day
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  weight numeric,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  name text not null,
  grams numeric,
  kcal_per_100g numeric
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade,
  name text not null,
  duration text
);

-- Row Level Security: every user can only ever see/write their own rows.
alter table profiles enable row level security;
alter table goals enable row level security;
alter table entries enable row level security;
alter table foods enable row level security;
alter table exercises enable row level security;

create policy "own profile" on profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own goal" on goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entries" on entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own foods" on foods for all
  using (exists (select 1 from entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from entries e where e.id = entry_id and e.user_id = auth.uid()));

create policy "own exercises" on exercises for all
  using (exists (select 1 from entries e where e.id = entry_id and e.user_id = auth.uid()))
  with check (exists (select 1 from entries e where e.id = entry_id and e.user_id = auth.uid()));
