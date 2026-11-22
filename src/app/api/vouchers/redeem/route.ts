import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  redeemVoucherCode,
  revalidatePhase4Paths,
} from "@/lib/data/phase4-store";
import {
  applyRateLimitHeaders,
  checkDualRateLimit,
  createRateLimitResponse,
  getVoucherRedeemRateLimitConfig,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSession();
  if (!auth.session) {
    return auth.response;
  }

  const rateLimit = checkDualRateLimit({
    namespace: "voucher-redeem",
    userId: auth.session.userId,
    request,
    ...getVoucherRedeemRateLimitConfig(),
  });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      `تم تجاوز الحد المسموح لمحاولات تفعيل الأكواد. حاول مجدداً بعد ${rateLimit.retryAfterSeconds} ثانية.`,
    );
  }

  try {
    const body = (await request.json()) as { code?: string };
    const code = String(body.code ?? "").trim();
    if (!code) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: "اكتب كود التفعيل أولاً." }, { status: 400 }),
        rateLimit,
      );
    }

    const result = await redeemVoucherCode(auth.session, code);
    revalidatePhase4Paths();
    return applyRateLimitHeaders(
      NextResponse.json(result, { status: 200 }),
      rateLimit,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "تعذر تفعيل الكود حالياً.";
    const status = message.includes("بالفعل") ? 409 : 400;
    return applyRateLimitHeaders(
      NextResponse.json({ error: message }, { status }),
      rateLimit,
    );
  }
}
