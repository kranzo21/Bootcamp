-- Migration 004: Worship Content Columns

-- Lektionen: Rich-Text-Inhalt und eingebettetes YouTube-Video
alter table public.lektionen
  add column if not exists content text,
  add column if not exists video_url text,
  add column if not exists video_position text not null default 'above'
    check (video_position in ('above', 'below'));

-- Tutorials: optionaler Instrument-Filter-Tag
alter table public.tutorials
  add column if not exists instrument text;

-- Ressourcen: optionaler Instrument-Filter-Tag
alter table public.ressourcen
  add column if not exists instrument text;
