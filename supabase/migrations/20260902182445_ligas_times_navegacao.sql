-- ============================================================
-- Navegação por Ligas e Times: logo/escudo por taxonomia,
-- e uma "região" pra separar clubes nacionais de europeus.
-- ============================================================

alter table public.taxonomies
  add column if not exists image_url text;

alter table public.taxonomies
  add column if not exists region text check (region in ('nacional', 'europeu'));

comment on column public.taxonomies.image_url is
  'Logo/escudo (liga ou clube) exibido nas vitrines de navegação.';
comment on column public.taxonomies.region is
  'Só usado quando type = ''club'': agrupa em "Times nacionais" ou "Times europeus".';
