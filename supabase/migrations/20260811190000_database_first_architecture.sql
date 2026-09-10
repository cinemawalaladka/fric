-- PPSU FRIC database-first architecture
-- Fresh Supabase project baseline for identity, RBAC, workflow, claims, documents, audit, and seeds.

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Identity and organization
-- =========================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_id_matches_auth_user_id check (id = auth_user_id)
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  name text not null,
  code text not null unique,
  hod_user_id uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faculty (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references public.users(id) on delete cascade,
  employee_id text unique,
  name text not null,
  email text not null unique,
  department_id uuid references public.departments(id) on delete set null,
  designation text,
  phone text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  accepts_claims boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_valid_dates check (start_date < end_date)
);

create unique index academic_years_one_active_idx
on public.academic_years (is_active)
where is_active;

-- =========================
-- Access control
-- =========================

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'EXPIRED')),
  primary key (user_id, role_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_by uuid references public.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

-- =========================
-- Research committee
-- =========================

create table public.research_committees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.research_committees(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  position text not null check (position in ('MEMBER_1', 'MEMBER_2', 'GOVERNOR')),
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (committee_id, position, is_active),
  unique (committee_id, user_id, position)
);

-- =========================
-- Claims
-- =========================

create table public.claim_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_statuses (
  code text primary key,
  label text not null,
  description text,
  sort_order integer not null,
  is_terminal boolean not null default false
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  claim_number text not null unique,
  faculty_id uuid not null references public.faculty(id) on delete restrict,
  claim_type_id uuid not null references public.claim_types(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  status text not null references public.claim_statuses(code) default 'DRAFT',
  current_stage text,
  claimed_amount numeric(12,2),
  calculated_amount numeric(12,2),
  approved_amount numeric(12,2),
  submitted_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_non_negative_amounts check (
    coalesce(claimed_amount, 0) >= 0
    and coalesce(calculated_amount, 0) >= 0
    and coalesce(approved_amount, 0) >= 0
  )
);

create table public.claim_comments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  comment text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.claim_history (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  changed_by uuid references public.users(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  from_stage text,
  to_stage text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- =========================
-- Research data
-- =========================

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  title text not null,
  journal_name text,
  issn text,
  publication_date date,
  indexing text,
  quartile text,
  impact_factor numeric(8,3),
  acceptance_rate numeric(5,2),
  abdc_category text,
  doi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.publication_authors (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  author_name text not null,
  author_order integer not null,
  is_first_author boolean not null default false,
  is_corresponding_author boolean not null default false,
  is_ppsu_faculty boolean not null default false,
  created_at timestamptz not null default now(),
  unique (publication_id, author_order)
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  title text not null,
  publisher text,
  isbn text,
  publication_date date,
  book_type text check (book_type in ('AUTHORED', 'EDITED', 'CHAPTER')),
  chapter_title text,
  scopus_indexed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.book_chapters (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  chapter_title text not null,
  book_title text,
  publisher text,
  isbn text,
  publication_date date,
  chapter_pages text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  title text not null,
  patent_number text,
  filing_date date,
  publication_date date,
  grant_date date,
  patent_office text,
  patent_type text check (patent_type in ('FILED', 'PUBLISHED', 'GRANTED')),
  inventors text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.citations (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  source_title text not null,
  cited_by_title text,
  citation_database text,
  citation_count integer not null default 0,
  h_index integer,
  i10_index integer,
  verification_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.research_projects (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  title text not null,
  funding_agency text,
  sanctioned_amount numeric(14,2),
  project_start_date date,
  project_end_date date,
  project_status text check (project_status in ('ONGOING', 'COMPLETED')),
  grant_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  member_name text not null,
  role text,
  is_pi boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================
-- Documents
-- =========================

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  claim_type_id uuid references public.claim_types(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_mandatory boolean not null default true,
  max_file_size_mb integer not null default 10,
  allowed_extensions text[] not null default array['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (claim_type_id, code)
);

create table public.claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  document_type_id uuid references public.document_types(id) on delete set null,
  document_type text not null,
  file_name text not null,
  storage_bucket text not null default 'claim-documents',
  storage_path text not null unique,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references public.users(id) on delete set null,
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by uuid references public.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_verifications (
  id uuid primary key default gen_random_uuid(),
  claim_document_id uuid not null references public.claim_documents(id) on delete cascade,
  verifier_id uuid references public.users(id) on delete set null,
  status text not null check (status in ('PENDING', 'VERIFIED', 'REJECTED')),
  remarks text,
  created_at timestamptz not null default now()
);

-- =========================
-- Incentive and policy
-- =========================

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  effective_from date not null,
  effective_until date,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index policy_versions_one_active_idx
on public.policy_versions (status)
where status = 'ACTIVE';

create table public.incentive_rules (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid references public.policy_versions(id) on delete set null,
  claim_type_id uuid not null references public.claim_types(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null,
  active_from date not null default current_date,
  active_until date,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rule_criteria (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.incentive_rules(id) on delete cascade,
  criterion text not null,
  operator text not null check (operator in ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_EQUAL', 'LESS_EQUAL', 'IN', 'NOT_IN', 'BETWEEN')),
  value text not null,
  created_at timestamptz not null default now()
);

-- =========================
-- Workflow and approval
-- =========================

create table public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_stages (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
  stage_code text not null,
  stage_name text not null,
  role_code text,
  committee_position text check (committee_position in ('MEMBER_1', 'MEMBER_2', 'GOVERNOR') or committee_position is null),
  sort_order integer not null,
  can_modify_amount boolean not null default false,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_definition_id, stage_code),
  unique (workflow_definition_id, sort_order)
);

create table public.workflow_stage_rules (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
  submitter_role_code text not null,
  claim_type_id uuid references public.claim_types(id) on delete cascade,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.claim_approvals (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  workflow_stage_id uuid references public.workflow_stages(id) on delete set null,
  stage text not null,
  approver_id uuid references public.users(id) on delete set null,
  status text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'RETURNED', 'APPROVED', 'REJECTED', 'SKIPPED')),
  remarks text,
  approved_amount numeric(12,2),
  original_amount numeric(12,2),
  modified_amount numeric(12,2),
  action_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  claim_approval_id uuid references public.claim_approvals(id) on delete set null,
  claim_id uuid not null references public.claims(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null check (action in ('SUBMIT', 'APPROVE', 'VERIFY', 'RETURN', 'REJECT', 'SKIP', 'AMOUNT_MODIFY')),
  from_status text,
  to_status text,
  from_stage text,
  to_stage text,
  original_amount numeric(12,2),
  modified_amount numeric(12,2),
  remarks text,
  created_at timestamptz not null default now()
);

-- =========================
-- Notifications, audit, system
-- =========================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  claim_updates_enabled boolean not null default true,
  admin_updates_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table public.login_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text,
  event text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.role_change_logs (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  changed_by uuid references public.users(id) on delete set null,
  action text not null check (action in ('ASSIGN', 'REMOVE', 'ACTIVATE', 'DEACTIVATE')),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Indexes
-- =========================

create index users_auth_user_id_idx on public.users(auth_user_id);
create index faculty_auth_user_id_idx on public.faculty(auth_user_id);
create index faculty_department_id_idx on public.faculty(department_id);
create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_role_id_idx on public.user_roles(role_id);
create index role_permissions_role_id_idx on public.role_permissions(role_id);
create index role_permissions_permission_id_idx on public.role_permissions(permission_id);
create index claims_faculty_id_idx on public.claims(faculty_id);
create index claims_status_idx on public.claims(status);
create index claims_current_stage_idx on public.claims(current_stage);
create index claim_documents_claim_id_idx on public.claim_documents(claim_id);
create index claim_approvals_claim_id_idx on public.claim_approvals(claim_id);
create index claim_approvals_approver_id_idx on public.claim_approvals(approver_id);
create index notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

-- =========================
-- Triggers
-- =========================

create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_schools_updated_at before update on public.schools for each row execute function public.set_updated_at();
create trigger set_departments_updated_at before update on public.departments for each row execute function public.set_updated_at();
create trigger set_faculty_updated_at before update on public.faculty for each row execute function public.set_updated_at();
create trigger set_academic_years_updated_at before update on public.academic_years for each row execute function public.set_updated_at();
create trigger set_roles_updated_at before update on public.roles for each row execute function public.set_updated_at();
create trigger set_research_committees_updated_at before update on public.research_committees for each row execute function public.set_updated_at();
create trigger set_committee_members_updated_at before update on public.committee_members for each row execute function public.set_updated_at();
create trigger set_claim_types_updated_at before update on public.claim_types for each row execute function public.set_updated_at();
create trigger set_claims_updated_at before update on public.claims for each row execute function public.set_updated_at();
create trigger set_publications_updated_at before update on public.publications for each row execute function public.set_updated_at();
create trigger set_books_updated_at before update on public.books for each row execute function public.set_updated_at();
create trigger set_book_chapters_updated_at before update on public.book_chapters for each row execute function public.set_updated_at();
create trigger set_patents_updated_at before update on public.patents for each row execute function public.set_updated_at();
create trigger set_citations_updated_at before update on public.citations for each row execute function public.set_updated_at();
create trigger set_research_projects_updated_at before update on public.research_projects for each row execute function public.set_updated_at();
create trigger set_document_types_updated_at before update on public.document_types for each row execute function public.set_updated_at();
create trigger set_claim_documents_updated_at before update on public.claim_documents for each row execute function public.set_updated_at();
create trigger set_policy_versions_updated_at before update on public.policy_versions for each row execute function public.set_updated_at();
create trigger set_incentive_rules_updated_at before update on public.incentive_rules for each row execute function public.set_updated_at();
create trigger set_workflow_definitions_updated_at before update on public.workflow_definitions for each row execute function public.set_updated_at();
create trigger set_workflow_stages_updated_at before update on public.workflow_stages for each row execute function public.set_updated_at();
create trigger set_claim_approvals_updated_at before update on public.claim_approvals for each row execute function public.set_updated_at();
create trigger set_notification_preferences_updated_at before update on public.notification_preferences for each row execute function public.set_updated_at();
create trigger set_system_settings_updated_at before update on public.system_settings for each row execute function public.set_updated_at();

-- =========================
-- Auth sync
-- =========================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, auth_user_id, email)
  values (new.id, new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        auth_user_id = excluded.auth_user_id,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.users (id, auth_user_id, email, created_at, updated_at)
select id, id, email, created_at, now()
from auth.users
on conflict (id) do nothing;

-- =========================
-- Seeds
-- =========================

insert into public.schools (name, code)
values
  ('School of Engineering and Technology', 'SET'),
  ('School of Management', 'SOM'),
  ('School of Liberal Studies', 'SLS')
on conflict (code) do nothing;

insert into public.departments (school_id, name, code)
select s.id, d.name, d.code
from public.schools s
join (
  values
    ('SET', 'Computer Science and Engineering', 'CSE'),
    ('SET', 'Information Technology', 'IT'),
    ('SET', 'Mechanical Engineering', 'ME'),
    ('SOM', 'Management Studies', 'MS'),
    ('SLS', 'Liberal Studies', 'LS')
) as d(school_code, name, code) on d.school_code = s.code
on conflict (code) do nothing;

insert into public.academic_years (name, start_date, end_date, is_active, accepts_claims)
values ('2026-27', '2026-07-01', '2027-06-30', true, true)
on conflict (name) do update
set is_active = excluded.is_active,
    accepts_claims = excluded.accepts_claims,
    updated_at = now();

insert into public.roles (name, description, is_system)
values
  ('FACULTY', 'Faculty users can create and track their own research incentive claims.', true),
  ('HOD', 'Department head reviewer for claims submitted by faculty in the same department.', true),
  ('RESEARCH_COMMITTEE_MEMBER', 'Research committee reviewer for configured committee stages.', true),
  ('GOVERNOR', 'Governor stage member of the research committee workflow.', true),
  ('PROVOST', 'Final approval authority with controlled amount modification permission.', true),
  ('RESEARCH_VERIFIER', 'Legacy verifier role kept for the current UI while workflow-specific roles are introduced.', true),
  ('SUPER_ADMIN', 'System control authority for configuration, users, permissions, audit and reports.', true)
on conflict (name) do update
set description = excluded.description,
    is_system = excluded.is_system,
    updated_at = now();

insert into public.permissions (code, name, module, action, description)
values
  ('claim.create', 'Create Claim', 'claims', 'create', 'Create research incentive claim drafts and submissions.'),
  ('claim.view_own', 'View Own Claims', 'claims', 'view_own', 'View claims submitted by the current user.'),
  ('claim.view_department', 'View Department Claims', 'claims', 'view_department', 'View claims submitted by users in the same department.'),
  ('claim.view_assigned', 'View Assigned Claims', 'claims', 'view_assigned', 'View claims assigned to the current approval stage.'),
  ('claim.view_all', 'View All Claims', 'claims', 'view_all', 'View every claim in the system.'),
  ('claim.approve', 'Approve Claim', 'claims', 'approve', 'Approve or verify claims at permitted workflow stages.'),
  ('claim.return', 'Return Claim', 'claims', 'return', 'Return a claim with remarks.'),
  ('claim.amount.edit', 'Modify Final Amount', 'claims', 'amount_edit', 'Modify final approved incentive amount with remarks.'),
  ('document.upload', 'Upload Document', 'documents', 'upload', 'Upload supporting claim documents.'),
  ('document.view', 'View Documents', 'documents', 'view', 'View permitted claim documents.'),
  ('document.verify', 'Verify Documents', 'documents', 'verify', 'Verify or reject claim documents.'),
  ('user.manage', 'Manage Users', 'admin', 'user_manage', 'Create, update, activate and deactivate users.'),
  ('role.manage', 'Manage Roles', 'admin', 'role_manage', 'Assign and remove roles.'),
  ('permission.manage', 'Manage Permissions', 'admin', 'permission_manage', 'Configure role permission mappings.'),
  ('committee.manage', 'Manage Committee', 'admin', 'committee_manage', 'Configure research committee membership.'),
  ('workflow.manage', 'Manage Workflow', 'admin', 'workflow_manage', 'Configure workflow definitions and stage rules.'),
  ('rule.manage', 'Manage Incentive Rules', 'admin', 'rule_manage', 'Configure incentive policies and criteria.'),
  ('report.view', 'View Reports', 'reports', 'view', 'View institutional reports.'),
  ('audit.view', 'View Audit Logs', 'audit', 'view', 'View audit trails and sensitive action history.'),
  ('settings.manage', 'Manage Settings', 'admin', 'settings_manage', 'Update system settings.'),
  ('notification.view', 'View Notifications', 'notifications', 'view', 'View user notifications.')
on conflict (code) do update
set name = excluded.name,
    module = excluded.module,
    action = excluded.action,
    description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  (r.name = 'FACULTY' and p.code in ('claim.create', 'claim.view_own', 'document.upload', 'document.view', 'notification.view'))
  or (r.name = 'HOD' and p.code in ('claim.view_department', 'claim.approve', 'claim.return', 'document.view', 'document.verify', 'notification.view'))
  or (r.name = 'RESEARCH_COMMITTEE_MEMBER' and p.code in ('claim.view_assigned', 'claim.approve', 'claim.return', 'document.view', 'document.verify', 'notification.view'))
  or (r.name = 'GOVERNOR' and p.code in ('claim.view_assigned', 'claim.approve', 'claim.return', 'document.view', 'document.verify', 'notification.view'))
  or (r.name = 'PROVOST' and p.code in ('claim.view_assigned', 'claim.approve', 'claim.return', 'claim.amount.edit', 'document.view', 'report.view', 'notification.view'))
  or (r.name = 'RESEARCH_VERIFIER' and p.code in ('claim.view_all', 'claim.approve', 'claim.return', 'document.view', 'document.verify', 'notification.view'))
  or (r.name = 'SUPER_ADMIN')
)
on conflict do nothing;

insert into public.claim_statuses (code, label, description, sort_order, is_terminal)
values
  ('DRAFT', 'Draft', 'Claim is saved but not submitted.', 10, false),
  ('SUBMITTED', 'Submitted', 'Claim submitted and waiting for first approval stage.', 20, false),
  ('UNDER_VERIFICATION', 'Under Verification', 'Claim is moving through configured approval workflow.', 30, false),
  ('VERIFIED', 'Verified', 'Claim has been verified by an intermediate approver.', 40, false),
  ('RETURNED', 'Returned', 'Claim returned for corrections.', 50, false),
  ('RESUBMITTED', 'Resubmitted', 'Returned claim resubmitted by faculty.', 60, false),
  ('REJECTED', 'Rejected', 'Claim rejected by an approver.', 70, true),
  ('APPROVED', 'Approved', 'Claim received final approval.', 80, true)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_terminal = excluded.is_terminal;

insert into public.claim_types (name, code, description)
values
  ('Research Paper', 'JOURNAL_PUBLICATION', 'Journal publication or research paper incentive claim.'),
  ('Book', 'BOOK', 'Authored or edited book incentive claim.'),
  ('Book Chapter', 'BOOK_CHAPTER', 'Book chapter incentive claim.'),
  ('Patent', 'PATENT', 'Filed, published or granted patent incentive claim.'),
  ('Citation', 'CITATION', 'Citation impact incentive claim.'),
  ('Research Project', 'RESEARCH_PROJECT', 'Externally funded research project incentive claim.')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    updated_at = now();

insert into public.policy_versions (name, description, effective_from, status)
values ('PPSU Research Incentive Policy 2026', 'Initial development policy seed for FRIC portal.', '2026-07-01', 'ACTIVE')
on conflict (name) do update
set status = excluded.status,
    updated_at = now();

insert into public.incentive_rules (policy_version_id, claim_type_id, category, amount, active_from, status)
select pv.id, ct.id, r.category, r.amount, '2026-07-01', 'ACTIVE'
from public.policy_versions pv
join public.claim_types ct on true
join (
  values
    ('JOURNAL_PUBLICATION', 'Standard Journal Publication', 50000::numeric),
    ('BOOK', 'Standard Book', 75000::numeric),
    ('BOOK_CHAPTER', 'Standard Book Chapter', 25000::numeric),
    ('PATENT', 'Standard Patent', 100000::numeric),
    ('CITATION', 'Standard Citation Incentive', 15000::numeric),
    ('RESEARCH_PROJECT', 'Standard Research Project', 100000::numeric)
) as r(code, category, amount) on r.code = ct.code
where pv.name = 'PPSU Research Incentive Policy 2026'
on conflict do nothing;

insert into public.workflow_definitions (code, name, description, is_active)
values
  ('FACULTY_STANDARD', 'Faculty Standard Workflow', 'Faculty -> HOD -> Committee M1 -> Committee M2 -> Governor -> Provost -> Final', true),
  ('HOD_SUBMISSION', 'HOD Submission Workflow', 'HOD submitter bypasses self-approval and starts at Committee M1.', true),
  ('COMMITTEE_SUBMISSION', 'Research Committee Submission Workflow', 'Committee member submitter goes to Governor and Provost.', true),
  ('GOVERNOR_SUBMISSION', 'Governor Submission Workflow', 'Governor submitter goes directly to Provost.', true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.workflow_stages (workflow_definition_id, stage_code, stage_name, role_code, committee_position, sort_order, can_modify_amount, is_final)
select wd.id, s.stage_code, s.stage_name, s.role_code, s.committee_position, s.sort_order, s.can_modify_amount, s.is_final
from public.workflow_definitions wd
join (
  values
    ('FACULTY_STANDARD', 'HOD_PRINCIPAL', 'Department HOD Review', 'HOD', null::text, 1, false, false),
    ('FACULTY_STANDARD', 'COMMITTEE_M1', 'Research Committee Member 1', 'RESEARCH_COMMITTEE_MEMBER', 'MEMBER_1', 2, false, false),
    ('FACULTY_STANDARD', 'COMMITTEE_M2', 'Research Committee Member 2', 'RESEARCH_COMMITTEE_MEMBER', 'MEMBER_2', 3, false, false),
    ('FACULTY_STANDARD', 'GOVERNOR', 'Governor Review', 'GOVERNOR', 'GOVERNOR', 4, false, false),
    ('FACULTY_STANDARD', 'PROVOST', 'Provost Final Sanction', 'PROVOST', null::text, 5, true, true),
    ('HOD_SUBMISSION', 'COMMITTEE_M1', 'Research Committee Member 1', 'RESEARCH_COMMITTEE_MEMBER', 'MEMBER_1', 1, false, false),
    ('HOD_SUBMISSION', 'COMMITTEE_M2', 'Research Committee Member 2', 'RESEARCH_COMMITTEE_MEMBER', 'MEMBER_2', 2, false, false),
    ('HOD_SUBMISSION', 'GOVERNOR', 'Governor Review', 'GOVERNOR', 'GOVERNOR', 3, false, false),
    ('HOD_SUBMISSION', 'PROVOST', 'Provost Final Sanction', 'PROVOST', null::text, 4, true, true),
    ('COMMITTEE_SUBMISSION', 'GOVERNOR', 'Governor Review', 'GOVERNOR', 'GOVERNOR', 1, false, false),
    ('COMMITTEE_SUBMISSION', 'PROVOST', 'Provost Final Sanction', 'PROVOST', null::text, 2, true, true),
    ('GOVERNOR_SUBMISSION', 'PROVOST', 'Provost Final Sanction', 'PROVOST', null::text, 1, true, true)
) as s(workflow_code, stage_code, stage_name, role_code, committee_position, sort_order, can_modify_amount, is_final)
  on s.workflow_code = wd.code
on conflict (workflow_definition_id, stage_code) do update
set stage_name = excluded.stage_name,
    role_code = excluded.role_code,
    committee_position = excluded.committee_position,
    sort_order = excluded.sort_order,
    can_modify_amount = excluded.can_modify_amount,
    is_final = excluded.is_final,
    updated_at = now();

insert into public.workflow_stage_rules (workflow_definition_id, submitter_role_code, priority, is_active)
select wd.id, r.submitter_role_code, r.priority, true
from public.workflow_definitions wd
join (
  values
    ('FACULTY_STANDARD', 'FACULTY', 100),
    ('HOD_SUBMISSION', 'HOD', 90),
    ('COMMITTEE_SUBMISSION', 'RESEARCH_COMMITTEE_MEMBER', 80),
    ('GOVERNOR_SUBMISSION', 'GOVERNOR', 70)
) as r(workflow_code, submitter_role_code, priority) on r.workflow_code = wd.code
on conflict do nothing;

insert into public.document_types (claim_type_id, code, name, description, is_mandatory)
select ct.id, d.code, d.name, d.description, true
from public.claim_types ct
join (
  values
    ('JOURNAL_PUBLICATION', 'PUBLICATION_PROOF', 'Publication Proof', 'Accepted/published paper proof with journal details.'),
    ('BOOK', 'BOOK_PROOF', 'Book Proof', 'Publisher proof, ISBN page and book details.'),
    ('BOOK_CHAPTER', 'CHAPTER_PROOF', 'Book Chapter Proof', 'Chapter acceptance/publication proof.'),
    ('PATENT', 'PATENT_PROOF', 'Patent Proof', 'Patent filing, publication or grant proof.'),
    ('CITATION', 'CITATION_PROOF', 'Citation Proof', 'Citation database proof.'),
    ('RESEARCH_PROJECT', 'SANCTION_LETTER', 'Sanction Letter', 'Funding sanction letter and project details.')
) as d(claim_type_code, code, name, description) on d.claim_type_code = ct.code
on conflict (claim_type_id, code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    updated_at = now();

insert into public.system_settings (key, value, description, is_public)
values
  ('portal_name', '"PPSU Research Incentive Portal"'::jsonb, 'Display name used by administrative modules.', true),
  ('claim_documents_bucket', '"claim-documents"'::jsonb, 'Private Supabase Storage bucket for claim files.', false),
  ('workflow_mode', '"database_driven"'::jsonb, 'Current workflow mode.', true)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    is_public = excluded.is_public,
    updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-documents',
  'claim-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- =========================
-- Views
-- =========================

create or replace view public.admin_users_view
with (security_invoker = true)
as
select
  f.id as faculty_id,
  f.auth_user_id,
  f.name,
  f.email,
  f.employee_id,
  f.designation,
  f.status,
  d.name as department_name,
  d.code as department_code,
  coalesce(array_agg(r.name order by r.name) filter (where r.name is not null), array[]::text[]) as roles
from public.faculty f
left join public.departments d on d.id = f.department_id
left join public.user_roles ur on ur.user_id = f.auth_user_id and ur.status = 'ACTIVE'
left join public.roles r on r.id = ur.role_id and r.is_active = true
group by f.id, d.id;

-- =========================
-- RLS helper functions
-- =========================

create or replace function app_private.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = (select auth.uid())
      and ur.status = 'ACTIVE'
      and r.is_active = true
      and p.code = permission_code
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function app_private.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid())
      and ur.status = 'ACTIVE'
      and r.is_active = true
      and r.name = role_code
      and (ur.expires_at is null or ur.expires_at > now())
  );
$$;

create or replace function app_private.current_faculty_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select f.id
  from public.faculty f
  where f.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function app_private.can_select_claim(target_claim_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.claims c
    join public.faculty owner_f on owner_f.id = c.faculty_id
    left join public.faculty viewer_f on viewer_f.auth_user_id = (select auth.uid())
    where c.id = target_claim_id
      and (
        owner_f.auth_user_id = (select auth.uid())
        or app_private.has_permission('claim.view_all')
        or (
          app_private.has_permission('claim.view_department')
          and viewer_f.department_id is not null
          and viewer_f.department_id = owner_f.department_id
        )
        or (
          app_private.has_permission('claim.view_assigned')
          and exists (
            select 1
            from public.claim_approvals ca
            where ca.claim_id = c.id
              and ca.approver_id = (select auth.uid())
              and ca.status = 'PENDING'
          )
        )
      )
  );
$$;

revoke all on function app_private.has_permission(text) from public;
revoke all on function app_private.has_role(text) from public;
revoke all on function app_private.current_faculty_id() from public;
revoke all on function app_private.can_select_claim(uuid) from public;
grant execute on function app_private.has_permission(text) to authenticated, service_role;
grant execute on function app_private.has_role(text) to authenticated, service_role;
grant execute on function app_private.current_faculty_id() to authenticated, service_role;
grant execute on function app_private.can_select_claim(uuid) to authenticated, service_role;

-- =========================
-- Grants and RLS
-- =========================

grant usage on schema public to anon, authenticated;
grant select on public.claim_types, public.claim_statuses, public.academic_years, public.document_types, public.workflow_definitions, public.workflow_stages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.admin_users_view to authenticated;

alter table public.users enable row level security;
alter table public.schools enable row level security;
alter table public.departments enable row level security;
alter table public.faculty enable row level security;
alter table public.academic_years enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.research_committees enable row level security;
alter table public.committee_members enable row level security;
alter table public.claim_types enable row level security;
alter table public.claim_statuses enable row level security;
alter table public.claims enable row level security;
alter table public.claim_comments enable row level security;
alter table public.claim_history enable row level security;
alter table public.publications enable row level security;
alter table public.publication_authors enable row level security;
alter table public.books enable row level security;
alter table public.book_chapters enable row level security;
alter table public.patents enable row level security;
alter table public.citations enable row level security;
alter table public.research_projects enable row level security;
alter table public.project_members enable row level security;
alter table public.document_types enable row level security;
alter table public.claim_documents enable row level security;
alter table public.document_verifications enable row level security;
alter table public.policy_versions enable row level security;
alter table public.incentive_rules enable row level security;
alter table public.rule_criteria enable row level security;
alter table public.workflow_definitions enable row level security;
alter table public.workflow_stages enable row level security;
alter table public.workflow_stage_rules enable row level security;
alter table public.claim_approvals enable row level security;
alter table public.approval_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_logs enable row level security;
alter table public.login_activity enable row level security;
alter table public.role_change_logs enable row level security;
alter table public.system_settings enable row level security;

create policy users_select_own_or_manage on public.users for select to authenticated
using (id = (select auth.uid()) or app_private.has_permission('user.manage'));

create policy users_update_own_last_login on public.users for update to authenticated
using (id = (select auth.uid()) or app_private.has_permission('user.manage'))
with check (id = (select auth.uid()) or app_private.has_permission('user.manage'));

create policy org_lookup_read on public.schools for select to anon, authenticated using (is_active = true);
create policy dept_lookup_read on public.departments for select to anon, authenticated using (is_active = true);
create policy org_manage_all on public.schools for all to authenticated using (app_private.has_permission('settings.manage')) with check (app_private.has_permission('settings.manage'));
create policy dept_manage_all on public.departments for all to authenticated using (app_private.has_permission('settings.manage') or app_private.has_permission('user.manage')) with check (app_private.has_permission('settings.manage') or app_private.has_permission('user.manage'));

create policy faculty_select_directory on public.faculty for select to authenticated
using (status = 'ACTIVE' or auth_user_id = (select auth.uid()) or app_private.has_permission('user.manage'));
create policy faculty_insert_manage on public.faculty for insert to authenticated with check (app_private.has_permission('user.manage'));
create policy faculty_update_manage on public.faculty for update to authenticated using (app_private.has_permission('user.manage')) with check (app_private.has_permission('user.manage'));

create policy active_academic_years_read on public.academic_years for select to anon, authenticated using (is_active = true or app_private.has_permission('settings.manage'));
create policy academic_years_manage on public.academic_years for all to authenticated using (app_private.has_permission('settings.manage')) with check (app_private.has_permission('settings.manage'));

create policy roles_read_authenticated on public.roles for select to authenticated using (true);
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);
create policy role_permissions_read_authenticated on public.role_permissions for select to authenticated using (true);
create policy roles_manage on public.roles for all to authenticated using (app_private.has_permission('role.manage')) with check (app_private.has_permission('role.manage'));
create policy permissions_manage on public.permissions for all to authenticated using (app_private.has_permission('permission.manage')) with check (app_private.has_permission('permission.manage'));
create policy role_permissions_manage on public.role_permissions for all to authenticated using (app_private.has_permission('permission.manage')) with check (app_private.has_permission('permission.manage'));

create policy user_roles_select_own_or_manage on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or app_private.has_permission('role.manage') or app_private.has_permission('user.manage'));
create policy user_roles_manage on public.user_roles for all to authenticated
using (app_private.has_permission('role.manage') or app_private.has_permission('user.manage'))
with check (app_private.has_permission('role.manage') or app_private.has_permission('user.manage'));

create policy committees_read_authenticated on public.research_committees for select to authenticated using (true);
create policy committee_members_read_authenticated on public.committee_members for select to authenticated using (true);
create policy committees_manage on public.research_committees for all to authenticated using (app_private.has_permission('committee.manage')) with check (app_private.has_permission('committee.manage'));
create policy committee_members_manage on public.committee_members for all to authenticated using (app_private.has_permission('committee.manage')) with check (app_private.has_permission('committee.manage'));

create policy claim_types_read_active on public.claim_types for select to anon, authenticated using (is_active = true or app_private.has_permission('rule.manage'));
create policy claim_statuses_read on public.claim_statuses for select to anon, authenticated using (true);
create policy claim_types_manage on public.claim_types for all to authenticated using (app_private.has_permission('rule.manage')) with check (app_private.has_permission('rule.manage'));

create policy claims_select_authorized on public.claims for select to authenticated using (app_private.can_select_claim(id));
create policy claims_insert_own on public.claims for insert to authenticated
with check (app_private.has_permission('claim.create') and faculty_id = app_private.current_faculty_id());
create policy claims_update_authorized on public.claims for update to authenticated
using (
  (faculty_id = app_private.current_faculty_id() and status in ('DRAFT', 'RETURNED'))
  or app_private.has_permission('claim.approve')
  or app_private.has_permission('claim.amount.edit')
)
with check (
  (faculty_id = app_private.current_faculty_id() and status in ('DRAFT', 'RETURNED', 'SUBMITTED', 'RESUBMITTED'))
  or app_private.has_permission('claim.approve')
  or app_private.has_permission('claim.amount.edit')
);
create policy claims_delete_own_drafts on public.claims for delete to authenticated
using (faculty_id = app_private.current_faculty_id() and status = 'DRAFT');

create policy claim_comments_select_authorized on public.claim_comments for select to authenticated using (app_private.can_select_claim(claim_id));
create policy claim_comments_insert_authorized on public.claim_comments for insert to authenticated with check (app_private.can_select_claim(claim_id) and (user_id is null or user_id = (select auth.uid())));
create policy claim_history_select_authorized on public.claim_history for select to authenticated using (app_private.can_select_claim(claim_id) or app_private.has_permission('audit.view'));

create policy publications_select_authorized on public.publications for select to authenticated using (app_private.can_select_claim(claim_id));
create policy publications_write_own_claim on public.publications for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy publication_authors_select_authorized on public.publication_authors for select to authenticated using (exists (select 1 from public.publications p where p.id = publication_id and app_private.can_select_claim(p.claim_id)));
create policy publication_authors_write_authorized on public.publication_authors for all to authenticated using (exists (select 1 from public.publications p where p.id = publication_id and app_private.can_select_claim(p.claim_id))) with check (exists (select 1 from public.publications p where p.id = publication_id and app_private.can_select_claim(p.claim_id)));

create policy books_select_authorized on public.books for select to authenticated using (app_private.can_select_claim(claim_id));
create policy books_write_authorized on public.books for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy book_chapters_select_authorized on public.book_chapters for select to authenticated using (app_private.can_select_claim(claim_id));
create policy book_chapters_write_authorized on public.book_chapters for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy patents_select_authorized on public.patents for select to authenticated using (app_private.can_select_claim(claim_id));
create policy patents_write_authorized on public.patents for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy citations_select_authorized on public.citations for select to authenticated using (app_private.can_select_claim(claim_id));
create policy citations_write_authorized on public.citations for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy research_projects_select_authorized on public.research_projects for select to authenticated using (app_private.can_select_claim(claim_id));
create policy research_projects_write_authorized on public.research_projects for all to authenticated using (app_private.can_select_claim(claim_id)) with check (app_private.can_select_claim(claim_id));
create policy project_members_select_authorized on public.project_members for select to authenticated using (exists (select 1 from public.research_projects rp where rp.id = project_id and app_private.can_select_claim(rp.claim_id)));
create policy project_members_write_authorized on public.project_members for all to authenticated using (exists (select 1 from public.research_projects rp where rp.id = project_id and app_private.can_select_claim(rp.claim_id))) with check (exists (select 1 from public.research_projects rp where rp.id = project_id and app_private.can_select_claim(rp.claim_id)));

create policy document_types_read_active on public.document_types for select to anon, authenticated using (is_active = true or app_private.has_permission('rule.manage'));
create policy document_types_manage on public.document_types for all to authenticated using (app_private.has_permission('rule.manage')) with check (app_private.has_permission('rule.manage'));
create policy claim_documents_select_authorized on public.claim_documents for select to authenticated using (app_private.can_select_claim(claim_id));
create policy claim_documents_insert_authorized on public.claim_documents for insert to authenticated with check (app_private.can_select_claim(claim_id) and (uploaded_by is null or uploaded_by = (select auth.uid())));
create policy claim_documents_update_verify on public.claim_documents for update to authenticated using (app_private.can_select_claim(claim_id) and (app_private.has_permission('document.verify') or uploaded_by = (select auth.uid()))) with check (app_private.can_select_claim(claim_id));
create policy document_verifications_select_authorized on public.document_verifications for select to authenticated using (exists (select 1 from public.claim_documents cd where cd.id = claim_document_id and app_private.can_select_claim(cd.claim_id)));
create policy document_verifications_insert_verify on public.document_verifications for insert to authenticated with check (app_private.has_permission('document.verify') and (verifier_id is null or verifier_id = (select auth.uid())));

create policy policy_versions_read_active on public.policy_versions for select to authenticated using (status = 'ACTIVE' or app_private.has_permission('rule.manage'));
create policy incentive_rules_read_active on public.incentive_rules for select to authenticated using (status = 'ACTIVE' or app_private.has_permission('rule.manage'));
create policy rule_criteria_read_active on public.rule_criteria for select to authenticated using (exists (select 1 from public.incentive_rules ir where ir.id = rule_id and (ir.status = 'ACTIVE' or app_private.has_permission('rule.manage'))));
create policy policy_versions_manage on public.policy_versions for all to authenticated using (app_private.has_permission('rule.manage')) with check (app_private.has_permission('rule.manage'));
create policy incentive_rules_manage on public.incentive_rules for all to authenticated using (app_private.has_permission('rule.manage')) with check (app_private.has_permission('rule.manage'));
create policy rule_criteria_manage on public.rule_criteria for all to authenticated using (app_private.has_permission('rule.manage')) with check (app_private.has_permission('rule.manage'));

create policy workflow_definitions_read on public.workflow_definitions for select to anon, authenticated using (is_active = true or app_private.has_permission('workflow.manage'));
create policy workflow_stages_read on public.workflow_stages for select to anon, authenticated using (true);
create policy workflow_stage_rules_read on public.workflow_stage_rules for select to authenticated using (is_active = true or app_private.has_permission('workflow.manage'));
create policy workflow_definitions_manage on public.workflow_definitions for all to authenticated using (app_private.has_permission('workflow.manage')) with check (app_private.has_permission('workflow.manage'));
create policy workflow_stages_manage on public.workflow_stages for all to authenticated using (app_private.has_permission('workflow.manage')) with check (app_private.has_permission('workflow.manage'));
create policy workflow_stage_rules_manage on public.workflow_stage_rules for all to authenticated using (app_private.has_permission('workflow.manage')) with check (app_private.has_permission('workflow.manage'));

create policy claim_approvals_select_authorized on public.claim_approvals for select to authenticated using (app_private.can_select_claim(claim_id) or approver_id = (select auth.uid()));
create policy claim_approvals_insert_authorized on public.claim_approvals for insert to authenticated with check (app_private.has_permission('claim.approve') and (approver_id is null or approver_id = (select auth.uid())));
create policy claim_approvals_update_authorized on public.claim_approvals for update to authenticated using (approver_id = (select auth.uid()) or app_private.has_permission('claim.approve')) with check (approver_id = (select auth.uid()) or app_private.has_permission('claim.approve'));
create policy approval_actions_select_authorized on public.approval_actions for select to authenticated using (app_private.can_select_claim(claim_id) or app_private.has_permission('audit.view'));
create policy approval_actions_insert_authorized on public.approval_actions for insert to authenticated with check ((actor_id is null or actor_id = (select auth.uid())) and app_private.can_select_claim(claim_id));

create policy notifications_select_own on public.notifications for select to authenticated using (user_id = (select auth.uid()) or app_private.has_permission('user.manage'));
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_insert_system on public.notifications for insert to authenticated with check (app_private.can_select_claim(claim_id) or app_private.has_permission('workflow.manage') or user_id = (select auth.uid()));
create policy notification_preferences_own on public.notification_preferences for all to authenticated using (user_id = (select auth.uid()) or app_private.has_permission('user.manage')) with check (user_id = (select auth.uid()) or app_private.has_permission('user.manage'));

create policy audit_logs_select_authorized on public.audit_logs for select to authenticated using (app_private.has_permission('audit.view') or user_id = (select auth.uid()));
create policy audit_logs_insert_authenticated on public.audit_logs for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));
create policy login_activity_select_authorized on public.login_activity for select to authenticated using (app_private.has_permission('audit.view') or user_id = (select auth.uid()));
create policy login_activity_insert_authenticated on public.login_activity for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));
create policy role_change_logs_select_authorized on public.role_change_logs for select to authenticated using (app_private.has_permission('audit.view') or target_user_id = (select auth.uid()));
create policy role_change_logs_insert_manage on public.role_change_logs for insert to authenticated with check (app_private.has_permission('role.manage'));

create policy system_settings_select_public_or_manage on public.system_settings for select to anon, authenticated using (is_public = true or app_private.has_permission('settings.manage'));
create policy system_settings_manage on public.system_settings for all to authenticated using (app_private.has_permission('settings.manage')) with check (app_private.has_permission('settings.manage'));

create policy claim_documents_storage_select on storage.objects for select to authenticated
using (
  bucket_id = 'claim-documents'
  and exists (
    select 1
    from public.claim_documents cd
    where cd.storage_path = storage.objects.name
      and app_private.can_select_claim(cd.claim_id)
  )
);

create policy claim_documents_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'claim-documents');

create policy claim_documents_storage_update on storage.objects for update to authenticated
using (bucket_id = 'claim-documents')
with check (bucket_id = 'claim-documents');

create policy claim_documents_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'claim-documents'
  and exists (
    select 1
    from public.claim_documents cd
    where cd.storage_path = storage.objects.name
      and cd.uploaded_by = (select auth.uid())
      and app_private.can_select_claim(cd.claim_id)
  )
);
