-- Migration: Book Publisher and Schema Sync
-- Ensures publisher, work_title, and related metadata columns on public.books

-- 1. Ensure publisher column exists on books
alter table public.books
  add column if not exists publisher text;

-- 2. Ensure work_title column exists on books
alter table public.books
  add column if not exists work_title text;

-- 3. Populate work_title from title where missing
update public.books
  set work_title = title
  where work_title is null and title is not null;

-- 4. Comment on table and columns
comment on column public.books.title is 'Title of Publish / Book title';
comment on column public.books.publisher is 'Name of Publisher';
comment on column public.books.work_title is 'Title of Publish / Research work title';
