import type { ApiEnvelope } from "./api.model";

// ——— Requests ———

/** POST /auth/login */
export interface LoginRequest {
  username: string;
  password: string;
}

/** `data` in POST /auth/login and POST /auth/refresh */
export interface AuthTokensData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export type LoginResponseEnvelope = ApiEnvelope<AuthTokensData>;

/** POST /auth/register */
export interface RegisterBusinessPayload {
  username: string;
  password: string;
  confirm_password: string;
  company_name: string;
  business_license_number: string;
  license_issued_date: string;
  license_issued_place: string;
  tax_code: string;
  phone: string;
  email: string;
  address: string;
}

export interface RegisterRepresentativePayload {
  full_name: string;
  identity_number: string;
  phone: string;
  email: string;
  address: string;
}

export interface RegisterRequestBody {
  business: RegisterBusinessPayload;
  representative: RegisterRepresentativePayload;
}

/** POST /auth/reset-password */
export interface ResetPasswordRequestBody {
  new_password: string;
  confirm_new_password: string;
  token: string;
}

export interface UserBusiness {
  address?: string | null;
  business_license_number?: string | null;
  company_name?: string | null;
  email?: string | null;
  license_issued_date?: string | null;
  license_issued_place?: string | null;
  phone?: string | null;
  tax_code?: string | null;
}

export interface UserRepresentative {
  address?: string | null;
  email?: string | null;
  full_name?: string | null;
  identity_number?: string | null;
  phone?: string | null;
}

export const UserRole = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserMode = {
  VNPC: "vnpc",
  INTERNAL: "internal",
} as const;

export type UserMode = (typeof UserMode)[keyof typeof UserMode];

export function parseUserRole(value: unknown): UserRole | null {
  if (value === UserRole.USER || value === UserRole.ADMIN) return value;
  if (typeof value === "string") {
    const n = value.toLowerCase();
    if (n === UserRole.USER) return UserRole.USER;
    if (n === UserRole.ADMIN) return UserRole.ADMIN;
  }
  return null;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  business?: UserBusiness | null;
  representative?: UserRepresentative | null;
  is_gs1_user?: boolean;
  mode: UserMode;
}

export function getUserPrimaryEmail(user: User): string {
  return user.business?.email ?? user.representative?.email ?? "";
}

export function getUserDisplayName(user: User): string {
  const name = user.representative?.full_name?.trim();
  if (name) return name;
  return user.username;
}

function isNullableUserNested(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "object" && value !== null);
}

export function isUserProfile(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.username !== "string") {
    return false;
  }
  if (parseUserRole(v.role) === null) return false;
  if (!isNullableUserNested(v.business)) return false;
  if (!isNullableUserNested(v.representative)) return false;
  return true;
}

export function coercePersistedUser(raw: unknown): User | null {
  if (raw == null) return null;
  if (!isUserProfile(raw)) return null;
  const v = raw as User;
  return { ...v, role: parseUserRole(v.role)! };
}
