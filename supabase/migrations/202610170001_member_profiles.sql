begin;

-- Optional member-owned profile data. No authentication secrets belong here.
create table public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100)
);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from anon, authenticated;
grant select, insert, update, delete on public.member_profiles to authenticated;

create policy "Members read their own profile" on public.member_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Members create their own profile" on public.member_profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Members update their own profile" on public.member_profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Members delete their own profile" on public.member_profiles
  for delete to authenticated using ((select auth.uid()) = id);

commit;
