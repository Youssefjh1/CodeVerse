import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CyberButtonBaseProps {
  children: ReactNode;
  variant?: "primary" | "cyan" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

type CyberButtonProps =
  | (CyberButtonBaseProps & { href: string; onClick?: never })
  | (CyberButtonBaseProps &
      ButtonHTMLAttributes<HTMLButtonElement> & { href?: never });

const VARIANT_CLASSES = {
  primary:
    "glitch-cta border border-cyber-purple/70 bg-gradient-to-l from-cyber-purple/90 to-indigo-600/90 text-white shadow-neon-purple hover:from-cyber-purple hover:to-cyber-cyan/80",
  cyan:
    "glitch-cta border border-cyber-cyan/50 bg-cyber-cyan/15 text-cyan-200 hover:bg-cyber-cyan/25 hover:border-cyber-cyan",
  ghost:
    "border border-white/10 bg-white/5 text-chalk hover:border-cyber-purple/40 hover:bg-white/10",
} as const;

const SIZE_CLASSES = {
  sm: "px-3.5 py-2 text-xs rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-xl",
} as const;

export function CyberButton(props: CyberButtonProps) {
  const { children, variant = "primary", size = "md", className } = props;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    type = "button",
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    ...buttonProps
  } = props;
  void _v;
  void _s;
  void _c;
  void _ch;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
