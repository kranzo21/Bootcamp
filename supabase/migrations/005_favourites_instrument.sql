-- Migration 005: Extend user_favourites to support instruments

alter table public.user_favourites
  drop constraint user_favourites_item_type_check;

alter table public.user_favourites
  add constraint user_favourites_item_type_check
  check (item_type in ('tutorial', 'ressource', 'instrument'));
