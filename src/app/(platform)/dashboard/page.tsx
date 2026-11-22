import { redirect } from "next/navigation";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { PlayerStatsCard } from "@/components/dashboard/player-stats-card";
import { QuickLaunchCards } from "@/components/dashboard/quick-launch-cards";
import { TrophyShowcase } from "@/components/dashboard/trophy-showcase";
import { getCachedDashboardData } from "@/lib/data/request-cache";

export default async function DashboardPage() {
  const data = await getCachedDashboardData();
  if (!data) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-chalk sm:text-2xl">
            أهلاً يا بطل — جاهز نرفع الـ XP النهاردة؟
          </h2>
          <p className="mt-1 text-sm text-slate-muted">
            لوحة تحكمك الشخصية في CodeVerse لمتابعة مستواك، سلسلة التزامك، ومهامك اليومية.
          </p>
        </div>
        {data.mode === "demo" ? (
          <span className="rounded-full border border-cyber-purple/35 bg-cyber-purple/10 px-3 py-1 text-xs font-bold text-purple-200">
            وضع المعاينة التفاعلي (بيانات تجريبية)
          </span>
        ) : null}
      </div>

      {/* Hero: Player Stats & Radar */}
      <PlayerStatsCard profile={data.profile} stats={data.stats} />

      {/* Asymmetric Middle Row: 16-week Heatmap (7 cols) + Trophy Showcase (5 cols) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ActivityHeatmap
            days={data.heatmap}
            currentStreak={data.profile.streak}
          />
        </div>
        <div className="xl:col-span-5">
          <TrophyShowcase
            badges={data.topBadges}
            totalEarned={data.totalEarnedBadges}
            rank={data.profile.rank}
            xp={data.profile.xp}
          />
        </div>
      </div>

      {/* Bottom Row: Quick Launch Missions */}
      <QuickLaunchCards
        dailyChallenge={data.dailyChallenge}
        playgroundPreviewCode={data.playgroundPreviewCode}
        lastLesson={data.lastLesson}
      />
    </div>
  );
}
