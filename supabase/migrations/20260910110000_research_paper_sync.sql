-- Migration: Research Paper Sync & Authorship Enhancement
-- 1. Relax publication_authors unique constraint to allow flexible author orders and joint positions
alter table public.publication_authors
  drop constraint if exists publication_authors_publication_id_author_order_key;

-- 2. Ensure all helper columns on publication_authors exist
alter table public.publication_authors
  add column if not exists author_number integer,
  add column if not exists affiliation text,
  add column if not exists institution text;

-- 3. Ensure publication_authors index for efficient lookups
create index if not exists publication_authors_pub_order_idx
  on public.publication_authors(publication_id, author_order);

-- 4. Ensure publications table columns exist
alter table public.publications
  add column if not exists work_title text,
  add column if not exists recognized_body text,
  add column if not exists other_recognized_body text,
  add column if not exists publication_level text;

-- 5. Backfill any missing work_title from title if null
update public.publications
set work_title = title
where work_title is null;
