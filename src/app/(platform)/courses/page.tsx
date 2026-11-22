import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getCurrentSession } from "@/lib/auth/session";
import { getCoursesCatalog } from "@/lib/data/phase4-store";

export const metadata: Metadata = {
  title: "الكورسات والحصص المحمية | CodeVerse",
  description:
    "منهج أولى وتانية ثانوي مشروح بالفيديو المحمي بعلامة مائية متحركة مع تطبيقات ملعب الكود.",
};

export default async function CoursesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const catalog = await getCoursesCatalog(session);
  return <CoursesCatalog initialData={catalog} />;
}
