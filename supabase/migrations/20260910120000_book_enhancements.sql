-- Migration: Book Claim Enhancements
-- 1. Add web_link to books table for international book publications
alter table public.books
  add column if not exists web_link text;

-- 2. Ensure publication_level check constraint supports 'State'
do $$
begin
  alter table public.books
    drop constraint if exists books_publication_level_check;
  
  alter table public.books
    add constraint books_publication_level_check
    check (publication_level in ('International', 'National', 'State', 'Local'));
exception
  when others then null;
end $$;
