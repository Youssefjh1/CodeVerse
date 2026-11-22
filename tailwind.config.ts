import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#09090B",
          elevated: "#0D0F1A",
          glass: "rgba(20, 24, 40, 0.72)",
        },
        cyber: {
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          pink: "#EC4899",
        },
        chalk: "#F4F4F8",
        "slate-muted": "#9CA3C4",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "neon-purple": "0 0 28px -6px rgba(139, 92, 246, 0.45)",
        "neon-cyan": "0 0 28px -6px rgba(6, 182, 212, 0.45)",
        "neon-pink": "0 0 28px -6px rgba(236, 72, 153, 0.45)",
        glass: "0 20px 50px -24px rgba(0, 0, 0, 0.85)",
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(to right, rgba(139, 92, 246, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
