-- Hardening pass after Supabase advisors.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create index if not exists departments_school_id_idx on public.departments(school_id);
create index if not exists departments_hod_user_id_idx on public.departments(hod_user_id);
create index if not exists research_committees_academic_year_id_idx on public.research_committees(academic_year_id);
create index if not exists committee_members_user_id_idx on public.committee_members(user_id);
create index if not exists claims_claim_type_id_idx on public.claims(claim_type_id);
create index if not exists claims_academic_year_id_idx on public.claims(academic_year_id);
create index if not exists claim_comments_claim_id_idx on public.claim_comments(claim_id);
create index if not exists claim_comments_user_id_idx on public.claim_comments(user_id);
create index if not exists claim_history_claim_id_idx on public.claim_history(claim_id);
create index if not exists claim_history_changed_by_idx on public.claim_history(changed_by);
create index if not exists publication_authors_faculty_id_idx on public.publication_authors(faculty_id);
create index if not exists book_chapters_book_id_idx on public.book_chapters(book_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_faculty_id_idx on public.project_members(faculty_id);
create index if not exists claim_documents_document_type_id_idx on public.claim_documents(document_type_id);
create index if not exists claim_documents_uploaded_by_idx on public.claim_documents(uploaded_by);
create index if not exists claim_documents_verified_by_idx on public.claim_documents(verified_by);
create index if not exists document_verifications_claim_document_id_idx on public.document_verifications(claim_document_id);
create index if not exists document_verifications_verifier_id_idx on public.document_verifications(verifier_id);
create index if not exists incentive_rules_policy_version_id_idx on public.incentive_rules(policy_version_id);
create index if not exists incentive_rules_claim_type_id_idx on public.incentive_rules(claim_type_id);
create index if not exists rule_criteria_rule_id_idx on public.rule_criteria(rule_id);
create index if not exists workflow_stage_rules_workflow_definition_id_idx on public.workflow_stage_rules(workflow_definition_id);
create index if not exists workflow_stage_rules_claim_type_id_idx on public.workflow_stage_rules(claim_type_id);
create index if not exists claim_approvals_workflow_stage_id_idx on public.claim_approvals(workflow_stage_id);
create index if not exists approval_actions_claim_approval_id_idx on public.approval_actions(claim_approval_id);
create index if not exists approval_actions_claim_id_idx on public.approval_actions(claim_id);
create index if not exists approval_actions_actor_id_idx on public.approval_actions(actor_id);
create index if not exists notifications_claim_id_idx on public.notifications(claim_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);
create index if not exists login_activity_user_id_idx on public.login_activity(user_id);
create index if not exists role_change_logs_role_id_idx on public.role_change_logs(role_id);
create index if not exists role_change_logs_changed_by_idx on public.role_change_logs(changed_by);
