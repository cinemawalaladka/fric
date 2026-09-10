// ================================================================
// FRIC — Indian Numbering System Formatter, Parser & Words Converter
// ================================================================

/**
 * Format a number or numeric string to Indian numbering system with commas.
 * e.g., 1000 -> "1,000"
 * 100000 -> "1,00,000"
 * 1500000 -> "15,00,000"
 * 10000000 -> "1,00,00,000"
 */
export function formatIndianNumber(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";

  const str = String(value).trim();
  const parts = str.split(".");
  const intPart = parts[0].replace(/[^0-9]/g, "");
  const decPart = parts.length > 1 ? "." + parts[1].replace(/[^0-9]/g, "").slice(0, 2) : "";

  if (!intPart) return decPart ? "0" + decPart : "";

  if (intPart.length <= 3) {
    return intPart + decPart;
  }

  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${formattedOthers},${lastThree}${decPart}`;
}

/**
 * Parses an Indian-formatted number string back to a clean numeric value.
 */
export function parseIndianNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const clean = String(value).replace(/[^0-9.]/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert numeric amount to words in Indian numbering system (Lakhs, Crores)
 * e.g., 1500000 -> "Fifteen Lakh Rupees Only"
 */
export function numberToIndianWords(numInput: number | string | undefined | null): string {
  const num = parseIndianNumber(numInput);
  if (!num || num <= 0) return "";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertChunk(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;
  const hundredAndBelow = Math.floor(remainder);

  let result = "";
  if (crore > 0) {
    result += convertChunk(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertChunk(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertChunk(thousand) + " Thousand ";
  }
  if (hundredAndBelow > 0) {
    result += convertChunk(hundredAndBelow) + " ";
  }

  return result.trim() ? `${result.trim()} Rupees Only` : "";
}
