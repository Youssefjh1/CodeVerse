import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CourseClassroom } from "@/components/courses/course-classroom";
import { ProtectedVideoPlayer } from "@/components/courses/protected-video-player";
import { getCourseDetailByIdOrSlug } from "@/lib/data/phase4-store";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Protected Video Player & Course Classroom", () => {
  it("renders dynamic moving watermark with student name and phone number", () => {
    vi.useFakeTimers();

    render(
      <ProtectedVideoPlayer
        lessonTitleAr="البحث الثنائي بالرسم"
        courseTitleAr="الخوارزميات"
        durationSeconds={900}
        bunnyVideoId={null}
        studentName="يوسف طارق"
        studentPhone="01019482735"
      />,
    );

    const watermark = screen.getByTestId("video-watermark");
    expect(watermark).toHaveTextContent("يوسف طارق");
    expect(watermark).toHaveTextContent("01019482735");
    const initialTop = watermark.style.top;
    const initialLeft = watermark.style.left;

    // Advance random movement timer past max 5000ms interval
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    const moved =
      watermark.style.top !== initialTop || watermark.style.left !== initialLeft;
    expect(moved).toBe(true);
  });

  it("plays free preview lessons and locks paid lessons until unlocked", async () => {
    const course = await getCourseDetailByIdOrSlug(
      {
        mode: "demo",
        userId: "student-course-test",
        fullName: "مريم خالد",
        email: "mariam@codeverse.eg",
        phone: "01055443322",
        grade: "grade_11",
        role: "student",
        avatarFrame: "cyber_cyan",
      },
      "2",
    );

    expect(course).not.toBeNull();
    render(
      <CourseClassroom
        course={course!}
        studentName="مريم خالد"
        studentPhone="01055443322"
      />,
    );

    // Lesson 1 is free preview -> shows watermark player
    expect(screen.getByTestId("video-watermark")).toHaveTextContent("مريم خالد");
    expect(screen.getByTestId("video-watermark")).toHaveTextContent("01055443322");

    // Lesson 2 is locked
    fireEvent.click(screen.getByRole("button", { name: /المكدس Stack/i }));
    expect(screen.getByTestId("locked-lesson-card")).toBeInTheDocument();
  });
});
