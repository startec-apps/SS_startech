/**
 * Spares Inventory Utility Functions
 */

/**
 * Formats a date string or Date object to the required format: '5-Feb-26'
 * (Day number without leading zero, 3-letter month capitalized, 2-digit year)
 */
export const formatDisplayDate = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return '-';
    return `${dateVal.getDate()}-${months[dateVal.getMonth()]}-${String(dateVal.getFullYear()).slice(-2)}`;
  }

  const str = String(dateVal).trim();
  if (!str) return '-';

  // 1. Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-02-05 or 2026-08-25)
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const monthIdx = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return `${day}-${months[monthIdx]}-${String(year).slice(-2)}`;
    }
  }

  // 2. Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return `${day}-${months[monthIdx]}-${String(year).slice(-2)}`;
    }
  }

  // 3. Match D-MMM-YY or DD-MMM-YYYY or D-MMM-YYYY (e.g., 5-Feb-26 or 05-Feb-2026)
  const dMmmYMatch = str.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$/);
  if (dMmmYMatch) {
    const day = parseInt(dMmmYMatch[1], 10);
    const mStr = dMmmYMatch[2].slice(0, 3).toLowerCase();
    const monthIdx = months.findIndex(m => m.toLowerCase() === mStr);
    const rawYear = dMmmYMatch[3];
    const shortYear = rawYear.length === 4 ? rawYear.slice(-2) : rawYear;
    if (monthIdx >= 0) {
      return `${day}-${months[monthIdx]}-${shortYear}`;
    }
  }

  // 4. Fallback parsing for standard ISO string or timestamp
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getDate()}-${months[parsed.getMonth()]}-${String(parsed.getFullYear()).slice(-2)}`;
  }

  return str;
};
