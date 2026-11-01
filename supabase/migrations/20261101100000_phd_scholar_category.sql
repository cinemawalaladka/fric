-- Migration: Add PhD Scholar Incentive Claim Category
-- Adds phd_scholars detail table, claim_type, document_type, indexes and RLS policies

-- 1. Create phd_scholars table
create table if not exists public.phd_scholars (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  scholar_enrollment_id text not null,
  scholar_name text not null,
  school text not null,
  department text not null,
  discipline text not null,
  notification_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for performance
create index if not exists idx_phd_scholars_claim_id on public.phd_scholars(claim_id);
create index if not exists idx_phd_scholars_enrollment_id on public.phd_scholars(scholar_enrollment_id);

-- 3. Enable RLS
alter table public.phd_scholars enable row level security;

-- 4. RLS Policies
create policy "Allow authenticated read phd_scholars"
  on public.phd_scholars for select
  to authenticated
  using (true);

create policy "Allow service_role all on phd_scholars"
  on public.phd_scholars for all
  to service_role
  using (true)
  with check (true);

-- 5. Insert PHD_SCHOLAR claim_type
insert into public.claim_types (id, code, name, description, is_active)
values (
  '485b4814-2b9e-4512-bf0d-234b4feb3eae',
  'PHD_SCHOLAR',
  'PhD Scholar',
  'Incentive claim for PhD Scholar guidance and degree award notification.',
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

-- 6. Insert PHD_SCHOLAR_PROOF document_type
insert into public.document_types (id, claim_type_id, code, name, description, is_mandatory, max_file_size_mb, allowed_extensions, is_active)
values (
  '3110d5cf-0441-4c0b-b2ec-ec132b272b85',
  '485b4814-2b9e-4512-bf0d-234b4feb3eae',
  'PHD_SCHOLAR_PROOF',
  'PhD Notification / Degree Award Document',
  'Upload official PhD notification / degree award certificate proof.',
  true,
  10,
  array['pdf', 'jpg', 'jpeg', 'png'],
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

