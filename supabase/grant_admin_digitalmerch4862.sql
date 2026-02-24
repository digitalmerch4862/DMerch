-- Run this in Supabase SQL editor to grant admin access.
insert into public.profiles (id, email, username, role)
select
  u.id,
  u.email,
  coalesce(nullif(split_part(u.email, '@', 1), ''), 'admin') as username,
  'admin' as role
from auth.users u
where lower(u.email) = lower('digitalmerch4862@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  role = 'admin',
  updated_at = now();
