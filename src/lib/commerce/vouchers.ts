import type { VoucherRecord } from "@/types/commerce";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomIndex(max: number): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buf = new Uint32Array(1);
    do {
      globalThis.crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export const EGYPT_GOVERNORATES: readonly string[] = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "القليوبية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "مطروح",
] as const;

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomIndex(CODE_ALPHABET.length)];
  }
  return out;
}

export function generateBatchVoucherCodes(
  count: number,
  prefix = "CODE",
): string[] {
  const safeCount = Math.min(50, Math.max(1, Math.round(count)));
  const cleanPrefix =
    prefix
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6) || "CODE";

  const generated = new Set<string>();
  let guard = 0;
  while (generated.size < safeCount && guard < safeCount * 20) {
    guard += 1;
    generated.add(`${cleanPrefix}-${randomSegment(4)}-${randomSegment(4)}`);
  }

  return Array.from(generated);
}

export function normalizeVoucherCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function calculateVoucherDiscount(
  subtotalEgp: number,
  voucher: Pick<VoucherRecord, "discountType" | "discountValue">,
): { discountEgp: number; totalEgp: number } {
  const safeSubtotal = Math.max(0, Number(subtotalEgp.toFixed(2)));
  if (voucher.discountType === "full_unlock") {
    return { discountEgp: safeSubtotal, totalEgp: 0 };
  }
  if (voucher.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, voucher.discountValue));
    const discountEgp = Number(((safeSubtotal * pct) / 100).toFixed(2));
    return {
      discountEgp,
      totalEgp: Math.max(0, Number((safeSubtotal - discountEgp).toFixed(2))),
    };
  }
  const fixed = Math.min(safeSubtotal, Math.max(0, voucher.discountValue));
  const discountEgp = Number(fixed.toFixed(2));
  return {
    discountEgp,
    totalEgp: Math.max(0, Number((safeSubtotal - discountEgp).toFixed(2))),
  };
}
