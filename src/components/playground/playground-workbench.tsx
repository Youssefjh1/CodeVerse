"use client";

import { Code2, RotateCw, TerminalSquare } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  ControlDeck,
  PLAYBACK_SPEEDS,
} from "@/components/playground/control-deck";
import { LessonSelector } from "@/components/playground/lesson-selector";
import { MemoryInspector } from "@/components/playground/memory-inspector";
import { OutputConsole } from "@/components/playground/output-console";
import { StepExplanationBanner } from "@/components/playground/step-explanation-banner";
import { GlassCard } from "@/components/ui/glass-card";
import { simulateCode } from "@/lib/playground/engine/simulate";
import {
  getLessonById,
  getLanguageOption,
  LANGUAGE_OPTIONS,
  PLAYGROUND_LESSONS,
} from "@/lib/playground/lessons";
import { playPlaygroundSound } from "@/lib/playground/sound";
import { cn } from "@/lib/utils";
import type {
  ExecutionStep,
  ExecutionTrace,
  PlaygroundLanguage,
} from "@/types/playground";

const DynamicMonacoCodeEditor = dynamic(
  () =>
    import("@/components/playground/monaco-code-editor").then(
      (mod) => mod.MonacoCodeEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        dir="ltr"
        className="code-ltr flex h-[340px] w-full items-center justify-center rounded-b-2xl bg-[#09090B] text-xs text-slate-muted sm:h-[410px] lg:h-[490px]"
      >
        Loading CodeVerse Neon Editor...
      </div>
    ),
  },
);

function triggerAudioForStep(step: ExecutionStep): void {
  if (step.kind === "error") {
    playPlaygroundSound("error");
    return;
  }
  if (step.kind === "program_end") {
    playPlaygroundSound("complete");
    return;
  }
  if (step.newOutput) {
    playPlaygroundSound("output");
    return;
  }
  if (step.mutatedVariables.length > 0) {
    playPlaygroundSound("mutate");
    return;
  }
  playPlaygroundSound("step");
}

export function PlaygroundWorkbench() {
  const [lessonId, setLessonId] = useState<string>(PLAYGROUND_LESSONS[0].id);
  const [language, setLanguage] = useState<PlaygroundLanguage>("python");
  const [code, setCode] = useState<string>(
    PLAYGROUND_LESSONS[0].codeByLanguage.python,
  );
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedIndex, setSpeedIndex] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [isCodeDirty, setIsCodeDirty] = useState<boolean>(false);

  const activeLesson = getLessonById(lessonId);
  const activeLangOption = getLanguageOption(language);
  const starterCode = activeLesson.codeByLanguage[language];
  const isEditedFromStarter = code !== starterCode;

  const activeStep =
    trace && stepIndex >= 0 && stepIndex < trace.steps.length
      ? trace.steps[stepIndex]
      : null;

  const activeLine =
    activeStep && activeStep.kind !== "error" ? activeStep.line : null;
  const errorLine =
    activeStep && activeStep.kind === "error" ? activeStep.line : null;
  const visibleError =
    activeStep?.kind === "error" ? (trace?.error ?? null) : null;
  const variables = activeStep ? activeStep.variables : [];
  const output = activeStep ? activeStep.output : [];

  const totalSteps = trace && !isCodeDirty ? trace.steps.length : 0;
  const currentStepNumber =
    trace && !isCodeDirty && stepIndex >= 0 ? stepIndex + 1 : 0;

  const canStepBack = Boolean(trace && !isCodeDirty && stepIndex >= 0);
  const canStepForward =
    code.trim().length > 0 &&
    (trace === null ||
      isCodeDirty ||
      (trace.steps.length > 0 && stepIndex < trace.steps.length - 1));
  const canReset = stepIndex >= 0 || trace !== null;

  const compileTrace = (): ExecutionTrace => {
    const compiled = simulateCode(code, language, {
      lineTips: isEditedFromStarter
        ? undefined
        : activeLesson.lineTipsByLanguage[language],
    });
    setTrace(compiled);
    setIsCodeDirty(false);
    return compiled;
  };

  useEffect(() => {
    if (!isPlaying || !trace) return;
    if (stepIndex >= trace.steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const speed = PLAYBACK_SPEEDS[speedIndex] ?? PLAYBACK_SPEEDS[1];
    const timerId = window.setTimeout(() => {
      const nextIdx = stepIndex + 1;
      const nextStep = trace.steps[nextIdx];
      setStepIndex(nextIdx);
      if (soundEnabled && nextStep) {
        triggerAudioForStep(nextStep);
      }
      if (nextIdx >= trace.steps.length - 1) {
        setIsPlaying(false);
      }
    }, speed.delayMs);

    return () => window.clearTimeout(timerId);
  }, [isPlaying, stepIndex, trace, speedIndex, soundEnabled]);

  const handleSelectLesson = (nextLessonId: string) => {
    const nextLesson = getLessonById(nextLessonId);
    setIsPlaying(false);
    setLessonId(nextLesson.id);
    setCode(nextLesson.codeByLanguage[language]);
    setTrace(null);
    setStepIndex(-1);
    setIsCodeDirty(false);
  };

  const handleSelectLanguage = (nextLang: PlaygroundLanguage) => {
    if (nextLang === language) return;
    setIsPlaying(false);
    setLanguage(nextLang);
    setCode(activeLesson.codeByLanguage[nextLang]);
    setTrace(null);
    setStepIndex(-1);
    setIsCodeDirty(false);
  };

  const handleCodeChange = (nextValue: string) => {
    setIsPlaying(false);
    setCode(nextValue);
    setIsCodeDirty(true);
    setStepIndex(-1);
  };

  const handleRestoreStarter = () => {
    setIsPlaying(false);
    setCode(starterCode);
    setTrace(null);
    setStepIndex(-1);
    setIsCodeDirty(false);
  };

  const handleRunAll = () => {
    if (code.trim().length === 0) return;
    const activeTrace =
      trace && !isCodeDirty ? trace : compileTrace();
    if (activeTrace.steps.length === 0) return;

    const startFromZero =
      isCodeDirty ||
      stepIndex < 0 ||
      stepIndex >= activeTrace.steps.length - 1;

    if (startFromZero) {
      setStepIndex(0);
      if (soundEnabled) {
        triggerAudioForStep(activeTrace.steps[0]);
      }
      if (activeTrace.steps.length > 1) {
        setIsPlaying(true);
      }
      return;
    }

    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (code.trim().length === 0) return;
    setIsPlaying(false);
    const activeTrace =
      trace && !isCodeDirty ? trace : compileTrace();
    if (activeTrace.steps.length === 0) return;

    const nextIdx =
      isCodeDirty || stepIndex < 0
        ? 0
        : Math.min(stepIndex + 1, activeTrace.steps.length - 1);
    setStepIndex(nextIdx);
    if (soundEnabled) {
      triggerAudioForStep(activeTrace.steps[nextIdx]);
    }
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setStepIndex((prev) => (prev <= 0 ? -1 : prev - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(-1);
  };

  return (
    <div className="space-y-5">
      {/* Page Hero Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/15 px-3 py-1 text-xs font-extrabold text-cyan-200">
            <TerminalSquare className="h-3.5 w-3.5 text-cyber-cyan" />
            مختبر التنفيذ المرئي
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold text-chalk sm:text-3xl">
            ملعب الكود والمصور التفاعلي
          </h1>
          <p className="mt-1 text-sm text-slate-muted">
            نفّذ الأكواد خطوة بخطوة وشاهد المتغيرات في الذاكرة والمخرجات تتحدث لحظياً.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-obsidian-elevated/80 px-3 py-2 text-xs text-slate-muted sm:self-auto">
          <Code2 className="h-4 w-4 text-cyber-purple" />
          <span>محرك محاكاة آمن فوري</span>
        </div>
      </header>

      {/* 3 Pre-loaded Interactive Lessons */}
      <LessonSelector
        lessons={PLAYGROUND_LESSONS}
        activeLessonId={activeLesson.id}
        onSelectLesson={handleSelectLesson}
      />

      {/* Playback Controls & Speed Slider */}
      <ControlDeck
        isPlaying={isPlaying}
        canStepBack={canStepBack}
        canStepForward={canStepForward}
        canReset={canReset}
        currentStepNumber={currentStepNumber}
        totalSteps={totalSteps}
        speedIndex={speedIndex}
        onRunAll={handleRunAll}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onSpeedChange={setSpeedIndex}
      />

      {/* Main Split Workbench: Editor (7 cols) + Visualizer Stack (5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Code Editor Pane */}
        <GlassCard className="overflow-hidden border-cyber-purple/25 lg:col-span-7">
          {/* Editor Top Chrome */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-obsidian-elevated/95 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span
                dir="ltr"
                className="code-ltr rounded-lg border border-cyber-cyan/35 bg-obsidian px-2.5 py-1 text-xs font-bold text-cyan-200"
              >
                {activeLangOption.fileName}
              </span>

              {isEditedFromStarter ? (
                <button
                  type="button"
                  onClick={handleRestoreStarter}
                  className="inline-flex items-center gap-1 rounded-lg border border-cyber-purple/40 bg-cyber-purple/15 px-2.5 py-1 text-xs font-bold text-purple-200 transition hover:bg-cyber-purple/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan"
                >
                  <RotateCw className="h-3 w-3" />
                  استعادة كود الدرس
                </button>
              ) : null}
            </div>

            {/* Language Selector */}
            <div
              role="group"
              aria-label="اختيار لغة البرمجة"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-obsidian p-1"
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const selected = opt.id === language;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleSelectLanguage(opt.id)}
                    className={cn(
                      "code-ltr rounded-lg px-3 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan",
                      selected
                        ? "border border-cyber-cyan/60 bg-cyber-cyan/20 text-cyan-100 shadow-neon-cyan"
                        : "border border-transparent text-slate-muted hover:text-chalk",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <DynamicMonacoCodeEditor
            value={code}
            language={language}
            activeLine={activeLine}
            errorLine={errorLine}
            onChange={handleCodeChange}
          />
        </GlassCard>

        {/* Live Visualizer Column */}
        <div className="space-y-4 lg:col-span-5">
          <StepExplanationBanner
            activeStep={activeStep}
            lessonGoalAr={activeLesson.goalAr}
          />

          <MemoryInspector variables={variables} stepIndex={stepIndex} />

          <OutputConsole
            output={output}
            activeStepIndex={stepIndex}
            error={visibleError}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}
