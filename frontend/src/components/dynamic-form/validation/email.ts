/**
 * Returns true when `value` trimmed is a non-empty plausible email (local@domain.tld).
 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed) || trimmed.includes("..")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
