import { cache } from "react";
import { getCurrentSession } from "@/lib/auth/session";
import { getDashboardData, getProfileShellData } from "@/lib/data/dashboard";

export const getCachedSession = cache(async () => {
  return getCurrentSession();
});

export const getCachedShellData = cache(async () => {
  const session = await getCachedSession();
  if (!session) {
    return null;
  }
  return getProfileShellData(session);
});

export const getCachedDashboardData = cache(async () => {
  const session = await getCachedSession();
  if (!session) {
    return null;
  }
  return getDashboardData(session);
});
