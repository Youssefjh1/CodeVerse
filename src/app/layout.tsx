import type { Metadata } from "next";
import { Cairo, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CodeVerse | منصة البرمجة وعلوم الحاسب",
  description:
    "منصة تعليم برمجة وعلوم حاسب لطلبة المرحلة الثانوية في مصر بأسلوب الألعاب والتحديات التفاعلية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn("dark", cairo.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen bg-obsidian font-sans text-chalk antialiased selection:bg-cyber-purple/40 selection:text-white">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
