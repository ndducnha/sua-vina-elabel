/** `yyyy-MM-dd` for the given date in local time (e.g. `input[type=date].max`). */
export function getLocalIsoDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** True if `dd/MM/yyyy` parses to a calendar date strictly after local today. */
export function isDdMmYyyyAfterToday(value: string): boolean {
  const trimmed = value.trim();
  if (!isValidDdMmYyyy(trimmed)) return false;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)!;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const candidate = new Date(year, month - 1, day);
  candidate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return candidate > today;
}

/** Validate `dd/MM/yyyy` and reject dates that don't exist on the calendar. */
export function isValidDdMmYyyy(value: string): boolean {
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Validate `yyyy-MM-dd` as produced by `input[type=date]`. */
export function isValidIsoDateString(value: string): boolean {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Map ISO date string to `dd/MM/yyyy` for text fields / APIs expecting that format. */
export function isoDateToDdMmYyyy(iso: string): string {
  const trimmed = iso.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return trimmed;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function isExpiryDate(header: string): boolean {
  return (
    header === "Hạn sử dụng" ||
    header.includes("Expiry Date") ||
    header.includes("Expiration Date") ||
    header.includes("Use-by date")
  );
}

/** `dd/MM/yyyy` → `yyyy-MM-dd` for `input[type=date].value`. */
export function ddMmYyyyToIso(value: string): string {
  const trimmed = value.trim();
  if (!isValidDdMmYyyy(trimmed)) return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)!;
  return `${match[3]}-${match[2]}-${match[1]}`;
}
