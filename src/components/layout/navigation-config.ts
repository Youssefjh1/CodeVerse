export type NavIconName =
  | "LayoutDashboard"
  | "Terminal"
  | "Swords"
  | "PlaySquare"
  | "ShoppingBag"
  | "ShieldCheck"
  | "Sparkles"
  | "Ticket";

export interface PlatformNavItem {
  href: string;
  label: string;
  phaseTag?: string;
  iconName: NavIconName;
  adminOnly?: boolean;
  mobileTab: boolean;
}

export const PLATFORM_NAV_ITEMS: readonly PlatformNavItem[] = [
  {
    href: "/dashboard",
    label: "لوحة اللاعب",
    iconName: "LayoutDashboard",
    mobileTab: true,
  },
  {
    href: "/playground",
    label: "ملعب الكود",
    iconName: "Terminal",
    mobileTab: true,
  },
  {
    href: "/arena",
    label: "ساحة التحديات",
    iconName: "Swords",
    mobileTab: true,
  },
  {
    href: "/courses",
    label: "الكورسات",
    iconName: "PlaySquare",
    mobileTab: true,
  },
  {
    href: "/store",
    label: "المتجر والمذكرات",
    iconName: "ShoppingBag",
    mobileTab: true,
  },
  {
    href: "/admin",
    label: "لوحة الإدارة",
    phaseTag: "إدارة",
    iconName: "ShieldCheck",
    adminOnly: true,
    mobileTab: false,
  },
  {
    href: "/admin/ai-engine",
    label: "محرك الامتحانات AI",
    phaseTag: "AI",
    iconName: "Sparkles",
    adminOnly: true,
    mobileTab: false,
  },
  {
    href: "/admin/vouchers",
    label: "الأكواد والشحن",
    phaseTag: "إدارة",
    iconName: "Ticket",
    adminOnly: true,
    mobileTab: false,
  },
] as const;
