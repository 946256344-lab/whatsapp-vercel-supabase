create extension if not exists pgcrypto;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,
  name text,
  phone text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'webhook_event',
  waba_id text,
  field text,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  wa_message_id text not null unique,
  contact_id uuid references public.contacts(id) on delete set null,
  wa_id text not null,
  direction text not null default 'inbound',
  type text not null default 'unknown',
  text text,
  raw_payload jsonb not null,
  message_timestamp timestamptz,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.message_statuses (
  id uuid primary key default gen_random_uuid(),
  wa_message_id text,
  recipient_id text,
  status text,
  raw_payload jsonb not null,
  status_timestamp timestamptz,
  received_at timestamptz not null default now()
);

create table if not exists public.customer_followups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  report_date date not null,
  need_summary text,
  product text,
  quantity text,
  intent text,
  status text,
  next_action text,
  updated_at timestamptz not null default now(),
  unique (contact_id, report_date)
);

create index if not exists contacts_last_seen_at_idx on public.contacts(last_seen_at desc);
create index if not exists messages_received_at_idx on public.messages(received_at desc);
create index if not exists messages_wa_id_idx on public.messages(wa_id);
create index if not exists webhook_events_received_at_idx on public.webhook_events(received_at desc);
create index if not exists customer_followups_report_date_idx on public.customer_followups(report_date desc);

alter table public.contacts enable row level security;
alter table public.webhook_events enable row level security;
alter table public.messages enable row level security;
alter table public.message_statuses enable row level security;
alter table public.customer_followups enable row level security;

create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

create or replace function private.is_app_request()
returns boolean
language sql
stable
security definer
set search_path = private, pg_temp
as $$
  select coalesce(
    (
      nullif(current_setting('request.headers', true), '')::jsonb
      ->> 'x-app-secret'
    ),
    ''
  ) = coalesce(
    (select value from private.app_config where key = 'app_db_secret'),
    ''
  );
$$;

grant usage on schema public to anon;
grant select, insert, update, delete on public.contacts to anon;
grant select, insert, update, delete on public.webhook_events to anon;
grant select, insert, update, delete on public.messages to anon;
grant select, insert, update, delete on public.message_statuses to anon;
grant select, insert, update, delete on public.customer_followups to anon;

drop policy if exists app_server_access on public.contacts;
drop policy if exists app_server_access on public.webhook_events;
drop policy if exists app_server_access on public.messages;
drop policy if exists app_server_access on public.message_statuses;
drop policy if exists app_server_access on public.customer_followups;

create policy app_server_access on public.contacts
  for all to anon
  using (private.is_app_request())
  with check (private.is_app_request());

create policy app_server_access on public.webhook_events
  for all to anon
  using (private.is_app_request())
  with check (private.is_app_request());

create policy app_server_access on public.messages
  for all to anon
  using (private.is_app_request())
  with check (private.is_app_request());

create policy app_server_access on public.message_statuses
  for all to anon
  using (private.is_app_request())
  with check (private.is_app_request());

create policy app_server_access on public.customer_followups
  for all to anon
  using (private.is_app_request())
  with check (private.is_app_request());

-- Insert the real app_db_secret into private.app_config outside Git-tracked SQL.
