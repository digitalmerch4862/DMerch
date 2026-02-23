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

create or replace function public.increment_seller_balance(
  p_seller_id uuid,
  p_pending_delta numeric,
  p_available_delta numeric,
  p_earned_delta numeric,
  p_paid_delta numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.seller_balances (
    seller_id,
    pending_amount,
    available_amount,
    total_earned,
    total_paid_out,
    updated_at
  ) values (
    p_seller_id,
    greatest(0, coalesce(p_pending_delta, 0)),
    greatest(0, coalesce(p_available_delta, 0)),
    greatest(0, coalesce(p_earned_delta, 0)),
    greatest(0, coalesce(p_paid_delta, 0)),
    now()
  )
  on conflict (seller_id)
  do update set
    pending_amount = greatest(0, seller_balances.pending_amount + coalesce(p_pending_delta, 0)),
    available_amount = greatest(0, seller_balances.available_amount + coalesce(p_available_delta, 0)),
    total_earned = greatest(0, seller_balances.total_earned + coalesce(p_earned_delta, 0)),
    total_paid_out = greatest(0, seller_balances.total_paid_out + coalesce(p_paid_delta, 0)),
    updated_at = now();
end;
$$;

alter table public.profiles
  add column if not exists is_seller boolean not null default false,
  add column if not exists seller_display_name text,
  add column if not exists seller_slug text,
  add column if not exists seller_status text not null default 'inactive' check (seller_status in ('inactive', 'active', 'restricted')),
  add column if not exists kyc_status text not null default 'pending' check (kyc_status in ('pending', 'verified', 'rejected'));

create unique index if not exists idx_profiles_seller_slug on public.profiles (seller_slug) where seller_slug is not null;

alter table public.products
  add column if not exists seller_id uuid references auth.users(id) on delete cascade,
  add column if not exists price_usd numeric(12,2),
  add column if not exists is_published boolean not null default true,
  add column if not exists product_status text not null default 'active' check (product_status in ('draft', 'active', 'archived'));

update public.products
set seller_id = created_by
where seller_id is null;

with fallback_owner as (
  select id
  from public.profiles
  order by (role = 'admin') desc, created_at asc nulls last
  limit 1
)
update public.products p
set
  created_by = coalesce(p.created_by, o.id),
  seller_id = coalesce(p.seller_id, p.created_by, o.id)
from fallback_owner o
where p.seller_id is null or p.created_by is null;

do $$
begin
  if exists (select 1 from public.products where seller_id is null) then
    raise exception 'products.seller_id still has NULL rows. Ensure at least one profile row exists, then rerun migration.';
  end if;
end
$$;

update public.products
set price_usd = greatest(1, round(coalesce(price, 56) / 56.0, 2))
where price_usd is null;

alter table public.products
  alter column seller_id set not null,
  alter column seller_id set default auth.uid(),
  alter column price_usd set not null;

alter table public.products
  drop constraint if exists products_price_usd_min;

alter table public.products
  add constraint products_price_usd_min check (price_usd >= 1);

create index if not exists idx_products_seller_id on public.products(seller_id);
create index if not exists idx_products_published on public.products(is_published, product_status);

alter table public.orders
  add column if not exists seller_id uuid references auth.users(id) on delete set null,
  add column if not exists amount_usd numeric(12,2),
  add column if not exists amount_php numeric(12,2),
  add column if not exists platform_fee_amount numeric(12,2) not null default 0,
  add column if not exists seller_net_amount numeric(12,2) not null default 0,
  add column if not exists payout_status text not null default 'pending' check (payout_status in ('pending', 'ready', 'processing', 'paid', 'failed', 'held')),
  add column if not exists payout_eligible_at timestamptz;

create index if not exists idx_orders_seller_id on public.orders(seller_id);
create index if not exists idx_orders_payout_status on public.orders(payout_status, payout_eligible_at);

create table if not exists public.seller_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  account_holder_name text not null,
  bank_code text not null,
  account_number_last4 text not null,
  account_number_encrypted text not null,
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_seller_bank_default
  on public.seller_bank_accounts (seller_id, is_default)
  where is_default = true;

create table if not exists public.seller_balances (
  seller_id uuid primary key references auth.users(id) on delete cascade,
  pending_amount numeric(12,2) not null default 0,
  available_amount numeric(12,2) not null default 0,
  total_earned numeric(12,2) not null default 0,
  total_paid_out numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  payout_id uuid,
  entry_type text not null check (entry_type in ('credit_pending', 'release_available', 'payout_debit', 'payout_reversal', 'adjustment')),
  amount numeric(12,2) not null,
  currency text not null default 'PHP',
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_ledger_seller_id on public.wallet_ledger(seller_id, created_at desc);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  bank_account_id uuid not null references public.seller_bank_accounts(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'PHP',
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed', 'reversed')),
  provider text not null default 'paymongo',
  provider_reference text,
  failure_reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_payouts_seller_id on public.payouts(seller_id, created_at desc);
create index if not exists idx_payouts_status on public.payouts(status, created_at);

create table if not exists public.payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (payout_id, order_id)
);

alter table public.wallet_ledger
  drop constraint if exists wallet_ledger_payout_id_fkey;

alter table public.wallet_ledger
  add constraint wallet_ledger_payout_id_fkey
  foreign key (payout_id) references public.payouts(id) on delete set null;

drop trigger if exists trg_seller_bank_accounts_updated_at on public.seller_bank_accounts;
create trigger trg_seller_bank_accounts_updated_at
before update on public.seller_bank_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_seller_balances_updated_at on public.seller_balances;
create trigger trg_seller_balances_updated_at
before update on public.seller_balances
for each row execute function public.set_updated_at();

drop trigger if exists trg_payouts_updated_at on public.payouts;
create trigger trg_payouts_updated_at
before update on public.payouts
for each row execute function public.set_updated_at();

alter table public.seller_bank_accounts enable row level security;
alter table public.seller_balances enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_items enable row level security;

drop policy if exists seller_bank_select_own_or_admin on public.seller_bank_accounts;
create policy seller_bank_select_own_or_admin
on public.seller_bank_accounts
for select
using (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists seller_bank_insert_own on public.seller_bank_accounts;
create policy seller_bank_insert_own
on public.seller_bank_accounts
for insert
with check (seller_id = auth.uid());

drop policy if exists seller_bank_update_own_or_admin on public.seller_bank_accounts;
create policy seller_bank_update_own_or_admin
on public.seller_bank_accounts
for update
using (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists seller_balance_select_own_or_admin on public.seller_balances;
create policy seller_balance_select_own_or_admin
on public.seller_balances
for select
using (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists wallet_ledger_select_own_or_admin on public.wallet_ledger;
create policy wallet_ledger_select_own_or_admin
on public.wallet_ledger
for select
using (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists payouts_select_own_or_admin on public.payouts;
create policy payouts_select_own_or_admin
on public.payouts
for select
using (
  seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists payout_items_select_own_or_admin on public.payout_items;
create policy payout_items_select_own_or_admin
on public.payout_items
for select
using (
  exists (
    select 1
    from public.payouts py
    where py.id = payout_items.payout_id
      and (
        py.seller_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
  )
);

drop policy if exists products_select_all on public.products;
create policy products_select_all
on public.products
for select
using (
  (is_published = true and product_status = 'active')
  or seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists products_insert_owner_or_admin on public.products;
create policy products_insert_owner_or_admin
on public.products
for insert
with check (
  seller_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists products_update_owner_or_admin on public.products;
create policy products_update_owner_or_admin
on public.products
for update
using (
  seller_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  seller_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists products_delete_owner_or_admin on public.products;
create policy products_delete_owner_or_admin
on public.products
for delete
using (
  seller_id = auth.uid()
  or created_by = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists orders_select_own_or_admin on public.orders;
create policy orders_select_own_or_admin
on public.orders
for select
using (
  user_id = auth.uid()
  or seller_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
