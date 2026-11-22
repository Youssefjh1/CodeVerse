import type { Metadata } from "next";
import { PlaygroundWorkbench } from "@/components/playground/playground-workbench";

export const metadata: Metadata = {
  title: "ملعب الكود التفاعلي | CodeVerse",
  description:
    "محرر أكواد تفاعلي مع تنفيذ خطوة بخطوة وعارض الذاكرة والمتغيرات وشاشة المخرجات المتحركة.",
};

export default function PlaygroundPage() {
  return <PlaygroundWorkbench />;
}
