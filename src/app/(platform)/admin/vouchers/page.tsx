import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VouchersShippingHub } from "@/components/admin/vouchers-shipping-hub";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminCommerceData } from "@/lib/data/phase4-store";

export const metadata: Metadata = {
  title: "الأكواد والشحن | CodeVerse",
  description:
    "توليد أكواد التفعيل لإنستاباي وفودافون كاش والسناتر وإدارة طلبات شحن الكتب المطبوعة.",
};

export default async function AdminVouchersPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const commerce = await getAdminCommerceData(session);
  return <VouchersShippingHub initialData={commerce} />;
}
