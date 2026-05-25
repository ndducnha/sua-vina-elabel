/** Auth / login UI constants — Sữa Vina internal system */

export const LOGIN_MODE = {
  /** Hàng hóa trong nước */
  DOMESTIC: "domestic",
  /** Hàng hóa xuất khẩu */
  EXPORT: "export",
  // Legacy aliases preserved so existing imports keep compiling.
  GTIN: "export",
  MANUAL: "domestic",
} as const;

export type LoginMode = (typeof LOGIN_MODE)[keyof typeof LOGIN_MODE];

/** Unused in the internal system but kept exported so legacy imports don't break. */
export const VNEID_REGISTRATION_URL = "#";
