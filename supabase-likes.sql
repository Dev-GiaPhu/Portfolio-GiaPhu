-- Chạy file này trong Supabase SQL Editor.
create table if not exists public.portfolio_likes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_likes enable row level security;

drop policy if exists "Ai cũng xem được tổng lượt tim" on public.portfolio_likes;
create policy "Ai cũng xem được tổng lượt tim"
on public.portfolio_likes for select
to anon, authenticated
using (true);

drop policy if exists "Người dùng chỉ tim bằng chính tài khoản của mình" on public.portfolio_likes;
create policy "Người dùng chỉ tim bằng chính tài khoản của mình"
on public.portfolio_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Người dùng chỉ bỏ tim của chính mình" on public.portfolio_likes;
create policy "Người dùng chỉ bỏ tim của chính mình"
on public.portfolio_likes for delete
to authenticated
using (auth.uid() = user_id);
