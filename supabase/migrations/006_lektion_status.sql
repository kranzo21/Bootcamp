-- Migration 006: Draft/Publish status for Lektionen
alter table public.lektionen
  add column if not exists status text not null default 'published'
  check (status in ('draft', 'published'));
