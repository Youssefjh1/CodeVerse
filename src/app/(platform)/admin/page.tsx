import {
  BrainCircuit,
  CalendarCheck2,
  Database,
  ShoppingBag,
  Ticket,
  Truck,
} from "lucide-react";
import { redirect } from "next/navigation";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import { getCurrentSession } from "@/lib/auth/session";
import {
  listAllAdminQuestions,
  listScheduledExams,
} from "@/lib/data/phase3-store";
import { getAdminCommerceData } from "@/lib/data/phase4-store";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const [questions, exams, commerce] = await Promise.all([
    listAllAdminQuestions(session),
    listScheduledExams(session, true),
    getAdminCommerceData(session),
  ]);

  const activeVouchersCount = commerce.vouchers.filter((v) => v.isActive).length;
  const pendingOrdersCount = commerce.orders.filter(
    (o) => o.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-pink/45 bg-cyber-pink/15 px-3 py-1 text-xs font-extrabold text-pink-200">
          بوابة المشرف — CodeVerse
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
          مركز إدارة المنصة ومحرك الامتحانات والأكواد
        </h1>
        <p className="mt-1 text-sm text-slate-muted">
          تحكّم في بنك الأسئلة، جدولة الامتحانات التنافسية، توليد أكواد السناتر، وشحن الكتب المطبوعة.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <GlassCard variant="hero" className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyber-cyan/45 bg-cyber-cyan/15 text-cyber-cyan">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  محرك الامتحانات AI
                </h2>
                <p className="text-xs text-slate-muted">
                  توليد أسئلة مقيدة بملفات المنهج + اعتماد المشرف + مجدول الامتحانات
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-muted">
                  <Database className="h-3.5 w-3.5 text-cyber-cyan" />
                  بنك الأسئلة
                </div>
                <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
                  {questions.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-muted">
                  <CalendarCheck2 className="h-3.5 w-3.5 text-cyber-purple" />
                  امتحانات مجدولة
                </div>
                <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
                  {exams.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
            <CyberButton href="/admin/ai-engine" variant="primary">
              فتح محرك الامتحانات AI
            </CyberButton>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/45 bg-amber-400/15 text-amber-300">
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  مولّد الأكواد ولوحة شحن الكتب
                </h2>
                <p className="text-xs text-slate-muted">
                  إصدار دفعات CODE-XXXX-XXXX ومتابعة شحنات المحافظات
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-muted">
                  <Ticket className="h-3.5 w-3.5 text-amber-300" />
                  أكواد نشطة
                </div>
                <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
                  {activeVouchersCount}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-obsidian/80 p-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-muted">
                  <Truck className="h-3.5 w-3.5 text-cyber-pink" />
                  شحنات بانتظار التجهيز
                </div>
                <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
                  {pendingOrdersCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
            <CyberButton href="/store" variant="ghost" size="sm">
              <ShoppingBag className="h-4 w-4" />
              معاينة المتجر
            </CyberButton>
            <CyberButton href="/admin/vouchers" variant="cyan">
              إدارة الأكواد والشحن
            </CyberButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
