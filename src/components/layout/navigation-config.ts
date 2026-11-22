export type NavIconName =
  | "LayoutDashboard"
  | "Terminal"
  | "Swords"
  | "PlaySquare"
  | "ShoppingBag"
  | "ShieldCheck";

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
    phaseTag: "المرحلة 2",
    iconName: "Terminal",
    mobileTab: true,
  },
  {
    href: "/arena",
    label: "ساحة التحديات",
    phaseTag: "المرحلة 3",
    iconName: "Swords",
    mobileTab: true,
  },
  {
    href: "/courses",
    label: "الكورسات",
    phaseTag: "المرحلة 4",
    iconName: "PlaySquare",
    mobileTab: true,
  },
  {
    href: "/store",
    label: "المتجر والمذكرات",
    phaseTag: "المرحلة 4",
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
] as const;
