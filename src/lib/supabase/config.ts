export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDemoModeEnabled(): boolean {
  const explicitAllow = process.env.ALLOW_DEMO_MODE === "true";
  if (isProductionEnvironment()) {
    return explicitAllow;
  }
  if (!isSupabaseConfigured()) {
    return true;
  }
  return explicitAllow;
}

export const SEEDED_TEST_VOUCHER_CODES: ReadonlySet<string> = new Set([
  "CODEVERSE20",
  "CODE-TERM-2026",
  "CODE-ALGO-1100",
]);

export function areSeededTestVouchersEnabled(): boolean {
  return isDemoModeEnabled();
}

export function isBlockedTestVoucherCode(normalizedCode: string): boolean {
  return (
    SEEDED_TEST_VOUCHER_CODES.has(normalizedCode) &&
    !areSeededTestVouchersEnabled()
  );
}
