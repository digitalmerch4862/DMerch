-- Core schema for DigitalMerch
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  total_spent numeric(12,2) not null default 0,
  order_count integer not null default 0,
  visit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  category_name text not null,
  description text not null default '',
  image_url text not null default '',
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_username text,
  amount numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'completed',
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text,
  session_id text not null,
  page text not null,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text,
  email text,
  reason text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_visits_user_id on public.analytics_visits(user_id);
create index if not exists idx_leads_user_id on public.leads(user_id);
create index if not exists idx_products_created_by on public.products(created_by);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_visits_updated_at on public.analytics_visits;
create trigger trg_visits_updated_at
before update on public.analytics_visits
for each row execute function public.set_updated_at();

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.analytics_visits enable row level security;
alter table public.leads enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all"
on public.products for select
using (true);

drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_insert_owner_or_admin" on public.products;
create policy "products_insert_owner_or_admin"
on public.products for insert
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_update_owner_or_admin" on public.products;
create policy "products_update_owner_or_admin"
on public.products for update
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "products_delete_own" on public.products;
drop policy if exists "products_delete_owner_or_admin" on public.products;
create policy "products_delete_owner_or_admin"
on public.products for delete
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders for insert
with check (user_id = auth.uid());

drop policy if exists "orders_update_own" on public.orders;
drop policy if exists "orders_update_own_or_admin" on public.orders;
create policy "orders_update_own_or_admin"
on public.orders for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "orders_delete_own" on public.orders;
drop policy if exists "orders_delete_own_or_admin" on public.orders;
create policy "orders_delete_own_or_admin"
on public.orders for delete
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "visits_select_own" on public.analytics_visits;
drop policy if exists "visits_select_own_or_admin" on public.analytics_visits;
create policy "visits_select_own_or_admin"
on public.analytics_visits for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "visits_insert_own" on public.analytics_visits;
create policy "visits_insert_own"
on public.analytics_visits for insert
with check (user_id = auth.uid());

drop policy if exists "visits_update_own" on public.analytics_visits;
drop policy if exists "visits_update_own_or_admin" on public.analytics_visits;
create policy "visits_update_own_or_admin"
on public.analytics_visits for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "visits_delete_own" on public.analytics_visits;
drop policy if exists "visits_delete_own_or_admin" on public.analytics_visits;
create policy "visits_delete_own_or_admin"
on public.analytics_visits for delete
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "leads_select_own" on public.leads;
drop policy if exists "leads_select_own_or_admin" on public.leads;
create policy "leads_select_own_or_admin"
on public.leads for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
on public.leads for insert
with check (user_id = auth.uid());

drop policy if exists "leads_update_own" on public.leads;
drop policy if exists "leads_update_own_or_admin" on public.leads;
create policy "leads_update_own_or_admin"
on public.leads for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "leads_delete_own" on public.leads;
drop policy if exists "leads_delete_own_or_admin" on public.leads;
create policy "leads_delete_own_or_admin"
on public.leads for delete
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
