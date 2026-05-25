/** Strip spaces, dots, hyphens, parentheses. */
function stripSeparators(input: string): string {
  return input.replace(/[\s.\-()]/g, "");
}

/** National subscriber number without separators: exactly 10 digits starting with 0. */
const VN_PHONE_NATIONAL = /^0\d{9}$/;

/**
 * Normalizes Vietnam-style input toward national form `0xxxxxxxxx` (no further validation).
 */
export function normalizeVietnamPhone(input: string): string {
  let digits = stripSeparators(input.trim());
  if (!digits) return digits;
  if (digits.startsWith("+84")) digits = digits.slice(3);
  else if (digits.startsWith("84") && digits.length >= 10) digits = digits.slice(2);
  if (/^[3-9]\d{8}$/.test(digits)) digits = `0${digits}`;
  return digits;
}

/**
 * Vietnamese mobile/landline (10 digits): accepts `0xxx xxx xxx` or `+84xxx xxx xxx`
 * with optional spaces, dots, hyphens, parentheses. Use {@link normalizeVietnamPhone} before submit.
 */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const compact = stripSeparators(trimmed);
  if (!/^\+?\d+$/.test(compact)) return false;
  return VN_PHONE_NATIONAL.test(normalizeVietnamPhone(trimmed));
}
