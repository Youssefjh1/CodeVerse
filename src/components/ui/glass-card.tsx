import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "hero" | "subtle";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-colors duration-200",
        variant === "hero" &&
          "glass-panel cyber-chamfer border-cyber-purple/35 shadow-neon-purple",
        variant === "default" &&
          "glass-panel border-cyber-purple/20 hover:border-cyber-cyan/35",
        variant === "subtle" &&
          "border border-white/10 bg-obsidian-elevated/80 backdrop-blur-md",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
