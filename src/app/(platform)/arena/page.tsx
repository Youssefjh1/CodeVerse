import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArenaHub } from "@/components/arena/arena-hub";
import { getCurrentSession } from "@/lib/auth/session";
import { getArenaBootstrapData } from "@/lib/data/phase3-store";

export const metadata: Metadata = {
  title: "ساحة التحديات | CodeVerse",
  description:
    "نافس في تحديات حقيقة ولا هبد، Output Rush، Debug Duel، ومبارزات 1v1 Flash Blitz ولوحات الشرف.",
};

export default async function ArenaPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const bootstrap = await getArenaBootstrapData(session);
  return <ArenaHub initialData={bootstrap} />;
}
