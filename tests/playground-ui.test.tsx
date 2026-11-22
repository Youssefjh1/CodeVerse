import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaygroundWorkbench } from "@/components/playground/playground-workbench";

vi.mock("@/components/playground/monaco-code-editor", () => ({
  MonacoCodeEditor: ({
    value,
    language,
    activeLine,
    errorLine,
    onChange,
  }: {
    value: string;
    language: string;
    activeLine: number | null;
    errorLine: number | null;
    onChange: (nextValue: string) => void;
  }) => (
    <div
      dir="ltr"
      data-testid="monaco-editor-shell"
      data-language={language}
      data-active-line={activeLine ?? ""}
      data-error-line={errorLine ?? ""}
    >
      <textarea
        data-testid="mock-monaco-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

afterEach(() => {
  vi.useRealTimers();
});

describe("PlaygroundWorkbench interactive UI", () => {
  it("steps forward, updates Memory Inspector mutations, prints to LTR console, steps back, and resets", async () => {
    render(<PlaygroundWorkbench />);

    const editorShell = await screen.findByTestId("monaco-editor-shell");
    expect(editorShell).toHaveAttribute("dir", "ltr");
    expect(editorShell).toHaveAttribute("data-language", "python");

    expect(screen.getByTestId("output-console")).toHaveAttribute("dir", "ltr");
    expect(
      screen.getByRole("button", { name: /حلقة طباعة من 1 لـ 10/i }),
    ).toHaveAttribute("aria-pressed", "true");

    const stepForwardBtn = screen.getByRole("button", { name: "خطوة للأمام" });
    const stepBackBtn = screen.getByRole("button", { name: "خطوة للخلف" });
    const resetBtn = screen.getByRole("button", { name: "إعادة ضبط" });

    // Step 1: limit = 10 (line 1)
    fireEvent.click(stepForwardBtn);
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-active-line",
      "1",
    );
    expect(screen.getByTestId("var-value-limit")).toHaveTextContent("10");

    // Step 2: for i in range(1, limit + 1): i = 1 (line 2)
    fireEvent.click(stepForwardBtn);
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-active-line",
      "2",
    );
    expect(screen.getByTestId("var-value-i")).toHaveTextContent("1");
    expect(screen.getByTestId("var-box-i")).toHaveAttribute("data-var-status", "created");

    // Step 3: print(i) -> prints "1"
    fireEvent.click(stepForwardBtn);
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-active-line",
      "3",
    );
    expect(screen.getAllByTestId("console-output-line")).toHaveLength(1);
    expect(screen.getAllByTestId("console-output-line")[0]).toHaveTextContent("1");

    // Step 4: i updates 1 -> 2
    fireEvent.click(stepForwardBtn);
    expect(screen.getByTestId("var-value-i")).toHaveTextContent("2");
    expect(screen.getByTestId("var-box-i")).toHaveAttribute("data-var-status", "updated");
    expect(screen.getByTestId("var-diff-i")).toHaveTextContent("1 -> 2");

    // Step Back rewinds cleanly to print(i)
    fireEvent.click(stepBackBtn);
    expect(screen.getByTestId("var-value-i")).toHaveTextContent("1");
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-active-line",
      "3",
    );

    // Reset clears variables, output, and active line
    fireEvent.click(resetBtn);
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-active-line",
      "",
    );
    expect(screen.queryByTestId("var-box-i")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId("console-output-line")).toHaveLength(0);
  });

  it("supports switching lessons, switching languages, and editing live code", async () => {
    render(<PlaygroundWorkbench />);

    const textarea = (await screen.findByTestId(
      "mock-monaco-textarea",
    )) as HTMLTextAreaElement;

    // Switch to Lesson 2 (Grade pass/fail)
    fireEvent.click(screen.getByRole("button", { name: /فحص الدرجة ناجح\/راسب/i }));
    expect(textarea.value).toContain("score = 78");

    // Switch language to C++
    fireEvent.click(screen.getByRole("button", { name: "C++" }));
    expect(screen.getByTestId("monaco-editor-shell")).toHaveAttribute(
      "data-language",
      "cpp",
    );
    expect(textarea.value).toContain("#include <iostream>");

    // Switch back to Python and edit score = 78 -> score = 35
    fireEvent.click(screen.getByRole("button", { name: "Python" }));
    fireEvent.change(textarea, {
      target: { value: textarea.value.replace("score = 78", "score = 35") },
    });

    expect(
      screen.getByRole("button", { name: /استعادة كود الدرس/i }),
    ).toBeInTheDocument();

    // Run All via fake timers to verify edited code outputs "النتيجة: راسب"
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "تشغيل الكل" }));

    for (let step = 0; step < 12; step += 1) {
      act(() => {
        vi.advanceTimersByTime(900);
      });
    }

    const outputTexts = screen
      .getAllByTestId("console-output-line")
      .map((node) => node.textContent);
    expect(outputTexts.some((t) => t?.includes("الدرجة: 35"))).toBe(true);
    expect(outputTexts.some((t) => t?.includes("النتيجة: راسب"))).toBe(true);
  });

  it("changes playback speed via slider and toggles sound effects cleanly", async () => {
    render(<PlaygroundWorkbench />);
    await screen.findByTestId("mock-monaco-textarea");

    const speedSlider = screen.getByRole("slider", { name: "سرعة التنفيذ" });
    expect(screen.getByTestId("speed-value")).toHaveTextContent("1x");

    fireEvent.change(speedSlider, { target: { value: "3" } });
    expect(screen.getByTestId("speed-value")).toHaveTextContent("4x");

    const soundBtn = screen.getByRole("button", { name: "تبديل المؤثرات الصوتية" });
    expect(soundBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(soundBtn);
    expect(soundBtn).toHaveAttribute("aria-pressed", "true");
  });
});
