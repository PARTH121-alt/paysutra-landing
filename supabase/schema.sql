-- ============================================================
-- PaySutra production schema — run this once in the Supabase
-- SQL Editor (Dashboard → SQL Editor → New query → Run)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  full_name    text,
  account_type text not null default 'personal' check (account_type in ('personal','organization')),
  org_name     text,
  created_at   timestamptz not null default now()
);

create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'Viewer' check (role in ('Admin','Finance','Operations','Viewer')),
  user_id    uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  org_id     uuid references public.organizations(id) on delete cascade,
  type       text not null check (type in ('in','out')),
  party      text not null,
  method     text not null default 'upi',
  amount     numeric not null check (amount >= 0),
  status     text not null default 'completed' check (status in ('completed','pending','failed')),
  note       text not null default '',
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  org_id           uuid references public.organizations(id) on delete cascade,
  direction        text not null check (direction in ('in','out')),
  party            text not null,
  amount           numeric not null check (amount > 0),
  note             text not null default '',
  upi_id           text,
  name             text,
  status           text not null default 'pending' check (status in ('pending','paid','cancelled')),
  razorpay_link_id text,
  razorpay_url     text,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);

create table if not exists public.qr_vault (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  org_id     uuid references public.organizations(id) on delete cascade,
  name       text,
  upi_id     text,
  image_url  text,
  created_at timestamptz not null default now()
);

create index if not exists idx_txn_owner   on public.transactions (owner_id);
create index if not exists idx_txn_org     on public.transactions (org_id);
create index if not exists idx_req_owner   on public.payment_requests (owner_id);
create index if not exists idx_req_org     on public.payment_requests (org_id);
create index if not exists idx_member_mail on public.org_members (email);

-- ------------------------------------------------------------
-- Enable RLS everywhere
-- ------------------------------------------------------------

alter table public.profiles        enable row level security;
alter table public.organizations   enable row level security;
alter table public.org_members     enable row level security;
alter table public.transactions    enable row level security;
alter table public.payment_requests enable row level security;
alter table public.qr_vault        enable row level security;

-- ------------------------------------------------------------
-- Helper: rows the caller can see for org data they belong to
-- ------------------------------------------------------------

create or replace function public.my_org_role(v_org uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.org_members
  where org_id = v_org and (user_id = auth.uid() or email = auth.jwt() ->> 'email')
  limit 1;
$$;

-- ------------------------------------------------------------
-- Policies
-- ------------------------------------------------------------

-- profiles: read/update own
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select using (id = auth.uid());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (id = auth.uid());

-- organizations: owner full control; members read
drop policy if exists p_org_owner on public.organizations;
create policy p_org_owner on public.organizations for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists p_org_read on public.organizations;
create policy p_org_read on public.organizations for select using (
  exists (select 1 from public.org_members om where om.org_id = organizations.id and (om.user_id = auth.uid() or om.email = auth.jwt() ->> 'email'))
);

-- org_members: admins manage; members read the roster of their org
drop policy if exists p_members_admin on public.org_members;
create policy p_members_admin on public.org_members for all using (
  exists (select 1 from public.organizations o where o.id = org_members.org_id and o.owner_id = auth.uid())
) with check (
  exists (select 1 from public.organizations o where o.id = org_members.org_id and o.owner_id = auth.uid())
);
drop policy if exists p_members_read on public.org_members;
create policy p_members_read on public.org_members for select using (
  user_id = auth.uid() or email = auth.jwt() ->> 'email'
  or exists (select 1 from public.organizations o where o.id = org_members.org_id and o.owner_id = auth.uid())
);

-- transactions
drop policy if exists p_txn_select on public.transactions;
create policy p_txn_select on public.transactions for select using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) is not null)
);
drop policy if exists p_txn_insert on public.transactions;
create policy p_txn_insert on public.transactions for insert with check (
  (owner_id = auth.uid() and org_id is null)
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations') and owner_id = auth.uid())
);
drop policy if exists p_txn_update on public.transactions;
create policy p_txn_update on public.transactions for update using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations'))
);
drop policy if exists p_txn_delete on public.transactions;
create policy p_txn_delete on public.transactions for delete using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) = 'Admin')
);

-- payment_requests (same shape of rules)
drop policy if exists p_req_select on public.payment_requests;
create policy p_req_select on public.payment_requests for select using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) is not null)
);
drop policy if exists p_req_insert on public.payment_requests;
create policy p_req_insert on public.payment_requests for insert with check (
  (owner_id = auth.uid() and org_id is null)
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations') and owner_id = auth.uid())
);
drop policy if exists p_req_update on public.payment_requests;
create policy p_req_update on public.payment_requests for update using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations'))
);
drop policy if exists p_req_delete on public.payment_requests;
create policy p_req_delete on public.payment_requests for delete using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) = 'Admin')
);

-- qr_vault (read for all roles incl. Viewer, write for write roles)
drop policy if exists p_qr_select on public.qr_vault;
create policy p_qr_select on public.qr_vault for select using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) is not null)
);
drop policy if exists p_qr_write on public.qr_vault;
create policy p_qr_write on public.qr_vault for all using (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations'))
) with check (
  owner_id = auth.uid()
  or (org_id is not null and public.my_org_role(org_id) in ('Admin','Finance','Operations'))
);

-- ------------------------------------------------------------
-- Auto-create profile (and org, or attach invitation) on signup
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_type  text;
  v_org   uuid;
  v_role  text;
  v_name  text;
begin
  v_type := coalesce(new.raw_user_meta_data ->> 'account_type', 'personal');
  v_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  if v_type = 'organization' then
    insert into public.organizations (name, owner_id)
      values (coalesce(new.raw_user_meta_data ->> 'org_name', v_name || '''s Org'), new.id)
      returning id into v_org;
    insert into public.org_members (org_id, email, name, role, user_id)
      values (v_org, new.email, v_name, 'Admin', new.id);
    insert into public.profiles (id, email, full_name, account_type, org_name)
      values (new.id, new.email, v_name, 'organization', coalesce(new.raw_user_meta_data ->> 'org_name', v_name || '''s Org'));
  else
    -- invited teammate? attach them to the inviting org with their invited role
    select om.org_id, om.role into v_org, v_role
      from public.org_members om
      where om.email = new.email and om.user_id is null
      order by om.invited_at desc limit 1;
    if v_org is not null then
      update public.org_members set user_id = new.id, name = coalesce(name, v_name) where email = new.email;
      insert into public.profiles (id, email, full_name, account_type, org_name)
        values (new.id, new.email, v_name, 'organization', (select name from public.organizations where id = v_org));
    else
      insert into public.profiles (id, email, full_name, account_type, org_name)
        values (new.id, new.email, v_name, 'personal', v_name);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Realtime (live payment feeds across devices)
-- ------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'payment_requests') then
    alter publication supabase_realtime add table public.payment_requests;
  end if;
end $$;
