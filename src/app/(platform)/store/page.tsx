import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StoreHub } from "@/components/store/store-hub";
import { getCurrentSession } from "@/lib/auth/session";
import { getStoreBootstrapData } from "@/lib/data/phase4-store";

export const metadata: Metadata = {
  title: "المتجر والمذكرات والباقات | CodeVerse",
  description:
    "ملازم PDF محمية، كتب مطبوعة للشحن لجميع المحافظات، باقات مرنة، وتفعيل أكواد السناتر.",
};

export default async function StorePage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const bootstrap = await getStoreBootstrapData(session);
  return <StoreHub initialData={bootstrap} />;
}
