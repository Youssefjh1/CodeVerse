import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { lookupCheckoutItem } from "@/lib/data/phase4-store";
import { createFawryReferenceCharge } from "@/lib/payments/fawry";
import { createPaymobCheckoutSession } from "@/lib/payments/paymob";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as {
      itemType?: "package" | "course" | "product";
      targetId?: number;
      provider?: "paymob" | "fawry";
    };

    const itemType = body.itemType ?? "package";
    const targetId = Number(body.targetId);
    const provider = body.provider === "fawry" ? "fawry" : "paymob";

    const item = lookupCheckoutItem(itemType, targetId);
    if (!item) {
      return NextResponse.json(
        { error: "العنصر المختار غير متاح للدفع." },
        { status: 404 },
      );
    }

    const orderCode = `CV-${itemType.slice(0, 3).toUpperCase()}-${targetId}-${Date.now().toString().slice(-4)}`;

    if (provider === "fawry") {
      const fawry = createFawryReferenceCharge({
        orderCode,
        amountEgp: item.priceEgp,
        customerName: session.fullName,
        customerPhone: session.phone ?? "01019482735",
      });
      return NextResponse.json({ itemTitleAr: item.titleAr, ...fawry });
    }

    const paymob = createPaymobCheckoutSession({
      orderCode,
      amountEgp: item.priceEgp,
      customerName: session.fullName,
      customerEmail: session.email,
      customerPhone: session.phone ?? "01019482735",
    });
    return NextResponse.json({ itemTitleAr: item.titleAr, ...paymob });
  } catch {
    return NextResponse.json(
      { error: "تعذر بدء جلسة الدفع الإلكتروني." },
      { status: 400 },
    );
  }
}
