-- Migration: Citation and Research Project Enhancements
-- 1. Citations table enhancements
alter table public.citations
  add column if not exists scopus_id text,
  add column if not exists total_citations_last_calendar_year integer,
  add column if not exists total_ppsu_citations_last_calendar_year integer,
  add column if not exists journal_name text,
  add column if not exists doi text,
  add column if not exists issn text,
  add column if not exists publication_year integer;

-- 2. Research Projects table enhancements
alter table public.research_projects
  add column if not exists amount_deposited_in_ppsu numeric(14,2),
  add column if not exists deposit_date date,
  add column if not exists deposit_proof_url text;
