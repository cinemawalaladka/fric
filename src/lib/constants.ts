import { type UserRole } from '@/types';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Files,
  User,
  CheckSquare,
  RotateCcw,
  BarChart3,
  Users,
  GraduationCap,
  Shield,
  Lock,
  Eye,
  Tags,
  Calculator,
  FolderOpen,
  GitBranch,
  CalendarDays,
  ScrollText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// ============ Navigation ============

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export const FACULTY_NAV: SidebarNavItem[] = [
  { title: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
  { title: 'New Claim', href: '/faculty/new-claim', icon: FilePlus },
  { title: 'My Claims', href: '/faculty/claims', icon: FileText },
  { title: 'Drafts', href: '/faculty/drafts', icon: Files },
  { title: 'Documents', href: '/faculty/documents', icon: FolderOpen },
  { title: 'Profile', href: '/faculty/profile', icon: User },
];

export const VERIFIER_NAV: SidebarNavItem[] = [
  { title: 'Dashboard', href: '/verifier/dashboard', icon: LayoutDashboard },
  { title: 'Pending Claims', href: '/verifier/claims', icon: FileText },
  { title: 'Verified Claims', href: '/verifier/verified', icon: CheckSquare },
  { title: 'Returned Claims', href: '/verifier/returned', icon: RotateCcw },
  { title: 'Documents', href: '/verifier/documents', icon: FolderOpen },
  { title: 'Reports', href: '/verifier/reports', icon: BarChart3 },
];

export const ADMIN_NAV: SidebarNavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Faculty', href: '/admin/faculty', icon: GraduationCap },
  { title: 'Roles', href: '/admin/roles', icon: Shield },
  { title: 'Permissions', href: '/admin/permissions', icon: Lock },
  { title: 'Claims', href: '/admin/claims', icon: Eye },
  { title: 'Claim Types', href: '/admin/claim-types', icon: Tags },
  { title: 'Incentive Rules', href: '/admin/incentive-rules', icon: Calculator },
  { title: 'Documents', href: '/admin/documents', icon: FolderOpen },
  { title: 'Workflow', href: '/admin/workflow', icon: GitBranch },
  { title: 'Academic Years', href: '/admin/academic-years', icon: CalendarDays },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

// ============ Claim Statuses ============

export const CLAIM_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-400/10' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  UNDER_VERIFICATION: { label: 'Under Verification', color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  RETURNED: { label: 'Returned', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  RESUBMITTED: { label: 'Resubmitted', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  APPROVED: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-400/10' },
};

// ============ Multi-Stage Workflow Config ============

export interface WorkflowStageConfig {
  order: number;
  code: string;
  title: string;
  roleLabel: string;
  shortName: string;
  description: string;
}

export const WORKFLOW_STAGES: Record<string, WorkflowStageConfig> = {
  FACULTY: {
    order: 0,
    code: 'FACULTY',
    title: 'Claim Submitted',
    roleLabel: 'Faculty Member',
    shortName: 'Faculty',
    description: 'Claim prepared and submitted by faculty',
  },
  HOD_PRINCIPAL: {
    order: 1,
    code: 'HOD_PRINCIPAL',
    title: 'Department HOD Review',
    roleLabel: 'Head of Department',
    shortName: 'HOD',
    description: 'First level verification by the submitter department HOD',
  },
  COMMITTEE_M1: {
    order: 2,
    code: 'COMMITTEE_M1',
    title: 'Research Committee Member 1',
    roleLabel: 'Research Committee Member 1',
    shortName: 'M1',
    description: 'First research committee verification stage',
  },
  COMMITTEE_M2: {
    order: 3,
    code: 'COMMITTEE_M2',
    title: 'Research Committee Member 2',
    roleLabel: 'Research Committee Member 2',
    shortName: 'M2',
    description: 'Second research committee verification stage',
  },
  GOVERNOR: {
    order: 4,
    code: 'GOVERNOR',
    title: 'Governor Review',
    roleLabel: 'Governor',
    shortName: 'Governor',
    description: 'Governor review before final institutional sanction',
  },
  PROVOST: {
    order: 5,
    code: 'PROVOST',
    title: 'Provost Final Sanction',
    roleLabel: 'Provost',
    shortName: 'Provost',
    description: 'Final sanction by Provost with controlled amount modification',
  },
  APPROVED: {
    order: 6,
    code: 'APPROVED',
    title: 'Approved & Sanctioned',
    roleLabel: 'Incentive Approved',
    shortName: 'Fully Approved',
    description: 'Claim fully sanctioned. Incentive payout approved!',
  },
};

export const STAGE_SEQUENCE = [
  'HOD_PRINCIPAL',
  'COMMITTEE_M1',
  'COMMITTEE_M2',
  'GOVERNOR',
  'PROVOST',
  'APPROVED',
];

export function getInitialWorkflowStage(
  claimantRoles: string[] = [],
  claimantDesignation: string = ""
): string {
  const desig = (claimantDesignation || "").toUpperCase();
  const roles = claimantRoles.map((r) => r.toUpperCase());

  if (roles.includes("PROVOST") || desig.includes("PROVOST")) {
    return "PROVOST";
  }
  if (roles.includes("GOVERNOR") || desig.includes("GOVERNOR")) {
    return "PROVOST"; // Governor's research starts at Provost
  }
  if (desig.includes("COMMITTEE_M2") || desig.includes("M2")) {
    return "GOVERNOR"; // Member 2's research starts at Governor
  }
  if (
    roles.includes("RESEARCH_COMMITTEE_MEMBER") ||
    desig.includes("COMMITTEE_M1") ||
    desig.includes("M1")
  ) {
    return "COMMITTEE_M2"; // Member 1's research starts at Member 2
  }
  if (roles.includes("HOD") || desig.includes("HOD") || desig.includes("HEAD")) {
    return "COMMITTEE_M1"; // HOD's research starts at Member 1
  }

  // Normal Faculty starts at HOD
  return "HOD_PRINCIPAL";
}

export function getNextStage(
  currentStage: string,
  claimantRoles: string[] = [],
  claimantDesignation: string = ""
): string {
  const desig = (claimantDesignation || "").toUpperCase();
  const roles = claimantRoles.map((r) => r.toUpperCase());

  switch (currentStage) {
    case "FACULTY":
    case "SUBMITTED":
      return getInitialWorkflowStage(roles, desig);

    case "HOD_PRINCIPAL": {
      // Next is Committee M1. If claimant is M1, skip to M2!
      if (
        roles.includes("RESEARCH_COMMITTEE_MEMBER") ||
        desig.includes("COMMITTEE_M1") ||
        desig.includes("M1")
      ) {
        return "COMMITTEE_M2";
      }
      return "COMMITTEE_M1";
    }

    case "COMMITTEE_M1": {
      // Next is Committee M2. If claimant is M2, skip to Governor!
      if (desig.includes("COMMITTEE_M2") || desig.includes("M2")) {
        return "GOVERNOR";
      }
      return "COMMITTEE_M2";
    }

    case "COMMITTEE_M2": {
      // Next is Governor. If claimant is Governor, skip to Provost!
      if (roles.includes("GOVERNOR") || desig.includes("GOVERNOR")) {
        return "PROVOST";
      }
      return "GOVERNOR";
    }

    case "GOVERNOR":
      // Next is Provost Final Sanction
      return "PROVOST";

    case "PROVOST":
      // Final Sanction
      return "APPROVED";

    default:
      return "APPROVED";
  }
}

// ============ Verifier Stage Designation Options ============

export interface VerifierStageOption {
  code: string;
  shortName: string;
  title: string;
  description: string;
}

export const VERIFIER_STAGE_OPTIONS: VerifierStageOption[] = [
  {
    code: "HOD_PRINCIPAL",
    shortName: "Principal / HOD",
    title: "Stage 1: Department HOD Review",
    description: "First level verification by the submitter department HOD",
  },
  {
    code: "COMMITTEE_M1",
    shortName: "Committee M1",
    title: "Stage 2: Research Committee Member 1",
    description: "Academic merit and document verification by Committee Member 1",
  },
  {
    code: "COMMITTEE_M2",
    shortName: "Committee M2",
    title: "Stage 3: Research Committee Member 2",
    description: "Second committee verification before Governor review",
  },
  {
    code: "GOVERNOR",
    shortName: "Governor",
    title: "Stage 4: Governor Review",
    description: "Governor review before Provost sanction",
  },
  {
    code: "PROVOST",
    shortName: "Provost",
    title: "Stage 5: Provost Final Sanction",
    description: "Final sanction and incentive payout approval by Provost",
  },
  {
    code: "ALL",
    shortName: "Global Verifier",
    title: "All Stages (Global Verifier)",
    description: "Full verification access across all workflow stages",
  },
];

export function getVerifierStageInfo(
  designation?: string | null,
  roles: string[] = []
): VerifierStageOption {
  const cleanDesig = (designation || "").toUpperCase();
  const normalizedRoles = roles.map((r) => r.toUpperCase());

  if (normalizedRoles.includes("SUPER_ADMIN") || cleanDesig.includes("ALL") || cleanDesig.includes("GLOBAL")) {
    return VERIFIER_STAGE_OPTIONS[5]; // ALL
  }
  if (normalizedRoles.includes("PROVOST") || cleanDesig.includes("PROVOST")) {
    return VERIFIER_STAGE_OPTIONS[4]; // PROVOST
  }
  if (normalizedRoles.includes("GOVERNOR") || cleanDesig.includes("GOVERNOR")) {
    return VERIFIER_STAGE_OPTIONS[3]; // GOVERNOR
  }
  if (cleanDesig.includes("COMMITTEE_M2") || cleanDesig.includes("M2") || cleanDesig.includes("MEMBER 2")) {
    return VERIFIER_STAGE_OPTIONS[2]; // COMMITTEE_M2
  }
  if (
    normalizedRoles.includes("RESEARCH_COMMITTEE_MEMBER") ||
    cleanDesig.includes("COMMITTEE_M1") ||
    cleanDesig.includes("M1") ||
    cleanDesig.includes("MEMBER 1")
  ) {
    return VERIFIER_STAGE_OPTIONS[1]; // COMMITTEE_M1
  }
  if (normalizedRoles.includes("HOD") || cleanDesig.includes("HOD") || cleanDesig.includes("HEAD")) {
    return VERIFIER_STAGE_OPTIONS[0]; // HOD_PRINCIPAL
  }

  return {
    code: "NONE",
    shortName: "Faculty",
    title: "Faculty Member",
    description: "No verifier permissions assigned",
  };
}


// ============ Claim Types ============

export const CLAIM_TYPE_ICONS: Record<string, string> = {
  JOURNAL_PUBLICATION: '📄',
  BOOK: '📚',
  PATENT: '⚙️',
  CITATION: '📊',
  RESEARCH_PROJECT: '🔬',
};

// ============ Role Labels ============

export const ROLE_LABELS: Record<UserRole, string> = {
  FACULTY: 'Faculty',
  HOD: 'HOD',
  RESEARCH_COMMITTEE_MEMBER: 'Research Committee Member',
  GOVERNOR: 'Governor',
  PROVOST: 'Provost',
  RESEARCH_VERIFIER: 'Research Verifier',
  SUPER_ADMIN: 'Super Admin',
};

// ============ File Validation ============

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

// ============ Pagination ============

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ============ Indexing Options ============

export const INDEXING_OPTIONS = [
  'Scopus',
  'Web of Science',
  'PubMed',
  'DOAJ',
  'UGC CARE',
  'IEEE Xplore',
  'Google Scholar',
  'Other',
];

export const QUARTILE_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4'];

export const ABDC_CATEGORIES = ['A*', 'A', 'B', 'C'];

export const PATENT_OFFICES = [
  'Indian Patent Office',
  'USPTO',
  'EPO',
  'WIPO',
  'Other',
];
