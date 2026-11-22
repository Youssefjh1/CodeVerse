import type { ReactNode } from "react";
import { CyberSidebar } from "@/components/layout/cyber-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileHud } from "@/components/layout/mobile-hud";
import type { PlayerShellData } from "@/types/gamification";

interface PlatformShellProps {
  data: PlayerShellData;
  children: ReactNode;
}

export function PlatformShell({ data, children }: PlatformShellProps) {
  return (
    <div className="flex min-h-screen bg-obsidian text-chalk">
      <CyberSidebar data={data} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHud data={data} />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
