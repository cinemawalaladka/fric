-- Migration: Incentive Claim Enhancements
-- Title separation, recognized body, author positions/numbers, project details, and helper functions

-- 1. Publications table enhancements
alter table public.publications 
  add column if not exists work_title text,
  add column if not exists recognized_body text,
  add column if not exists other_recognized_body text,
  add column if not exists publication_level text check (publication_level in ('International', 'National', 'State', 'Local'));

-- Copy title to work_title if work_title is null
update public.publications set work_title = title where work_title is null;

-- 2. Books table enhancements
alter table public.books
  add column if not exists work_title text,
  add column if not exists recognized_body text,
  add column if not exists other_recognized_body text,
  add column if not exists publication_level text check (publication_level in ('International', 'National', 'State', 'Local'));

update public.books set work_title = title where work_title is null;

-- 3. Publication Authors table enhancements
alter table public.publication_authors
  add column if not exists author_number integer,
  add column if not exists affiliation text,
  add column if not exists institution text;

-- 4. Research Projects table enhancements
alter table public.research_projects
  add column if not exists sponsoring_body text,
  add column if not exists project_level text check (project_level in ('International', 'National', 'State', 'Local', 'Industry')),
  add column if not exists pi_copi_status text check (pi_copi_status in ('PI', 'Co-PI')),
  add column if not exists copi_number integer,
  add column if not exists address text,
  add column if not exists amount_in_words text;

-- 5. Helper function to list faculty for author auto-completion
create or replace function public.get_active_faculty_list()
returns table (
  id uuid,
  name text,
  email text,
  employee_id text,
  designation text,
  department_name text
)
language sql
security definer
set search_path = public
as $$
  select 
    f.id,
    f.name,
    f.email,
    f.employee_id,
    f.designation,
    d.name as department_name
  from public.faculty f
  left join public.departments d on d.id = f.department_id
  where f.status = 'ACTIVE'
  order by f.name asc;
$$;
