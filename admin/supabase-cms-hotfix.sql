-- ============================================================
-- PORTFOLIO CMS HOTFIX
-- Chỉ dùng cho Portfolio-GiaPhu.
-- Chạy TOÀN BỘ file này trong Supabase SQL Editor.
-- Không liên quan tới các bảng game như wallets / game_events.
-- ============================================================

create or replace function public.is_portfolio_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  current_uid uuid := auth.uid();
begin
  if current_uid is null then
    return false;
  end if;

  return
    exists (
      select 1
      from auth.users u
      where u.id = current_uid
        and (
          lower(coalesce(u.email, '')) = 'giaphufpt1@gmail.com'
          or lower(coalesce(u.raw_user_meta_data ->> 'user_name', '')) = 'dev-giaphu'
          or lower(coalesce(u.raw_user_meta_data ->> 'preferred_username', '')) = 'dev-giaphu'
          or lower(coalesce(u.raw_user_meta_data ->> 'login', '')) = 'dev-giaphu'
        )
    )
    or exists (
      select 1
      from auth.identities i
      where i.user_id = current_uid
        and (
          lower(coalesce(i.identity_data ->> 'email', '')) = 'giaphufpt1@gmail.com'
          or lower(coalesce(i.identity_data ->> 'user_name', '')) = 'dev-giaphu'
          or lower(coalesce(i.identity_data ->> 'preferred_username', '')) = 'dev-giaphu'
          or lower(coalesce(i.identity_data ->> 'login', '')) = 'dev-giaphu'
        )
    );
end;
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated;

create table if not exists public.portfolio_content (
  key text primary key,
  selector text not null,
  property text not null default 'innerHTML',
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id)
);

alter table public.portfolio_content enable row level security;

drop policy if exists "portfolio_content_public_read" on public.portfolio_content;
drop policy if exists "portfolio_content_admin_insert" on public.portfolio_content;
drop policy if exists "portfolio_content_admin_update" on public.portfolio_content;
drop policy if exists "portfolio_content_admin_delete" on public.portfolio_content;

create policy "portfolio_content_public_read"
on public.portfolio_content
for select
to anon, authenticated
using (true);

create policy "portfolio_content_admin_insert"
on public.portfolio_content
for insert
to authenticated
with check (public.is_portfolio_admin());

create policy "portfolio_content_admin_update"
on public.portfolio_content
for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

create policy "portfolio_content_admin_delete"
on public.portfolio_content
for delete
to authenticated
using (public.is_portfolio_admin());

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio_media_public_read" on storage.objects;
drop policy if exists "portfolio_media_admin_insert" on storage.objects;
drop policy if exists "portfolio_media_admin_update" on storage.objects;
drop policy if exists "portfolio_media_admin_delete" on storage.objects;

create policy "portfolio_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'portfolio-media');

create policy "portfolio_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);

create policy "portfolio_media_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
)
with check (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);

create policy "portfolio_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and public.is_portfolio_admin()
);

notify pgrst, 'reload schema';
