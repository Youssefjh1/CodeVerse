import type {
  PlaygroundLanguage,
  RuntimeScalar,
  RuntimeValue,
  VariableType,
} from "@/types/playground";

export class EngineError extends Error {
  readonly line: number;
  readonly messageAr: string;
  readonly hintAr?: string;

  constructor(line: number, messageAr: string, hintAr?: string) {
    super(messageAr);
    this.name = "EngineError";
    this.line = line;
    this.messageAr = messageAr;
    this.hintAr = hintAr;
  }
}

type TemplateSegment =
  | { kind: "text"; value: string }
  | { kind: "expr"; source: string };

type Token =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "template"; segments: TemplateSegment[] }
  | { kind: "boolean"; value: boolean }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "lbracket" }
  | { kind: "rbracket" }
  | { kind: "comma" }
  | { kind: "dot" };

function unescapeChar(ch: string): string {
  switch (ch) {
    case "n":
      return "\n";
    case "t":
      return "\t";
    case "r":
      return "\r";
    case "\\":
      return "\\";
    case '"':
      return '"';
    case "'":
      return "'";
    case "`":
      return "`";
    default:
      return ch;
  }
}

function readQuotedString(
  source: string,
  startQuoteIndex: number,
  quoteChar: string,
  line: number,
): { value: string; nextIndex: number } {
  let out = "";
  let i = startQuoteIndex + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      if (i + 1 < source.length) {
        out += unescapeChar(source[i + 1]);
        i += 2;
        continue;
      }
    }
    if (ch === quoteChar) {
      return { value: out, nextIndex: i + 1 };
    }
    out += ch;
    i += 1;
  }
  throw new EngineError(
    line,
    "علامة التنصيص غير مغلقة في النص.",
    "تأكد من إغلاق النص بنفس علامة التنصيص التي بدأ بها.",
  );
}

function extractBraceExpression(
  source: string,
  openBraceIndex: number,
  line: number,
): { exprSource: string; closeBraceIndex: number } {
  let depth = 1;
  let i = openBraceIndex + 1;
  let activeQuote: string | null = null;

  while (i < source.length) {
    const ch = source[i];
    if (activeQuote) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === activeQuote) {
        activeQuote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      activeQuote = ch;
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return {
          exprSource: source.slice(openBraceIndex + 1, i),
          closeBraceIndex: i,
        };
      }
    }
    i += 1;
  }

  throw new EngineError(
    line,
    "قوس التضمين `{` غير مغلق داخل النص المركب.",
    "أغلق التعبير داخل النص باستخدام `}`.",
  );
}

function readPythonFString(
  source: string,
  startQuoteIndex: number,
  quoteChar: string,
  line: number,
): { segments: TemplateSegment[]; nextIndex: number } {
  const segments: TemplateSegment[] = [];
  let buffer = "";
  let i = startQuoteIndex + 1;

  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      if (i + 1 < source.length) {
        buffer += unescapeChar(source[i + 1]);
        i += 2;
        continue;
      }
    }
    if (ch === quoteChar) {
      if (buffer.length > 0) {
        segments.push({ kind: "text", value: buffer });
      }
      return { segments, nextIndex: i + 1 };
    }
    if (ch === "{") {
      if (source[i + 1] === "{") {
        buffer += "{";
        i += 2;
        continue;
      }
      if (buffer.length > 0) {
        segments.push({ kind: "text", value: buffer });
        buffer = "";
      }
      const { exprSource, closeBraceIndex } = extractBraceExpression(source, i, line);
      segments.push({ kind: "expr", source: exprSource });
      i = closeBraceIndex + 1;
      continue;
    }
    if (ch === "}" && source[i + 1] === "}") {
      buffer += "}";
      i += 2;
      continue;
    }
    buffer += ch;
    i += 1;
  }

  throw new EngineError(line, "علامة التنصيص غير مغلقة في النص f-string.");
}

function readJsTemplateLiteral(
  source: string,
  startTickIndex: number,
  line: number,
): { segments: TemplateSegment[]; nextIndex: number } {
  const segments: TemplateSegment[] = [];
  let buffer = "";
  let i = startTickIndex + 1;

  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      if (i + 1 < source.length) {
        buffer += unescapeChar(source[i + 1]);
        i += 2;
        continue;
      }
    }
    if (ch === "`") {
      if (buffer.length > 0) {
        segments.push({ kind: "text", value: buffer });
      }
      return { segments, nextIndex: i + 1 };
    }
    if (ch === "$" && source[i + 1] === "{") {
      if (buffer.length > 0) {
        segments.push({ kind: "text", value: buffer });
        buffer = "";
      }
      const { exprSource, closeBraceIndex } = extractBraceExpression(
        source,
        i + 1,
        line,
      );
      segments.push({ kind: "expr", source: exprSource });
      i = closeBraceIndex + 1;
      continue;
    }
    buffer += ch;
    i += 1;
  }

  throw new EngineError(line, "علامة التنصيص المائلة `` غير مغلقة.");
}

const THREE_CHAR_OPS = new Set(["===", "!=="]);
const TWO_CHAR_OPS = new Set([
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "//",
  "**",
]);
const ONE_CHAR_OPS = new Set(["+", "-", "*", "/", "%", "<", ">", "!"]);

function tokenize(
  source: string,
  language: PlaygroundLanguage,
  line: number,
): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    // Python f-string: f"..." or f'...'
    if (
      language === "python" &&
      (ch === "f" || ch === "F") &&
      (source[i + 1] === '"' || source[i + 1] === "'")
    ) {
      const { segments, nextIndex } = readPythonFString(
        source,
        i + 1,
        source[i + 1],
        line,
      );
      tokens.push({ kind: "template", segments });
      i = nextIndex;
      continue;
    }

    // Quoted strings
    if (ch === '"' || ch === "'") {
      const { value, nextIndex } = readQuotedString(source, i, ch, line);
      tokens.push({ kind: "string", value });
      i = nextIndex;
      continue;
    }

    // JS template literal
    if (ch === "`" && language === "javascript") {
      const { segments, nextIndex } = readJsTemplateLiteral(source, i, line);
      tokens.push({ kind: "template", segments });
      i = nextIndex;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let end = i;
      let sawDot = false;
      while (end < source.length) {
        const c = source[end];
        if (c === "." && !sawDot) {
          sawDot = true;
          end += 1;
        } else if (/[0-9]/.test(c)) {
          end += 1;
        } else {
          break;
        }
      }
      const numText = source.slice(i, end);
      const parsed = Number(numText);
      if (Number.isNaN(parsed)) {
        throw new EngineError(line, `رقم غير صالح: "${numText}".`);
      }
      tokens.push({ kind: "number", value: parsed });
      i = end;
      continue;
    }

    // Identifiers and keywords
    if (/[A-Za-z_]/.test(ch)) {
      let end = i + 1;
      while (end < source.length && /[A-Za-z0-9_]/.test(source[end])) {
        end += 1;
      }
      const word = source.slice(i, end);
      if (language === "python") {
        if (word === "True") {
          tokens.push({ kind: "boolean", value: true });
        } else if (word === "False") {
          tokens.push({ kind: "boolean", value: false });
        } else if (word === "and" || word === "or" || word === "not") {
          tokens.push({ kind: "op", value: word });
        } else {
          tokens.push({ kind: "ident", value: word });
        }
      } else {
        if (word === "true") {
          tokens.push({ kind: "boolean", value: true });
        } else if (word === "false") {
          tokens.push({ kind: "boolean", value: false });
        } else {
          tokens.push({ kind: "ident", value: word });
        }
      }
      i = end;
      continue;
    }

    // Multi-char & single-char operators
    const three = source.slice(i, i + 3);
    if (THREE_CHAR_OPS.has(three)) {
      tokens.push({ kind: "op", value: three });
      i += 3;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ kind: "op", value: two });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(ch)) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }

    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      i += 1;
      continue;
    }
    if (ch === "[") {
      tokens.push({ kind: "lbracket" });
      i += 1;
      continue;
    }
    if (ch === "]") {
      tokens.push({ kind: "rbracket" });
      i += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma" });
      i += 1;
      continue;
    }
    if (ch === ".") {
      tokens.push({ kind: "dot" });
      i += 1;
      continue;
    }

    throw new EngineError(
      line,
      `رمز غير مدعوم في التعبير: "${ch}".`,
      "استخدم الأرقام والنصوص والمتغيرات والعمليات الحسابية والمنطقية القياسية.",
    );
  }

  return tokens;
}

export function isTruthy(value: RuntimeValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  return value.length > 0;
}

function asNumber(value: RuntimeValue, op: string, line: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  throw new EngineError(
    line,
    `العملية "${op}" تتطلب قيماً رقمية، ولكن تم تمرير قيمة نصية أو قائمة.`,
  );
}

function valuesEqual(left: RuntimeValue, right: RuntimeValue, strict: boolean): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    return left.every((item, idx) => item === right[idx]);
  }
  if (strict) {
    return left === right;
  }
  if (typeof left === "boolean" && typeof right === "number") {
    return (left ? 1 : 0) === right;
  }
  if (typeof left === "number" && typeof right === "boolean") {
    return left === (right ? 1 : 0);
  }
  return left === right;
}

function invokeBuiltin(
  fnName: string,
  args: RuntimeValue[],
  line: number,
  language: PlaygroundLanguage,
): RuntimeValue {
  switch (fnName) {
    case "len": {
      if (args.length !== 1) {
        throw new EngineError(line, "الدالة len() تقبل معاملاً واحداً فقط.");
      }
      const target = args[0];
      if (typeof target === "string" || Array.isArray(target)) {
        return target.length;
      }
      throw new EngineError(line, "الدالة len() تعمل على النصوص والقوائم فقط.");
    }
    case "str":
    case "String":
      if (args.length !== 1) {
        throw new EngineError(line, `الدالة ${fnName}() تتطلب معاملاً واحداً.`);
      }
      return formatForOutput(args[0], language);
    case "int":
    case "parseInt": {
      if (args.length < 1) {
        throw new EngineError(line, `الدالة ${fnName}() تتطلب معاملاً.`);
      }
      const v = Number(args[0]);
      if (Number.isNaN(v)) {
        throw new EngineError(line, "تعذر تحويل القيمة إلى عدد صحيح.");
      }
      return Math.trunc(v);
    }
    case "float":
    case "Number": {
      if (args.length !== 1) {
        throw new EngineError(line, `الدالة ${fnName}() تتطلب معاملاً واحداً.`);
      }
      const v = Number(args[0]);
      if (Number.isNaN(v)) {
        throw new EngineError(line, "تعذر تحويل القيمة إلى رقم.");
      }
      return v;
    }
    case "Boolean":
      return args.length > 0 ? isTruthy(args[0]) : false;
    case "abs":
    case "Math.abs":
      if (args.length !== 1) {
        throw new EngineError(line, "الدالة abs() تتطلب رقماً واحداً.");
      }
      return Math.abs(asNumber(args[0], "abs", line));
    case "Math.floor":
      if (args.length !== 1) {
        throw new EngineError(line, "الدالة Math.floor() تتطلب رقماً واحداً.");
      }
      return Math.floor(asNumber(args[0], "Math.floor", line));
    case "min":
    case "Math.min": {
      if (args.length === 0) {
        throw new EngineError(line, "الدالة min() تتطلب رقماً واحداً على الأقل.");
      }
      const nums = args.map((item) => asNumber(item, "min", line));
      return Math.min(...nums);
    }
    case "max":
    case "Math.max": {
      if (args.length === 0) {
        throw new EngineError(line, "الدالة max() تتطلب رقماً واحداً على الأقل.");
      }
      const nums = args.map((item) => asNumber(item, "max", line));
      return Math.max(...nums);
    }
    default:
      throw new EngineError(
        line,
        `الدالة "${fnName}" غير مدعومة في المحاكي التعليمي حالياً.`,
      );
  }
}

class ExprParser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly env: Map<string, RuntimeValue>,
    private readonly language: PlaygroundLanguage,
    private readonly line: number,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const tok = this.tokens[this.pos];
    this.pos += 1;
    return tok;
  }

  private matchOp(ops: string[]): string | null {
    const tok = this.peek();
    if (tok && tok.kind === "op" && ops.includes(tok.value)) {
      this.pos += 1;
      return tok.value;
    }
    return null;
  }

  parse(): RuntimeValue {
    if (this.tokens.length === 0) {
      throw new EngineError(this.line, "تعبير فارغ غير صالح.");
    }
    const val = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new EngineError(
        this.line,
        "صيغة التعبير غير مكتملة أو تحتوي على رموز زائدة.",
      );
    }
    return val;
  }

  private parseOr(): RuntimeValue {
    let left = this.parseAnd();
    while (this.matchOp(["or", "||"])) {
      const right = this.parseAnd();
      left = isTruthy(left) || isTruthy(right);
    }
    return left;
  }

  private parseAnd(): RuntimeValue {
    let left = this.parseEquality();
    while (this.matchOp(["and", "&&"])) {
      const right = this.parseEquality();
      left = isTruthy(left) && isTruthy(right);
    }
    return left;
  }

  private parseEquality(): RuntimeValue {
    let left = this.parseRelational();
    let op = this.matchOp(["==", "!=", "===", "!=="]);
    while (op) {
      const right = this.parseRelational();
      const strict = op === "===" || op === "!==";
      const eq = valuesEqual(left, right, strict);
      left = op === "==" || op === "===" ? eq : !eq;
      op = this.matchOp(["==", "!=", "===", "!=="]);
    }
    return left;
  }

  private parseRelational(): RuntimeValue {
    let left = this.parseAdditive();
    let op = this.matchOp(["<", "<=", ">", ">="]);
    while (op) {
      const right = this.parseAdditive();
      if (typeof left === "string" && typeof right === "string") {
        if (op === "<") left = left < right;
        else if (op === "<=") left = left <= right;
        else if (op === ">") left = left > right;
        else left = left >= right;
      } else {
        const a = asNumber(left, op, this.line);
        const b = asNumber(right, op, this.line);
        if (op === "<") left = a < b;
        else if (op === "<=") left = a <= b;
        else if (op === ">") left = a > b;
        else left = a >= b;
      }
      op = this.matchOp(["<", "<=", ">", ">="]);
    }
    return left;
  }

  private parseAdditive(): RuntimeValue {
    let left = this.parseMultiplicative();
    let op = this.matchOp(["+", "-"]);
    while (op) {
      const right = this.parseMultiplicative();
      if (op === "+") {
        if (typeof left === "string" || typeof right === "string") {
          left =
            formatForOutput(left, this.language) +
            formatForOutput(right, this.language);
        } else {
          left = asNumber(left, "+", this.line) + asNumber(right, "+", this.line);
        }
      } else {
        left = asNumber(left, "-", this.line) - asNumber(right, "-", this.line);
      }
      op = this.matchOp(["+", "-"]);
    }
    return left;
  }

  private parseMultiplicative(): RuntimeValue {
    let left = this.parsePower();
    let op = this.matchOp(["*", "/", "//", "%"]);
    while (op) {
      const right = this.parsePower();
      if (op === "*") {
        if (typeof left === "string" && typeof right === "number") {
          left = left.repeat(Math.max(0, Math.trunc(right)));
        } else {
          left = asNumber(left, "*", this.line) * asNumber(right, "*", this.line);
        }
      } else {
        const a = asNumber(left, op, this.line);
        const b = asNumber(right, op, this.line);
        if (b === 0) {
          throw new EngineError(
            this.line,
            "لا يمكن القسمة أو أخذ باقي القسمة على صفر.",
            "تأكد من أن قيمة المقسوم عليه لا تساوي 0.",
          );
        }
        if (op === "//") {
          left = Math.floor(a / b);
        } else if (op === "/") {
          if (
            this.language === "cpp" &&
            Number.isInteger(a) &&
            Number.isInteger(b)
          ) {
            left = Math.trunc(a / b);
          } else {
            left = a / b;
          }
        } else {
          left = a % b;
        }
      }
      op = this.matchOp(["*", "/", "//", "%"]);
    }
    return left;
  }

  private parsePower(): RuntimeValue {
    const base = this.parseUnary();
    if (this.matchOp(["**"])) {
      const exp = this.parsePower();
      return Math.pow(
        asNumber(base, "**", this.line),
        asNumber(exp, "**", this.line),
      );
    }
    return base;
  }

  private parseUnary(): RuntimeValue {
    const op = this.matchOp(["-", "+", "!", "not"]);
    if (op) {
      const target = this.parseUnary();
      if (op === "!" || op === "not") {
        return !isTruthy(target);
      }
      if (op === "-") {
        return -asNumber(target, "-", this.line);
      }
      return +asNumber(target, "+", this.line);
    }
    return this.parsePostfix();
  }

  private parsePostfix(): RuntimeValue {
    const first = this.peek();

    // Handle Math.floor(...) / Math.max(...) style dotted calls or standard calls
    if (first && first.kind === "ident") {
      const nextTok = this.tokens[this.pos + 1];
      if (nextTok && nextTok.kind === "lparen") {
        this.consume(); // ident
        const args = this.parseCallArgs();
        let result = invokeBuiltin(first.value, args, this.line, this.language);
        result = this.parseTrailingAccessors(result);
        return result;
      }

      if (
        nextTok &&
        nextTok.kind === "dot" &&
        this.tokens[this.pos + 2]?.kind === "ident" &&
        this.tokens[this.pos + 3]?.kind === "lparen"
      ) {
        const ns = this.consume() as { kind: "ident"; value: string };
        this.consume(); // dot
        const method = this.consume() as { kind: "ident"; value: string };
        const args = this.parseCallArgs();
        const result = invokeBuiltin(
          `${ns.value}.${method.value}`,
          args,
          this.line,
          this.language,
        );
        return this.parseTrailingAccessors(result);
      }
    }

    const base = this.parsePrimary();
    return this.parseTrailingAccessors(base);
  }

  private parseCallArgs(): RuntimeValue[] {
    this.consume(); // lparen
    const args: RuntimeValue[] = [];
    if (this.peek()?.kind !== "rparen") {
      args.push(this.parseOr());
      while (this.peek()?.kind === "comma") {
        this.consume();
        args.push(this.parseOr());
      }
    }
    const close = this.peek();
    if (!close || close.kind !== "rparen") {
      throw new EngineError(this.line, "قوس الدالة `)` غير مغلق.");
    }
    this.consume();
    return args;
  }

  private parseTrailingAccessors(initialValue: RuntimeValue): RuntimeValue {
    let value = initialValue;
    while (this.peek()) {
      const next = this.peek();
      if (next?.kind === "lbracket") {
        this.consume();
        const idxVal = this.parseOr();
        const close = this.peek();
        if (!close || close.kind !== "rbracket") {
          throw new EngineError(this.line, "قوس الفهرس `]` غير مغلق.");
        }
        this.consume();

        const index = asNumber(idxVal, "[]", this.line);
        if (!Array.isArray(value) && typeof value !== "string") {
          throw new EngineError(
            this.line,
            "لا يمكن استخدام الفهرس `[ ]` إلا مع القوائم أو النصوص.",
          );
        }
        const resolvedIdx = index < 0 && this.language === "python" ? value.length + index : index;
        if (!Number.isInteger(resolvedIdx) || resolvedIdx < 0 || resolvedIdx >= value.length) {
          throw new EngineError(
            this.line,
            `الفهرس ${index} خارج حدود القائمة أو النص.`,
          );
        }
        value = value[resolvedIdx];
        continue;
      }

      if (next?.kind === "dot") {
        this.consume();
        const prop = this.peek();
        if (!prop || prop.kind !== "ident") {
          throw new EngineError(this.line, "اسم الخاصية غير صالح بعد النقطة.");
        }
        this.consume();
        if (prop.value === "length") {
          if (typeof value === "string" || Array.isArray(value)) {
            value = value.length;
            continue;
          }
          throw new EngineError(
            this.line,
            "الخاصية `.length` متاحة للنصوص والمصفوفات فقط.",
          );
        }
        throw new EngineError(
          this.line,
          `الخاصية ".${prop.value}" غير مدعومة في المحاكي.`,
        );
      }
      break;
    }
    return value;
  }

  private parsePrimary(): RuntimeValue {
    const tok = this.peek();
    if (!tok) {
      throw new EngineError(this.line, "تعبير غير مكتمل.");
    }

    if (tok.kind === "number" || tok.kind === "string" || tok.kind === "boolean") {
      this.consume();
      return tok.value;
    }

    if (tok.kind === "template") {
      this.consume();
      let rendered = "";
      for (const seg of tok.segments) {
        if (seg.kind === "text") {
          rendered += seg.value;
        } else {
          const val = evaluateExpression(
            seg.source,
            this.env,
            this.language,
            this.line,
          );
          rendered += formatForOutput(val, this.language);
        }
      }
      return rendered;
    }

    if (tok.kind === "ident") {
      this.consume();
      if (!this.env.has(tok.value)) {
        throw new EngineError(
          this.line,
          `المتغير "${tok.value}" غير معرّف قبل استخدامه.`,
          "تأكد من إسناد قيمة للمتغير أولاً أو من صحة كتابة اسمه.",
        );
      }
      return this.env.get(tok.value)!;
    }

    if (tok.kind === "lparen") {
      this.consume();
      const inner = this.parseOr();
      const close = this.peek();
      if (!close || close.kind !== "rparen") {
        throw new EngineError(this.line, "قوس التعبير `)` غير مغلق.");
      }
      this.consume();
      return inner;
    }

    if (tok.kind === "lbracket") {
      this.consume();
      const items: RuntimeScalar[] = [];
      if (this.peek()?.kind !== "rbracket") {
        while (true) {
          const item = this.parseOr();
          if (Array.isArray(item)) {
            throw new EngineError(
              this.line,
              "القوائم المتداخلة غير مدعومة في عارض الذاكرة المبسط.",
            );
          }
          items.push(item);
          if (this.peek()?.kind === "comma") {
            this.consume();
            if (this.peek()?.kind === "rbracket") break;
            continue;
          }
          break;
        }
      }
      const close = this.peek();
      if (!close || close.kind !== "rbracket") {
        throw new EngineError(this.line, "قوس القائمة `]` غير مغلق.");
      }
      this.consume();
      return items;
    }

    throw new EngineError(this.line, "تعبير برمجي غير مفهوم عند هذا الرمز.");
  }
}

export function evaluateExpression(
  source: string,
  env: Map<string, RuntimeValue>,
  language: PlaygroundLanguage,
  line: number,
): RuntimeValue {
  const trimmed = source.trim();
  if (!trimmed) {
    throw new EngineError(line, "تم تمرير تعبير فارغ.");
  }
  const tokens = tokenize(trimmed, language, line);
  const parser = new ExprParser(tokens, env, language, line);
  return parser.parse();
}

export function formatRuntimeValue(
  value: RuntimeValue,
  language: PlaygroundLanguage,
): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "boolean") {
    return language === "python"
      ? value
        ? "True"
        : "False"
      : value
        ? "true"
        : "false";
  }
  if (typeof value === "number") {
    if (Object.is(value, -0)) return "0";
    return Number.isInteger(value)
      ? String(value)
      : String(Number(value.toFixed(4)));
  }
  return `[${value.map((item) => formatRuntimeValue(item, language)).join(", ")}]`;
}

export function formatForOutput(
  value: RuntimeValue,
  language: PlaygroundLanguage,
): string {
  if (typeof value === "string") {
    return value;
  }
  return formatRuntimeValue(value, language);
}

export function classifyVariableType(value: RuntimeValue): {
  type: VariableType;
  typeLabelAr: string;
} {
  if (typeof value === "boolean") {
    return { type: "boolean", typeLabelAr: "منطقي" };
  }
  if (typeof value === "string") {
    return { type: "string", typeLabelAr: "نص" };
  }
  if (Array.isArray(value)) {
    return { type: "array", typeLabelAr: "قائمة" };
  }
  if (Number.isInteger(value)) {
    return { type: "int", typeLabelAr: "عدد صحيح" };
  }
  return { type: "float", typeLabelAr: "عدد عشري" };
}
