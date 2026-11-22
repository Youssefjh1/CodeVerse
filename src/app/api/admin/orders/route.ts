import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  getAdminCommerceData,
  revalidatePhase4Paths,
  updateAdminOrderStatus,
} from "@/lib/data/phase4-store";
import type { OrderStatus } from "@/types/commerce";

const VALID_STATUSES = new Set<OrderStatus>([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }

  const data = await getAdminCommerceData(auth.session);
  return NextResponse.json({ orders: data.orders });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.session) {
    return auth.response;
  }
  const session = auth.session;

  try {
    const body = (await request.json()) as {
      orderId?: number;
      status?: OrderStatus;
    };
    const orderId = Number(body.orderId);
    const status = String(body.status ?? "") as OrderStatus;
    if (!Number.isInteger(orderId) || orderId <= 0 || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "بيانات تحديث الطلب غير صالحة." },
        { status: 400 },
      );
    }

    const updated = await updateAdminOrderStatus(session, orderId, status);
    if (!updated) {
      return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
    }
    revalidatePhase4Paths();
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json(
      { error: "تعذر تحديث حالة الطلب." },
      { status: 400 },
    );
  }
}
