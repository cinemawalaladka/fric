-- Migration: User First-Login Password Change & User Creation
-- Adds must_change_password flag to faculty table and ensures proper indexes

alter table public.faculty
  add column if not exists must_change_password boolean default true;

-- Ensure index on auth_user_id for rapid lookups
create index if not exists idx_faculty_auth_user_id on public.faculty(auth_user_id);
create index if not exists idx_faculty_must_change_password on public.faculty(must_change_password);
