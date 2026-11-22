import {
  classifyVariableType,
  EngineError,
  evaluateExpression,
  formatForOutput,
  formatRuntimeValue,
  isTruthy,
} from "@/lib/playground/engine/expr";
import { parseCode, type Stmt } from "@/lib/playground/engine/parser";
import type {
  ExecutionStep,
  ExecutionTrace,
  OutputEntry,
  PlaygroundLanguage,
  RuntimeValue,
  StepKind,
  VariableSnapshot,
} from "@/types/playground";

export const DEFAULT_MAX_STEPS = 250;

type FlowSignal = "none" | "break" | "continue" | "return";

interface SimulationOptions {
  maxSteps?: number;
  lineTips?: Record<number, string>;
}

class SimulationAborted extends Error {
  constructor() {
    super("MAX_STEPS_EXCEEDED");
  }
}

export function simulateCode(
  code: string,
  language: PlaygroundLanguage,
  options: SimulationOptions = {},
): ExecutionTrace {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const lineTips = options.lineTips ?? {};

  const steps: ExecutionStep[] = [];
  const env = new Map<string, RuntimeValue>();
  const varOrder: string[] = [];
  let prevRenderedValues = new Map<string, string>();
  const output: OutputEntry[] = [];
  let lastLine = 1;

  function buildSnapshots(): {
    variables: VariableSnapshot[];
    mutatedVariables: string[];
  } {
    const variables: VariableSnapshot[] = [];
    const mutatedVariables: string[] = [];
    const nextRendered = new Map<string, string>();

    for (const name of varOrder) {
      if (!env.has(name)) continue;
      const rawValue = env.get(name)!;
      const formatted = formatRuntimeValue(rawValue, language);
      const { type, typeLabelAr } = classifyVariableType(rawValue);
      nextRendered.set(name, formatted);

      const prevFormatted = prevRenderedValues.get(name);
      if (prevFormatted === undefined) {
        mutatedVariables.push(name);
        variables.push({
          name,
          type,
          typeLabelAr,
          value: formatted,
          rawValue: Array.isArray(rawValue) ? [...rawValue] : rawValue,
          status: "created",
        });
      } else if (prevFormatted !== formatted) {
        mutatedVariables.push(name);
        variables.push({
          name,
          type,
          typeLabelAr,
          value: formatted,
          rawValue: Array.isArray(rawValue) ? [...rawValue] : rawValue,
          previousValue: prevFormatted,
          status: "updated",
        });
      } else {
        variables.push({
          name,
          type,
          typeLabelAr,
          value: formatted,
          rawValue: Array.isArray(rawValue) ? [...rawValue] : rawValue,
          status: "unchanged",
        });
      }
    }

    prevRenderedValues = nextRendered;
    return { variables, mutatedVariables };
  }

  function recordStep(params: {
    line: number;
    kind: StepKind;
    codeSnippet: string;
    explanationAr: string;
    conditionResult?: boolean;
    newOutput?: OutputEntry;
  }): void {
    if (steps.length >= maxSteps) {
      throw new SimulationAborted();
    }
    lastLine = params.line;
    const { variables, mutatedVariables } = buildSnapshots();
    steps.push({
      stepIndex: steps.length,
      line: params.line,
      kind: params.kind,
      codeSnippet: params.codeSnippet,
      explanationAr: params.explanationAr,
      lessonTipAr: lineTips[params.line],
      conditionResult: params.conditionResult,
      variables,
      mutatedVariables,
      output: [...output],
      newOutput: params.newOutput,
    });
  }

  function setVar(name: string, value: RuntimeValue): {
    existed: boolean;
    prevFormatted?: string;
    nextFormatted: string;
  } {
    const existed = env.has(name);
    const prevFormatted = existed
      ? formatRuntimeValue(env.get(name)!, language)
      : undefined;
    if (!varOrder.includes(name)) {
      varOrder.push(name);
    }
    env.set(name, value);
    return {
      existed,
      prevFormatted,
      nextFormatted: formatRuntimeValue(value, language),
    };
  }

  function applySimpleMutation(
    stmt: Extract<
      Stmt,
      { kind: "assign" | "compound_assign" | "inc_dec" }
    >,
  ): {
    name: string;
    existed: boolean;
    prevFormatted?: string;
    nextFormatted: string;
  } {
    if (stmt.kind === "assign") {
      const val = evaluateExpression(stmt.expr, env, language, stmt.line);
      const change = setVar(stmt.name, val);
      return { name: stmt.name, ...change };
    }

    if (!env.has(stmt.name)) {
      throw new EngineError(
        stmt.line,
        `المتغير "${stmt.name}" غير معرّف قبل تعديل قيمته.`,
      );
    }

    const current = env.get(stmt.name)!;
    if (stmt.kind === "inc_dec") {
      if (typeof current !== "number") {
        throw new EngineError(
          stmt.line,
          `لا يمكن تطبيق ${stmt.delta > 0 ? "++" : "--"} إلا على متغير رقمي.`,
        );
      }
      const change = setVar(stmt.name, current + stmt.delta);
      return { name: stmt.name, ...change };
    }

    const rhs = evaluateExpression(stmt.expr, env, language, stmt.line);
    if (stmt.operator === "+=" && (typeof current === "string" || typeof rhs === "string")) {
      const nextStr =
        formatForOutput(current, language) + formatForOutput(rhs, language);
      const change = setVar(stmt.name, nextStr);
      return { name: stmt.name, ...change };
    }

    if (typeof current !== "number" || typeof rhs !== "number") {
      throw new EngineError(
        stmt.line,
        `المعامل "${stmt.operator}" يتطلب قيماً رقمية.`,
      );
    }

    let nextVal = current;
    if (stmt.operator === "+=") nextVal = current + rhs;
    else if (stmt.operator === "-=") nextVal = current - rhs;
    else if (stmt.operator === "*=") nextVal = current * rhs;
    else {
      if (rhs === 0) {
        throw new EngineError(
          stmt.line,
          "لا يمكن القسمة أو أخذ باقي القسمة على صفر.",
        );
      }
      nextVal =
        stmt.operator === "/="
          ? language === "cpp" && Number.isInteger(current) && Number.isInteger(rhs)
            ? Math.trunc(current / rhs)
            : current / rhs
          : current % rhs;
    }

    const change = setVar(stmt.name, nextVal);
    return { name: stmt.name, ...change };
  }

  function execBlock(block: Stmt[]): FlowSignal {
    for (const stmt of block) {
      const signal = execStmt(stmt);
      if (signal !== "none") {
        return signal;
      }
    }
    return "none";
  }

  function execStmt(stmt: Stmt): FlowSignal {
    switch (stmt.kind) {
      case "assign":
      case "compound_assign":
      case "inc_dec": {
        const res = applySimpleMutation(stmt);
        const explanationAr = res.existed
          ? `تم تحديث المتغير ${res.name} من ${res.prevFormatted} إلى ${res.nextFormatted}.`
          : `تم إنشاء المتغير ${res.name} وتخزين القيمة ${res.nextFormatted} في الذاكرة.`;
        recordStep({
          line: stmt.line,
          kind: "assign",
          codeSnippet: stmt.sourceText,
          explanationAr,
        });
        return "none";
      }

      case "print": {
        const renderedParts = stmt.exprs.map((expr) => {
          const val = evaluateExpression(expr, env, language, stmt.line);
          return formatForOutput(val, language);
        });
        const text = stmt.joinWithSpace
          ? renderedParts.join(" ")
          : renderedParts.join("");
        const entry: OutputEntry = {
          id: `out-${steps.length}-${output.length}`,
          stepIndex: steps.length,
          line: stmt.line,
          text,
          kind: "stdout",
        };
        output.push(entry);
        recordStep({
          line: stmt.line,
          kind: "output",
          codeSnippet: stmt.sourceText,
          explanationAr: `طباعة "${text}" في شاشة المخرجات.`,
          newOutput: entry,
        });
        return "none";
      }

      case "if": {
        for (const branch of stmt.branches) {
          if (branch.condition === null) {
            recordStep({
              line: branch.line,
              kind: "condition",
              codeSnippet: branch.sourceText,
              explanationAr:
                "دخول فرع else لأن جميع الشروط السابقة لم تتحقق.",
              conditionResult: true,
            });
            return execBlock(branch.body);
          }

          const condVal = evaluateExpression(
            branch.condition,
            env,
            language,
            branch.line,
          );
          const passed = isTruthy(condVal);
          recordStep({
            line: branch.line,
            kind: "condition",
            codeSnippet: branch.sourceText,
            explanationAr: passed
              ? `فحص الشرط (${branch.condition}): النتيجة صحيح، ندخل لتنفيذ هذا الفرع.`
              : `فحص الشرط (${branch.condition}): النتيجة خاطئ، نتخطى هذا الفرع.`,
            conditionResult: passed,
          });
          if (passed) {
            return execBlock(branch.body);
          }
        }
        return "none";
      }

      case "for_range": {
        let items: RuntimeValue[];
        if (stmt.rangeArgs) {
          const evalArgs = stmt.rangeArgs.map((arg) => {
            const v = evaluateExpression(arg, env, language, stmt.line);
            if (typeof v !== "number" || !Number.isInteger(v)) {
              throw new EngineError(
                stmt.line,
                "معاملات range() يجب أن تكون أعداداً صحيحة.",
              );
            }
            return v;
          });
          const start = evalArgs.length === 1 ? 0 : evalArgs[0];
          const stop = evalArgs.length === 1 ? evalArgs[0] : evalArgs[1];
          const step = evalArgs.length === 3 ? evalArgs[2] : 1;
          if (step === 0) {
            throw new EngineError(stmt.line, "قيمة الخطوة في range() لا يمكن أن تساوي 0.");
          }
          items = [];
          if (step > 0) {
            for (let v = start; v < stop; v += step) {
              items.push(v);
              if (items.length > maxSteps + 5) break;
            }
          } else {
            for (let v = start; v > stop; v += step) {
              items.push(v);
              if (items.length > maxSteps + 5) break;
            }
          }
        } else {
          const target = evaluateExpression(
            stmt.iterableExpr!,
            env,
            language,
            stmt.line,
          );
          if (Array.isArray(target)) {
            items = [...target];
          } else if (typeof target === "string") {
            items = target.split("");
          } else {
            throw new EngineError(
              stmt.line,
              "حلقة for تتطلب range() أو قائمة أو نصاً للتكرار عليه.",
            );
          }
        }

        for (let iterIdx = 0; iterIdx < items.length; iterIdx += 1) {
          const val = items[iterIdx];
          const change = setVar(stmt.iterator, val);
          const iterNumber = iterIdx + 1;
          recordStep({
            line: stmt.line,
            kind: iterIdx === 0 ? "loop_init" : "loop_update",
            codeSnippet: stmt.sourceText,
            explanationAr:
              iterIdx === 0
                ? `بدء الحلقة (التكرار رقم 1): تهيئة العداد ${stmt.iterator} بالقيمة ${change.nextFormatted}.`
                : `التكرار رقم ${iterNumber}: تحديث ${stmt.iterator} من ${change.prevFormatted} إلى ${change.nextFormatted}.`,
            conditionResult: true,
          });

          const signal = execBlock(stmt.body);
          if (signal === "break") {
            return "none";
          }
          if (signal === "return") {
            return "return";
          }
        }

        recordStep({
          line: stmt.line,
          kind: "loop_check",
          codeSnippet: stmt.sourceText,
          explanationAr: `انتهت عناصر الحلقة (${items.length} دورات)، نخرج من حلقة for.`,
          conditionResult: false,
        });
        return "none";
      }

      case "for_cstyle": {
        let initialized = false;
        let iteration = 0;

        while (true) {
          let initExplanation = "";
          if (!initialized) {
            initialized = true;
            if (
              stmt.init &&
              (stmt.init.kind === "assign" ||
                stmt.init.kind === "compound_assign" ||
                stmt.init.kind === "inc_dec")
            ) {
              const initChange = applySimpleMutation(stmt.init);
              initExplanation = `تهيئة ${initChange.name} = ${initChange.nextFormatted}؛ `;
            }
          } else if (
            stmt.update &&
            (stmt.update.kind === "assign" ||
              stmt.update.kind === "compound_assign" ||
              stmt.update.kind === "inc_dec")
          ) {
            const updChange = applySimpleMutation(stmt.update);
            initExplanation = `تحديث ${updChange.name} من ${updChange.prevFormatted} إلى ${updChange.nextFormatted}؛ `;
          }

          const passed = stmt.condition
            ? isTruthy(
                evaluateExpression(stmt.condition, env, language, stmt.line),
              )
            : true;

          if (!passed) {
            recordStep({
              line: stmt.line,
              kind: "loop_check",
              codeSnippet: stmt.sourceText,
              explanationAr: `${initExplanation}شرط الحلقة (${stmt.condition}) أصبح خاطئاً، نخرج من الحلقة.`,
              conditionResult: false,
            });
            return "none";
          }

          iteration += 1;
          recordStep({
            line: stmt.line,
            kind: iteration === 1 ? "loop_init" : "loop_update",
            codeSnippet: stmt.sourceText,
            explanationAr: stmt.condition
              ? `${initExplanation}الشرط (${stmt.condition}) صحيح — بدء الدورة رقم ${iteration}.`
              : `${initExplanation}بدء الدورة رقم ${iteration}.`,
            conditionResult: true,
          });

          const signal = execBlock(stmt.body);
          if (signal === "break") return "none";
          if (signal === "return") return "return";
        }
      }

      case "while": {
        let iteration = 0;
        while (true) {
          const passed = isTruthy(
            evaluateExpression(stmt.condition, env, language, stmt.line),
          );
          if (!passed) {
            recordStep({
              line: stmt.line,
              kind: "loop_check",
              codeSnippet: stmt.sourceText,
              explanationAr: `شرط while (${stmt.condition}) أصبح خاطئاً، نخرج من الحلقة.`,
              conditionResult: false,
            });
            return "none";
          }
          iteration += 1;
          recordStep({
            line: stmt.line,
            kind: "loop_check",
            codeSnippet: stmt.sourceText,
            explanationAr: `شرط while (${stmt.condition}) صحيح — تنفيذ الدورة رقم ${iteration}.`,
            conditionResult: true,
          });

          const signal = execBlock(stmt.body);
          if (signal === "break") return "none";
          if (signal === "return") return "return";
        }
      }

      case "break":
        recordStep({
          line: stmt.line,
          kind: "condition",
          codeSnippet: stmt.sourceText,
          explanationAr: "تنفيذ break للخروج الفوري من الحلقة الحالية.",
        });
        return "break";

      case "continue":
        recordStep({
          line: stmt.line,
          kind: "condition",
          codeSnippet: stmt.sourceText,
          explanationAr: "تنفيذ continue والانتقال مباشرة للدورة التالية.",
        });
        return "continue";

      case "return": {
        if (stmt.expr) {
          evaluateExpression(stmt.expr, env, language, stmt.line);
        }
        lastLine = stmt.line;
        return "return";
      }
    }
  }

  try {
    const ast = parseCode(code, language);
    if (ast.length === 0) {
      return {
        language,
        steps: [],
        error: null,
        truncated: false,
        totalSteps: 0,
      };
    }

    execBlock(ast);

    const endLine = lastLine;
    const { variables, mutatedVariables } = buildSnapshots();
    steps.push({
      stepIndex: steps.length,
      line: endLine,
      kind: "program_end",
      codeSnippet: "",
      explanationAr: `اكتمل تنفيذ البرنامج بنجاح في ${steps.length} خطوة.`,
      lessonTipAr: lineTips[endLine],
      variables,
      mutatedVariables,
      output: [...output],
    });

    return {
      language,
      steps,
      error: null,
      truncated: false,
      totalSteps: steps.length,
    };
  } catch (err) {
    if (err instanceof SimulationAborted) {
      const msg = `تم إيقاف التنفيذ تلقائياً بعد ${maxSteps} خطوة لتجنب حلقة لا نهائية.`;
      const errEntry: OutputEntry = {
        id: `err-limit-${steps.length}`,
        stepIndex: steps.length,
        line: lastLine,
        text: msg,
        kind: "error",
      };
      output.push(errEntry);
      const { variables, mutatedVariables } = buildSnapshots();
      steps.push({
        stepIndex: steps.length,
        line: lastLine,
        kind: "error",
        codeSnippet: "",
        explanationAr: msg,
        variables,
        mutatedVariables,
        output: [...output],
        newOutput: errEntry,
      });
      return {
        language,
        steps,
        error: {
          line: lastLine,
          messageAr: msg,
          hintAr: "راجع شرط توقف الحلقة وتأكد من تغيّر العداد في كل دورة.",
        },
        truncated: true,
        totalSteps: steps.length,
      };
    }

    if (err instanceof EngineError) {
      const errEntry: OutputEntry = {
        id: `err-line-${err.line}-${steps.length}`,
        stepIndex: steps.length,
        line: err.line,
        text: `السطر ${err.line}: ${err.messageAr}`,
        kind: "error",
      };
      output.push(errEntry);
      const { variables, mutatedVariables } = buildSnapshots();
      steps.push({
        stepIndex: steps.length,
        line: err.line,
        kind: "error",
        codeSnippet: "",
        explanationAr: err.messageAr,
        variables,
        mutatedVariables,
        output: [...output],
        newOutput: errEntry,
      });
      return {
        language,
        steps,
        error: {
          line: err.line,
          messageAr: err.messageAr,
          hintAr: err.hintAr,
        },
        truncated: false,
        totalSteps: steps.length,
      };
    }

    const fallbackMsg = "حدث خطأ غير متوقع أثناء تحليل الكود.";
    return {
      language,
      steps,
      error: { line: lastLine, messageAr: fallbackMsg },
      truncated: false,
      totalSteps: steps.length,
    };
  }
}
