-- ============================================================
-- PORTFOLIO VISUAL CMS / ADMIN
-- Chạy file này MỘT LẦN trong Supabase SQL Editor.
-- Sau đó tạo user Auth bằng email: giaphufpt1@gmail.com
-- Password do bạn tự đặt trong Supabase Auth, KHÔNG lưu trong GitHub.
-- ============================================================

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
create policy "portfolio_content_public_read"
on public.portfolio_content
for select
using (true);

drop policy if exists "portfolio_content_admin_insert" on public.portfolio_content;
create policy "portfolio_content_admin_insert"
on public.portfolio_content
for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com');

drop policy if exists "portfolio_content_admin_update" on public.portfolio_content;
create policy "portfolio_content_admin_update"
on public.portfolio_content
for update
to authenticated
using ((auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com')
with check ((auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com');

drop policy if exists "portfolio_content_admin_delete" on public.portfolio_content;
create policy "portfolio_content_admin_delete"
on public.portfolio_content
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com');

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio_media_public_read" on storage.objects;
create policy "portfolio_media_public_read"
on storage.objects
for select
using (bucket_id = 'portfolio-media');

drop policy if exists "portfolio_media_admin_insert" on storage.objects;
create policy "portfolio_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com'
);

drop policy if exists "portfolio_media_admin_update" on storage.objects;
create policy "portfolio_media_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com'
)
with check (
  bucket_id = 'portfolio-media'
  and (auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com'
);

drop policy if exists "portfolio_media_admin_delete" on storage.objects;
create policy "portfolio_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (auth.jwt() ->> 'email') = 'giaphufpt1@gmail.com'
);
