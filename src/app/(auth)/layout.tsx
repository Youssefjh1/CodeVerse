import { Code2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-obsidian px-4 py-10 text-chalk">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cyber-grid bg-[length:36px_36px] opacity-25"
      />
      <div className="relative z-10 mb-6 flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyber-purple via-indigo-600 to-cyber-cyan text-white shadow-neon-purple">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">
              Code<span className="text-cyber-cyan">Verse</span>
            </div>
            <p className="text-xs text-slate-muted">منصة البرمجة لطلبة ثانوي</p>
          </div>
        </Link>
      </div>

      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
