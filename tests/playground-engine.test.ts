import { describe, expect, it } from "vitest";
import { simulateCode } from "@/lib/playground/engine/simulate";
import { getLessonById, PLAYGROUND_LESSONS } from "@/lib/playground/lessons";
import type { PlaygroundLanguage } from "@/types/playground";

const LANGUAGES: PlaygroundLanguage[] = ["python", "javascript", "cpp"];

describe("Playground step-by-step simulation engine", () => {
  it("runs all 3 pre-loaded lessons accurately across Python, JavaScript, and C++", () => {
    const loopLesson = getLessonById("loop-1-to-10");
    const gradeLesson = getLessonById("grade-pass-fail");
    const evenLesson = getLessonById("sum-even-numbers");

    for (const lang of LANGUAGES) {
      // Lesson 1: 1..10
      const loopTrace = simulateCode(loopLesson.codeByLanguage[lang], lang, {
        lineTips: loopLesson.lineTipsByLanguage[lang],
      });
      expect(loopTrace.error).toBeNull();
      expect(loopTrace.truncated).toBe(false);
      const lastLoopStep = loopTrace.steps[loopTrace.steps.length - 1];
      expect(lastLoopStep.kind).toBe("program_end");
      expect(lastLoopStep.output.map((entry) => entry.text)).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
      ]);

      // Verify i transitions 1 -> 2 -> 3 in memory snapshots
      const iSteps = loopTrace.steps.filter((s) =>
        s.mutatedVariables.includes("i"),
      );
      expect(iSteps[0].variables.find((v) => v.name === "i")?.value).toBe("1");
      expect(iSteps[1].variables.find((v) => v.name === "i")?.previousValue).toBe("1");
      expect(iSteps[1].variables.find((v) => v.name === "i")?.value).toBe("2");
      expect(iSteps[2].variables.find((v) => v.name === "i")?.previousValue).toBe("2");
      expect(iSteps[2].variables.find((v) => v.name === "i")?.value).toBe("3");

      // Lesson 2: Grade pass/fail
      const gradeTrace = simulateCode(gradeLesson.codeByLanguage[lang], lang);
      expect(gradeTrace.error).toBeNull();
      const gradeEnd = gradeTrace.steps[gradeTrace.steps.length - 1];
      expect(gradeEnd.output.map((entry) => entry.text)).toEqual([
        "الدرجة: 78",
        "النتيجة: ناجح",
      ]);
      const statusVar = gradeEnd.variables.find((v) => v.name === "status");
      expect(statusVar?.value).toBe('"ناجح"');

      // Lesson 3: Sum even numbers 1..10 => 30
      const evenTrace = simulateCode(evenLesson.codeByLanguage[lang], lang);
      expect(evenTrace.error).toBeNull();
      const evenEnd = evenTrace.steps[evenTrace.steps.length - 1];
      expect(evenEnd.output.map((entry) => entry.text)).toEqual([
        "زوجي: 2 | المجموع: 2",
        "زوجي: 4 | المجموع: 6",
        "زوجي: 6 | المجموع: 12",
        "زوجي: 8 | المجموع: 20",
        "زوجي: 10 | المجموع: 30",
        "المجموع النهائي: 30",
      ]);
      expect(evenEnd.variables.find((v) => v.name === "total")?.value).toBe("30");
      expect(evenEnd.variables.find((v) => v.name === "count")?.value).toBe("5");
    }
  });

  it("attaches valid 1-based line numbers and Arabic explanations on every lesson step", () => {
    for (const lesson of PLAYGROUND_LESSONS) {
      for (const lang of LANGUAGES) {
        const code = lesson.codeByLanguage[lang];
        const totalLines = code.split("\n").length;
        const trace = simulateCode(code, lang, {
          lineTips: lesson.lineTipsByLanguage[lang],
        });

        expect(trace.steps.length).toBeGreaterThan(2);
        for (const step of trace.steps) {
          expect(step.line).toBeGreaterThanOrEqual(1);
          expect(step.line).toBeLessThanOrEqual(totalLines);
          expect(step.explanationAr.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("handles edited conditional code, while loops, break/continue, and f-strings", () => {
    const editedPython = [
      "score = 42",
      'status = "ناجح" if False else "مراجعة"',
    ];
    void editedPython;

    const gradeModified = getLessonById("grade-pass-fail").codeByLanguage.python.replace(
      "score = 78",
      "score = 42",
    );
    const gradeTrace = simulateCode(gradeModified, "python");
    expect(gradeTrace.error).toBeNull();
    expect(
      gradeTrace.steps[gradeTrace.steps.length - 1].output.map((o) => o.text),
    ).toEqual(["الدرجة: 42", "النتيجة: راسب"]);

    const whileCode = [
      "n = 0",
      "sum_val = 0",
      "while n < 6:",
      "    n += 1",
      "    if n == 3:",
      "        continue",
      "    if n == 5:",
      "        break",
      "    sum_val += n",
      'print(f"sum={sum_val}")',
    ].join("\n");
    const whileTrace = simulateCode(whileCode, "python");
    expect(whileTrace.error).toBeNull();
    // 1 + 2 + 4 = 7
    expect(
      whileTrace.steps[whileTrace.steps.length - 1].output.map((o) => o.text),
    ).toEqual(["sum=7"]);
  });

  it("evaluates JavaScript template literals and C++ integer division accurately", () => {
    const jsCode = [
      'const user = "زياد";',
      "let xp = 10 + 5 * 2;",
      "console.log(`Player ${user}: ${xp}`);",
    ].join("\n");
    const jsTrace = simulateCode(jsCode, "javascript");
    expect(jsTrace.error).toBeNull();
    expect(
      jsTrace.steps[jsTrace.steps.length - 1].output.map((o) => o.text),
    ).toEqual(["Player زياد: 20"]);

    const cppCode = [
      "#include <iostream>",
      "using namespace std;",
      "int main() {",
      "    int result = 7 / 2;",
      "    cout << result << endl;",
      "    return 0;",
      "}",
    ].join("\n");
    const cppTrace = simulateCode(cppCode, "cpp");
    expect(cppTrace.error).toBeNull();
    expect(
      cppTrace.steps[cppTrace.steps.length - 1].output.map((o) => o.text),
    ).toEqual(["3"]);
  });

  it("reports Arabic errors with exact line numbers and guards against infinite loops", () => {
    const divZeroTrace = simulateCode("x = 10\ny = 0\nz = x / y", "python");
    expect(divZeroTrace.error).not.toBeNull();
    expect(divZeroTrace.error?.line).toBe(3);
    expect(divZeroTrace.error?.messageAr).toMatch(/صفر/);

    const undefTrace = simulateCode("let a = b + 1;", "javascript");
    expect(undefTrace.error).not.toBeNull();
    expect(undefTrace.error?.line).toBe(1);
    expect(undefTrace.error?.messageAr).toContain('"b"');

    const infiniteTrace = simulateCode("x = 1\nwhile True:\n    x += 1", "python", {
      maxSteps: 15,
    });
    expect(infiniteTrace.truncated).toBe(true);
    expect(infiniteTrace.error).not.toBeNull();
    expect(infiniteTrace.steps.length).toBeLessThanOrEqual(16);
  });
});
