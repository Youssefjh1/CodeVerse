export type PlaygroundLanguage = "python" | "javascript" | "cpp";

export type VariableType = "int" | "float" | "string" | "boolean" | "array";

export type VariableStatus = "created" | "updated" | "unchanged";

export type RuntimeScalar = number | string | boolean;

export type RuntimeValue = RuntimeScalar | RuntimeScalar[];

export interface VariableSnapshot {
  name: string;
  type: VariableType;
  typeLabelAr: string;
  value: string;
  rawValue: RuntimeValue;
  previousValue?: string;
  status: VariableStatus;
}

export interface OutputEntry {
  id: string;
  stepIndex: number;
  line: number;
  text: string;
  kind: "stdout" | "error" | "system";
}

export type StepKind =
  | "assign"
  | "condition"
  | "loop_init"
  | "loop_check"
  | "loop_update"
  | "output"
  | "program_end"
  | "error";

export interface ExecutionStep {
  stepIndex: number;
  line: number;
  kind: StepKind;
  codeSnippet: string;
  explanationAr: string;
  lessonTipAr?: string;
  conditionResult?: boolean;
  variables: VariableSnapshot[];
  mutatedVariables: string[];
  output: OutputEntry[];
  newOutput?: OutputEntry;
}

export interface ExecutionError {
  line: number;
  messageAr: string;
  hintAr?: string;
}

export interface ExecutionTrace {
  language: PlaygroundLanguage;
  steps: ExecutionStep[];
  error: ExecutionError | null;
  truncated: boolean;
  totalSteps: number;
}

export interface PlaygroundLesson {
  id: string;
  titleAr: string;
  subtitleAr: string;
  levelLabelAr: string;
  conceptTagAr: string;
  goalAr: string;
  codeByLanguage: Record<PlaygroundLanguage, string>;
  lineTipsByLanguage: Record<PlaygroundLanguage, Record<number, string>>;
}
