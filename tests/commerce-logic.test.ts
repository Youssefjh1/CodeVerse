import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH as adminOrdersPatch } from "@/app/api/admin/orders/route";
import { POST as adminVouchersPost } from "@/app/api/admin/vouchers/route";
import { POST as redeemPost } from "@/app/api/vouchers/redeem/route";
import { POST as fawryWebhookPost } from "@/app/api/webhooks/fawry/route";
import { POST as paymobWebhookPost } from "@/app/api/webhooks/paymob/route";
import { getCurrentSession } from "@/lib/auth/session";
import {
  calculateVoucherDiscount,
  generateBatchVoucherCodes,
} from "@/lib/commerce/vouchers";
import { verifyFawryCallbackSignature } from "@/lib/payments/fawry";
import { verifyPaymobHmacSignature } from "@/lib/payments/paymob";

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: vi.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.PAYMOB_HMAC_SECRET;
  delete process.env.FAWRY_SECURITY_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Phase 4 vouchers, webhooks, and admin guards", () => {
  it("generates unique CODE-XXXX-XXXX batches and computes discounts accurately", () => {
    const batch = generateBatchVoucherCodes(12, "CODE");
    expect(batch).toHaveLength(12);
    expect(new Set(batch).size).toBe(12);
    for (const code of batch) {
      expect(code).toMatch(/^CODE-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }

    expect(
      calculateVoucherDiscount(250, {
        discountType: "percent",
        discountValue: 20,
      }),
    ).toEqual({ discountEgp: 50, totalEgp: 200 });

    expect(
      calculateVoucherDiscount(220, {
        discountType: "fixed_egp",
        discountValue: 60,
      }),
    ).toEqual({ discountEgp: 60, totalEgp: 160 });

    expect(
      calculateVoucherDiscount(290, {
        discountType: "full_unlock",
        discountValue: 0,
      }),
    ).toEqual({ discountEgp: 290, totalEgp: 0 });
  });

  it("verifies Paymob HMAC-SHA512 and Fawry SHA-256 webhook signatures", () => {
    const paymobSecret = "paymob-test-secret";
    const obj: Record<string, unknown> = {
      amount_cents: 24000,
      created_at: "2026-11-22T12:00:00",
      currency: "EGP",
      error_occured: false,
      has_parent_transaction: false,
      id: 98765,
      integration_id: 123,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 555 },
      owner: 77,
      pending: false,
      source_data: { pan: "1234", sub_type: "MasterCard", type: "card" },
      success: true,
    };

    const concat = [
      "24000",
      "2026-11-22T12:00:00",
      "EGP",
      "false",
      "false",
      "98765",
      "123",
      "true",
      "false",
      "false",
      "false",
      "true",
      "false",
      "555",
      "77",
      "false",
      "1234",
      "MasterCard",
      "card",
      "true",
    ].join("");
    const validHmac = createHmac("sha512", paymobSecret)
      .update(concat)
      .digest("hex");

    expect(verifyPaymobHmacSignature(obj, validHmac, paymobSecret)).toBe(true);
    expect(verifyPaymobHmacSignature(obj, "tampered", paymobSecret)).toBe(false);

    const fawryKey = "fawry-secret-key";
    const fawryPayload = {
      fawryRefNumber: "9910001",
      merchantRefNumber: "ORD-1041",
      paymentAmount: "220.00",
      orderAmount: "220.00",
      orderStatus: "PAID",
      paymentMethod: "PAYATFAWRY",
    };
    const sig = createHash("sha256")
      .update(
        fawryPayload.fawryRefNumber +
          fawryPayload.merchantRefNumber +
          fawryPayload.paymentAmount +
          fawryPayload.orderAmount +
          fawryPayload.orderStatus +
          fawryPayload.paymentMethod +
          fawryKey,
      )
      .digest("hex");

    expect(
      verifyFawryCallbackSignature(
        { ...fawryPayload, messageSignature: sig },
        fawryKey,
      ),
    ).toBe(true);
    expect(
      verifyFawryCallbackSignature(
        { ...fawryPayload, messageSignature: "bad" },
        fawryKey,
      ),
    ).toBe(false);
  });

  it("enforces admin role on voucher/order endpoints and processes voucher redemption + webhook stubs", async () => {
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "student-1",
      fullName: "طالب",
      email: "student@codeverse.eg",
      grade: "grade_10",
      role: "student",
      avatarFrame: "electric_violet",
    });

    const studentForbidden = await adminVouchersPost(
      new Request("http://localhost:3000/api/admin/vouchers", {
        method: "POST",
        body: JSON.stringify({ batchCount: 3 }),
      }),
    );
    expect(studentForbidden.status).toBe(403);

    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
    const unauthOrder = await adminOrdersPatch(
      new Request("http://localhost:3000/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId: 1, status: "shipped" }),
      }),
    );
    expect(unauthOrder.status).toBe(401);

    // Admin generates a batch of 2 codes, then student redeems one
    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "admin-1",
      fullName: "مشرف",
      email: "admin@codeverse.eg",
      grade: "grade_11",
      role: "admin",
      avatarFrame: "electric_violet",
    });

    const genRes = await adminVouchersPost(
      new Request("http://localhost:3000/api/admin/vouchers", {
        method: "POST",
        body: JSON.stringify({
          batchCount: 2,
          prefix: "CODE",
          discountType: "full_unlock",
          appliesTo: "package",
          targetId: 3,
          maxUses: 1,
        }),
      }),
    );
    expect(genRes.status).toBe(201);
    const genData = (await genRes.json()) as { vouchers: Array<{ code: string }> };
    expect(genData.vouchers).toHaveLength(2);
    const firstCode = genData.vouchers[0].code;

    vi.mocked(getCurrentSession).mockResolvedValueOnce({
      mode: "demo",
      userId: "student-redeem-test",
      fullName: "زياد",
      email: "zeyad@codeverse.eg",
      grade: "grade_11",
      role: "student",
      avatarFrame: "cyber_cyan",
    });

    const redeemRes = await redeemPost(
      new Request("http://localhost:3000/api/vouchers/redeem", {
        method: "POST",
        body: JSON.stringify({ code: firstCode }),
      }),
    );
    expect(redeemRes.status).toBe(200);
    const redeemData = (await redeemRes.json()) as {
      unlockedCourseIds: number[];
      unlockedProductIds: number[];
    };
    expect(redeemData.unlockedCourseIds).toContain(2);
    expect(redeemData.unlockedProductIds).toContain(2);

    // Webhook stub endpoints return 200 in stub mode
    const pmStub = await paymobWebhookPost(
      new Request("http://localhost:3000/api/webhooks/paymob", {
        method: "POST",
        body: JSON.stringify({ success: true, merchant_order_id: "ORD-1041" }),
      }),
    );
    expect(pmStub.status).toBe(200);

    const fawryStub = await fawryWebhookPost(
      new Request("http://localhost:3000/api/webhooks/fawry", {
        method: "POST",
        body: JSON.stringify({ orderStatus: "PAID", merchantRefNumber: "ORD-1041" }),
      }),
    );
    expect(fawryStub.status).toBe(200);
  });
});
