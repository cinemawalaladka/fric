-- Migration: Book Chapter and IPR / Patent Enhancements
-- 1. Book Chapters table enhancements
alter table public.book_chapters
  add column if not exists doi text,
  add column if not exists web_link text,
  add column if not exists publication_level text check (publication_level in ('International', 'National', 'State', 'Local')),
  add column if not exists recognized_body text,
  add column if not exists other_recognized_body text;

-- 2. Books table enhancements (for book chapters saved to books)
alter table public.books
  add column if not exists doi text;

-- 3. Patents table enhancements
alter table public.patents
  add column if not exists country text,
  add column if not exists patent_status text,
  add column if not exists publication_level text check (publication_level in ('International', 'National', 'State', 'Local'));

-- 4. Drop restrictive check constraint on patent_type if present so it can store Utility / Design
do $$
begin
  alter table public.patents
    drop constraint if exists patents_patent_type_check;
exception
  when others then null;
end $$;

-- 5. Add check constraint on patent_status allowing Published and Granted
do $$
begin
  alter table public.patents
    drop constraint if exists patents_patent_status_check;

  alter table public.patents
    add constraint patents_patent_status_check
    check (patent_status in ('PUBLISHED', 'GRANTED', 'Published', 'Granted', 'FILED', 'Filed'));
exception
  when others then null;
end $$;
