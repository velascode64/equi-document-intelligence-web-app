create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.google_drive_connections (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_account_email text,
  google_drive_folder_id text,
  google_drive_folder_name text,
  oauth_tokens jsonb not null default '{}'::jsonb,
  sync_status text not null default 'idle' check (sync_status in ('idle', 'syncing', 'completed', 'failed')),
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index google_drive_connections_user_id_idx on public.google_drive_connections(user_id);

create trigger google_drive_connections_set_updated_at
before update on public.google_drive_connections
for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_drive_connection_id uuid references public.google_drive_connections(id) on delete set null,
  drive_file_id text not null,
  name text not null,
  mime_type text not null,
  drive_modified_time timestamptz,
  drive_md5_checksum text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  raw_extraction jsonb,
  extraction_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, drive_file_id)
);

create index documents_user_id_idx on public.documents(user_id);
create index documents_status_idx on public.documents(status);
create index documents_drive_file_id_idx on public.documents(drive_file_id);

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read')),
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_status_idx on public.notifications(user_id, status);
create index notifications_created_at_idx on public.notifications(created_at desc);

alter table public.profiles enable row level security;
alter table public.google_drive_connections enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "google_drive_connections_select_own"
on public.google_drive_connections for select
using (user_id = auth.uid());

create policy "google_drive_connections_insert_own"
on public.google_drive_connections for insert
with check (user_id = auth.uid());

create policy "google_drive_connections_update_own"
on public.google_drive_connections for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "documents_select_own"
on public.documents for select
using (user_id = auth.uid());

create policy "documents_insert_own"
on public.documents for insert
with check (user_id = auth.uid());

create policy "documents_update_own"
on public.documents for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notifications_select_own"
on public.notifications for select
using (user_id = auth.uid());

create policy "notifications_insert_own"
on public.notifications for insert
with check (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
