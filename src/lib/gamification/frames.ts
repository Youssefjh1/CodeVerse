import type { AvatarFrameDefinition, AvatarFrameId } from "@/types/gamification";

export const AVATAR_FRAMES: readonly AvatarFrameDefinition[] = [
  {
    id: "obsidian_edge",
    nameAr: "حافة أوبسيديان",
    ringClass: "border-slate-300/60 bg-slate-900/90",
    glowClass: "shadow-[0_0_24px_-4px_rgba(148,163,184,0.45)]",
    swatchHex: "#94A3B8",
  },
  {
    id: "electric_violet",
    nameAr: "بنفسجي مشحون",
    ringClass: "border-cyber-purple bg-purple-950/50",
    glowClass: "shadow-[0_0_32px_-4px_rgba(139,92,246,0.72)]",
    swatchHex: "#8B5CF6",
  },
  {
    id: "cyber_cyan",
    nameAr: "سايبر سيان",
    ringClass: "border-cyber-cyan bg-cyan-950/50",
    glowClass: "shadow-[0_0_32px_-4px_rgba(6,182,212,0.75)]",
    swatchHex: "#06B6D4",
  },
  {
    id: "hot_pink",
    nameAr: "وردي نيون",
    ringClass: "border-cyber-pink bg-pink-950/50",
    glowClass: "shadow-[0_0_32px_-4px_rgba(236,72,153,0.75)]",
    swatchHex: "#EC4899",
  },
  {
    id: "solar_glitch",
    nameAr: "وميض جليتش",
    ringClass: "border-amber-400 bg-amber-950/40",
    glowClass: "shadow-[0_0_34px_-4px_rgba(245,158,11,0.7)]",
    swatchHex: "#F59E0B",
  },
] as const;

export function getAvatarFrame(frameId?: string | null): AvatarFrameDefinition {
  return AVATAR_FRAMES.find((frame) => frame.id === frameId) ?? AVATAR_FRAMES[1];
}

export function isValidAvatarFrame(value: unknown): value is AvatarFrameId {
  return typeof value === "string" && AVATAR_FRAMES.some((frame) => frame.id === value);
}
