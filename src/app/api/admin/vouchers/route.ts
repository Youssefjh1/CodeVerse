import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  generateAdminVoucherBatch,
  getAdminCommerceData,
  revalidatePhase4Paths,
  toggleVoucherActive,
} from "@/lib/data/phase4-store";
import type { VoucherAppliesTo, VoucherDiscountType } from "@/types/commerce";

const VALID_DISCOUNT_TYPES = new Set<VoucherDiscountType>([
  "percent",
  "fixed_egp",
  "full_unlock",
]);
const VALID_APPLIES_TO = new Set<VoucherAppliesTo>([
  "all",
  "course",
  "product",
  "package",
]);

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }

  const data = await getAdminCommerceData(auth.session);
  return NextResponse.json({ vouchers: data.vouchers });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const batchCount = Math.min(50, Math.max(1, Math.round(Number(body.batchCount) || 5)));
    const prefix = typeof body.prefix === "string" ? body.prefix : "CODE";
    const rawType = String(body.discountType ?? "full_unlock") as VoucherDiscountType;
    const discountType = VALID_DISCOUNT_TYPES.has(rawType) ? rawType : "full_unlock";
    const discountValue = Math.max(0, Number(body.discountValue) || 0);
    const rawApplies = String(body.appliesTo ?? "package") as VoucherAppliesTo;
    const appliesTo = VALID_APPLIES_TO.has(rawApplies) ? rawApplies : "package";
    const targetId = body.targetId ? Number(body.targetId) : null;
    const maxUses = Math.max(1, Math.round(Number(body.maxUses) || 1));
    const expiresAt =
      typeof body.expiresAt === "string" && body.expiresAt.trim()
        ? body.expiresAt.trim()
        : null;
    const channelNoteAr =
      String(body.channelNoteAr ?? "").trim() || "إنستاباي / فودافون كاش";

    const vouchers = await generateAdminVoucherBatch(session, {
      batchCount,
      prefix,
      discountType,
      discountValue,
      appliesTo,
      targetId,
      maxUses,
      expiresAt,
      channelNoteAr,
    });

    revalidatePhase4Paths();
    return NextResponse.json({ vouchers }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "تعذر توليد دفعة الأكواد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as {
      voucherId?: number;
      isActive?: boolean;
    };
    const voucherId = Number(body.voucherId);
    if (!Number.isInteger(voucherId) || voucherId <= 0) {
      return NextResponse.json({ error: "معرف الكود غير صالح." }, { status: 400 });
    }

    const updated = await toggleVoucherActive(
      session,
      voucherId,
      Boolean(body.isActive),
    );
    if (!updated) {
      return NextResponse.json({ error: "الكود غير موجود." }, { status: 404 });
    }
    revalidatePhase4Paths();
    return NextResponse.json({ voucher: updated });
  } catch {
    return NextResponse.json({ error: "تعذر تحديث حالة الكود." }, { status: 400 });
  }
}
