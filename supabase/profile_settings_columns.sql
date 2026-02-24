-- Run this once in Supabase SQL editor.
-- Adds missing profile settings columns used by the app.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists payment_info jsonb not null default '{}'::jsonb;
