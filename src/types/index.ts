// Types for the FRIC Portal

// ============ Enums ============

export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'RETURNED'
  | 'RESUBMITTED'
  | 'REJECTED'
  | 'APPROVED';

export type UserRole =
  | 'FACULTY'
  | 'HOD'
  | 'RESEARCH_COMMITTEE_MEMBER'
  | 'GOVERNOR'
  | 'PROVOST'
  | 'RESEARCH_VERIFIER'
  | 'SUPER_ADMIN';

export type VerificationStage =
  | 'FACULTY'
  | 'HOD_PRINCIPAL'
  | 'COMMITTEE_M1'
  | 'COMMITTEE_M2'
  | 'GOVERNOR'
  | 'PROVOST'
  | 'APPROVED';


export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type FacultyStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'RESUBMIT'
  | 'VERIFY'
  | 'RETURN'
  | 'APPROVE'
  | 'REJECT'
  | 'ROLE_CHANGE'
  | 'LOGIN'
  | 'LOGOUT';

// ============ Database Types ============

export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Faculty {
  id: string;
  auth_user_id: string;
  employee_id: string;
  name: string;
  email: string;
  department_id: string;
  designation: string;
  status: FacultyStatus;
  created_at: string;
  updated_at: string;
  // Joined
  department?: Department;
}

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  created_at: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface UserRoleAssignment {
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  status: 'ACTIVE' | 'INACTIVE';
  // Joined
  role?: Role;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ClaimType {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Claim {
  id: string;
  claim_number: string;
  faculty_id: string;
  claim_type_id: string;
  academic_year_id: string;
  status: ClaimStatus;
  current_stage: string;
  claimed_amount: number | null;
  calculated_amount: number | null;
  approved_amount: number | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  faculty?: Faculty;
  claim_type?: ClaimType;
  academic_year?: AcademicYear;
  publications?: Publication[];
  books?: Book[];
  patents?: Patent[];
  citations?: Citation[];
  research_projects?: ResearchProject[];
  claim_documents?: ClaimDocument[];
  claim_approvals?: ClaimApproval[];
  claim_comments?: ClaimComment[];
}

export interface Publication {
  id: string;
  claim_id: string;
  title: string;
  journal_name: string;
  issn: string | null;
  publication_date: string | null;
  indexing: string | null;
  quartile: string | null;
  impact_factor: number | null;
  acceptance_rate: number | null;
  abdc_category: string | null;
  doi: string | null;
  created_at: string;
  // Joined
  authors?: PublicationAuthor[];
}

export interface PublicationAuthor {
  id: string;
  publication_id: string;
  faculty_id: string | null;
  author_name: string;
  author_order: number;
  author_number?: number;
  is_first_author: boolean;
  is_corresponding_author: boolean;
  is_ppsu_faculty: boolean;
  affiliation?: string;
  institution?: string;
}

export interface Book {
  id: string;
  claim_id: string;
  title: string;
  work_title?: string | null;
  publisher: string;
  isbn: string | null;
  publication_date: string | null;
  book_type: 'AUTHORED' | 'EDITED' | 'CHAPTER';
  chapter_title: string | null;
  scopus_indexed: boolean;
  recognized_body?: string | null;
  other_recognized_body?: string | null;
  web_link?: string | null;
  doi?: string | null;
  publication_level?: string | null;
  created_at: string;
}

export interface BookChapter {
  id: string;
  claim_id: string;
  book_id?: string | null;
  chapter_title: string;
  book_title?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  publication_date?: string | null;
  chapter_pages?: string | null;
  doi?: string | null;
  web_link?: string | null;
  publication_level?: string | null;
  recognized_body?: string | null;
  other_recognized_body?: string | null;
  created_at: string;
}

export interface Patent {
  id: string;
  claim_id: string;
  title: string;
  patent_number: string | null;
  filing_date: string | null;
  grant_date: string | null;
  publication_date?: string | null;
  patent_office: string;
  patent_type: string;
  patent_status?: 'PUBLISHED' | 'GRANTED' | 'Published' | 'Granted' | 'FILED' | 'Filed' | null;
  country?: string | null;
  publication_level?: string | null;
  inventors: string;
  created_at: string;
}

export interface Citation {
  id: string;
  claim_id: string;
  source_title: string;
  cited_by_title?: string | null;
  journal_name?: string | null;
  citation_database: string;
  citation_count: number;
  h_index?: number | null;
  i10_index?: number | null;
  verification_url?: string | null;
  doi?: string | null;
  issn?: string | null;
  publication_year?: number | null;
  scopus_id?: string | null;
  total_citations_last_calendar_year?: number | null;
  total_ppsu_citations_last_calendar_year?: number | null;
  created_at: string;
}

export interface ResearchProject {
  id: string;
  claim_id: string;
  title: string;
  funding_agency: string;
  sponsoring_body?: string | null;
  project_level?: string | null;
  sanctioned_amount: number;
  project_start_date: string | null;
  project_end_date: string | null;
  project_status: 'ONGOING' | 'COMPLETED';
  grant_number: string | null;
  pi_copi_status?: string | null;
  copi_number?: number | null;
  address?: string | null;
  amount_in_words?: string | null;
  amount_deposited_in_ppsu?: number | null;
  deposit_date?: string | null;
  deposit_proof_url?: string | null;
  created_at: string;
  // Joined
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  faculty_id: string | null;
  member_name: string;
  role: string;
  is_pi: boolean;
}

export interface ClaimDocument {
  id: string;
  claim_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  verification_status: DocumentVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface ClaimApproval {
  id: string;
  claim_id: string;
  stage: string;
  approver_id: string;
  status: 'PENDING' | 'VERIFIED' | 'RETURNED' | 'APPROVED' | 'REJECTED';
  remarks: string | null;
  approved_amount: number | null;
  action_at: string | null;
  created_at: string;
  // Joined
  approver?: Faculty;
}

export interface ClaimComment {
  id: string;
  claim_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface IncentiveRule {
  id: string;
  claim_type_id: string;
  category: string;
  amount: number;
  active_from: string;
  active_until: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  // Joined
  claim_type?: ClaimType;
  criteria?: RuleCriteria[];
}

export interface RuleCriteria {
  id: string;
  rule_id: string;
  criterion: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_EQUAL' | 'LESS_EQUAL' | 'IN' | 'NOT_IN' | 'BETWEEN';
  value: string;
}

export interface RequiredDocument {
  id: string;
  claim_type_id: string;
  document_type: string;
  description: string;
  is_mandatory: boolean;
  max_file_size_mb: number;
  allowed_extensions: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'CLAIM_SUBMITTED' | 'CLAIM_VERIFIED' | 'CLAIM_RETURNED' | 'CLAIM_APPROVED' | 'SYSTEM' | 'INFO';
  is_read: boolean;
  claim_id: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Undertaking {
  id: string;
  claim_id: string;
  faculty_id: string;
  content: string;
  accepted_at: string | null;
  created_at: string;
}

// ============ UI / App Types ============

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface ClaimFormStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  category: string | null;
  estimatedAmount: number | null;
  matchedRule: IncentiveRule | null;
  reasons: string[];
}
