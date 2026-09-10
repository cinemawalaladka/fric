import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Universal helper to extract the main detail item from a claim
 * Safely handles both array and single-object formats from Supabase PostgREST.
 */
export function resolveDetailItem(claim: any): any {
  if (!claim) return null;
  const getFirst = (arrOrObj: any) => {
    if (!arrOrObj) return null;
    if (Array.isArray(arrOrObj)) return arrOrObj[0] || null;
    if (typeof arrOrObj === "object" && Object.keys(arrOrObj).length > 0) return arrOrObj;
    return null;
  };

  return (
    getFirst(claim.publications) ||
    getFirst(claim.books) ||
    getFirst(claim.patents) ||
    getFirst(claim.citations) ||
    getFirst(claim.research_projects) ||
    null
  );
}

/**
 * Universal helper to extract the display title of a research claim
 */
export function resolveClaimTitle(claim: any): string {
  if (!claim) return "Untitled Research Claim";
  const item = resolveDetailItem(claim);
  if (item) {
    if (item.title) return item.title;
    if (item.chapter_title) return item.chapter_title;
    if (item.source_title) return item.source_title;
    if (item.journal_name) return item.journal_name;
  }
  return claim.title || claim.work_title || claim.paper_title || claim.claim_number || "Untitled Research Claim";
}

/**
 * Format ISO date string into Indian Standard format with exact time (e.g. 17 Aug 2026, 01:25 PM IST)
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(d) + " IST";
  } catch {
    return iso || "N/A";
  }
}

/**
 * Format ISO date string into readable Date format (e.g. 17 Aug 2026)
 */
export function formatDateOnly(iso?: string | null): string {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return iso || "N/A";
  }
}

/**
 * Convert numeric Indian currency into formal words (e.g. 25000 -> Rupees Twenty Five Thousand Only)
 */
export function numberToWordsInr(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return "Rupees Zero Only";
  }

  const num = Math.floor(Math.abs(amount));

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? " " + units[unit] : ""}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    let res = "";
    if (hundred > 0) {
      res += `${units[hundred]} Hundred`;
    }
    if (rem > 0) {
      res += `${res ? " " : ""}${convertTwoDigits(rem)}`;
    }
    return res;
  }

  // Indian Numbering System: Crores, Lakhs, Thousands, Hundreds
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const rest = rem;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }
  if (rest > 0) {
    parts.push(convertThreeDigits(rest));
  }

  return `Rupees ${parts.join(" ")} Only`;
}

