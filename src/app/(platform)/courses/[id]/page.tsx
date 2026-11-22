import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CourseClassroom } from "@/components/courses/course-classroom";
import { getCurrentSession } from "@/lib/auth/session";
import { getCourseDetailByIdOrSlug } from "@/lib/data/phase4-store";

export const metadata: Metadata = {
  title: "غرفة الحصة المحمية | CodeVerse",
  description: "مشاهدة الحصص التعليمية مع حماية العلامة المائية المتحركة.",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const course = await getCourseDetailByIdOrSlug(session, id);
  if (!course) {
    notFound();
  }

  return (
    <CourseClassroom
      course={course}
      studentName={session.fullName}
      studentPhone={session.phone ?? "01019482735"}
      showDemoHints={session.mode === "demo"}
    />
  );
}
