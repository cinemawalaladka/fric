-- Migration: Streamline Citations Table
-- Remove paper-specific fields (title of paper, journal name, citation database, doi, issn, publication year)
-- from citations schema and ensure citation impact fields are present.

-- 1. Drop unused paper-specific columns if they exist
alter table public.citations
  drop column if exists journal_name,
  drop column if exists doi,
  drop column if exists issn,
  drop column if exists publication_year,
  drop column if exists cited_by_title;

-- 2. Make citation_database nullable if present
alter table public.citations
  alter column citation_database drop not null;

-- 3. Ensure citation impact metric columns exist
alter table public.citations
  add column if not exists scopus_id text,
  add column if not exists total_citations_last_calendar_year integer,
  add column if not exists total_ppsu_citations_last_calendar_year integer;
