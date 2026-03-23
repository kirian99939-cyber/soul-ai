-- ╔══════════════════════════════════════════════╗
-- ║  SOUL AI — Supabase Schema                  ║
-- ║  Выполни в SQL Editor (app.supabase.com)    ║
-- ╚══════════════════════════════════════════════╝

-- Простое key-value хранилище (для старта)
create table if not exists soul_store (
  key     text primary key,
  value   text not null,
  updated_at timestamptz default now()
);

-- Разрешаем анонимный доступ (для внутреннего инструмента)
alter table soul_store enable row level security;

create policy "Allow all for anon" on soul_store
  for all using (true) with check (true);

-- Триггер на обновление timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger soul_store_updated_at
  before update on soul_store
  for each row execute function update_updated_at();

-- ── Для будущего: полные таблицы персон ──

create table if not exists personas (
  id          text primary key,
  name        text not null,
  handle      text,
  brand       text,
  city        text,
  age         text,
  bio         text,
  appearance  jsonb default '{}',
  soul        jsonb default '{}',
  state       jsonb default '{}',
  niches      text[] default '{}',
  formats     text[] default '{}',
  context     text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists content (
  id          text primary key,
  persona_id  text references personas(id) on delete cascade,
  platform    text default 'threads',
  text        text not null,
  format      text default '',
  topic       text default '',
  tag         text default '',
  why         text default '',
  status      text default 'draft' check (status in ('draft','approved','published')),
  created_at  timestamptz default now()
);

-- Indexes
create index if not exists content_persona_id_idx on content(persona_id);
create index if not exists content_status_idx on content(status);
