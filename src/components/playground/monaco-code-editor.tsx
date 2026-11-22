"use client";

import Editor, {
  loader,
  type BeforeMount,
  type OnMount,
} from "@monaco-editor/react";
import type { editor as MonacoEditorTypes } from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { getLanguageOption } from "@/lib/playground/lessons";
import type { PlaygroundLanguage } from "@/types/playground";

if (typeof window !== "undefined") {
  loader.config({ paths: { vs: `${window.location.origin}/monaco/vs` } });
}

export interface MonacoCodeEditorProps {
  value: string;
  language: PlaygroundLanguage;
  activeLine: number | null;
  errorLine: number | null;
  onChange: (nextValue: string) => void;
}

export function MonacoCodeEditor({
  value,
  language,
  activeLine,
  errorLine,
  onChange,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<MonacoEditorTypes.IStandaloneCodeEditor | null>(
    null,
  );
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef =
    useRef<MonacoEditorTypes.IEditorDecorationsCollection | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const languageOption = getLanguageOption(language);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("codeverse-neon", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748B", fontStyle: "italic" },
        { token: "keyword", foreground: "C084FC", fontStyle: "bold" },
        { token: "string", foreground: "34D399" },
        { token: "number", foreground: "F472B6" },
        { token: "delimiter", foreground: "94A3B8" },
        { token: "identifier", foreground: "F4F4F8" },
        { token: "type", foreground: "22D3EE" },
      ],
      colors: {
        "editor.background": "#09090B",
        "editor.foreground": "#F4F4F8",
        "editor.lineHighlightBackground": "#14182870",
        "editorCursor.foreground": "#06B6D4",
        "editor.selectionBackground": "#8B5CF645",
        "editorLineNumber.foreground": "#525B7A",
        "editorLineNumber.activeForeground": "#06B6D4",
        "editorGutter.background": "#09090B",
        "editorWidget.background": "#0D0F1A",
        "editorWidget.border": "#8B5CF640",
      },
    });
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection([]);
    monaco.editor.setTheme("codeverse-neon");
    setIsEditorReady(true);
  };

  useEffect(() => {
    if (!isEditorReady) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = decorationsRef.current;
    if (!editor || !monaco || !decorations) return;

    const nextDecorations: MonacoEditorTypes.IModelDeltaDecoration[] = [];

    if (activeLine !== null && activeLine > 0) {
      nextDecorations.push({
        range: new monaco.Range(activeLine, 1, activeLine, 1),
        options: {
          isWholeLine: true,
          className: "codeverse-active-line",
          linesDecorationsClassName: "codeverse-active-gutter",
        },
      });
    }

    if (errorLine !== null && errorLine > 0) {
      nextDecorations.push({
        range: new monaco.Range(errorLine, 1, errorLine, 1),
        options: {
          isWholeLine: true,
          className: "codeverse-error-line",
          linesDecorationsClassName: "codeverse-error-gutter",
        },
      });
    }

    decorations.set(nextDecorations);

    const targetLine = activeLine ?? errorLine;
    if (targetLine !== null && targetLine > 0) {
      editor.revealLineInCenterIfOutsideViewport(targetLine);
    }
  }, [isEditorReady, activeLine, errorLine, language]);

  return (
    <div
      dir="ltr"
      data-testid="monaco-editor-shell"
      data-active-line={activeLine ?? ""}
      data-error-line={errorLine ?? ""}
      data-language={language}
      className="code-ltr h-[340px] w-full overflow-hidden rounded-b-2xl bg-[#09090B] sm:h-[410px] lg:h-[490px]"
    >
      <Editor
        height="100%"
        language={languageOption.monacoLanguage}
        theme="codeverse-neon"
        value={value}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-[#09090B] text-xs text-slate-muted">
            جاري تهيئة محرر CodeVerse...
          </div>
        }
        options={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
          fontSize: 14,
          lineHeight: 23,
          fontLigatures: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          glyphMargin: false,
          lineDecorationsWidth: 18,
          renderLineHighlight: "line",
          padding: { top: 14, bottom: 14 },
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
