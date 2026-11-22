import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PlatformShell } from "@/components/layout/platform-shell";
import { getCachedShellData } from "@/lib/data/request-cache";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const shellData = await getCachedShellData();
  if (!shellData) {
    redirect("/login");
  }

  return <PlatformShell data={shellData}>{children}</PlatformShell>;
}
