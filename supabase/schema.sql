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

-- This app uses the service-role key from Vercel server functions.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to browsers.
