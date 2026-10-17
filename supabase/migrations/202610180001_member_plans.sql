begin;
create table public.member_plans (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 524288),
 updated_at timestamptz not null default now()
);
alter table public.member_plans enable row level security;
revoke all on public.member_plans from anon, authenticated;
grant select, insert, update, delete on public.member_plans to authenticated;
create policy "Read own plans" on public.member_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own plans" on public.member_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own plans" on public.member_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own plans" on public.member_plans for delete to authenticated using ((select auth.uid()) = user_id);
commit;
