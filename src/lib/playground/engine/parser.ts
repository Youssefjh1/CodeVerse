import { EngineError } from "@/lib/playground/engine/expr";
import type { PlaygroundLanguage } from "@/types/playground";

export type CompoundOp = "+=" | "-=" | "*=" | "/=" | "%=";

export type Stmt =
  | {
      kind: "assign";
      line: number;
      sourceText: string;
      name: string;
      expr: string;
      isDeclaration: boolean;
    }
  | {
      kind: "compound_assign";
      line: number;
      sourceText: string;
      name: string;
      operator: CompoundOp;
      expr: string;
    }
  | {
      kind: "inc_dec";
      line: number;
      sourceText: string;
      name: string;
      delta: 1 | -1;
    }
  | {
      kind: "print";
      line: number;
      sourceText: string;
      exprs: string[];
      joinWithSpace: boolean;
    }
  | {
      kind: "if";
      line: number;
      sourceText: string;
      branches: Array<{
        condition: string | null;
        line: number;
        sourceText: string;
        body: Stmt[];
      }>;
    }
  | {
      kind: "for_range";
      line: number;
      sourceText: string;
      iterator: string;
      rangeArgs: string[] | null;
      iterableExpr: string | null;
      body: Stmt[];
    }
  | {
      kind: "for_cstyle";
      line: number;
      sourceText: string;
      init: Stmt | null;
      condition: string | null;
      update: Stmt | null;
      body: Stmt[];
    }
  | {
      kind: "while";
      line: number;
      sourceText: string;
      condition: string;
      body: Stmt[];
    }
  | { kind: "break"; line: number; sourceText: string }
  | { kind: "continue"; line: number; sourceText: string }
  | { kind: "return"; line: number; sourceText: string; expr: string | null };

const VALID_IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function splitTopLevelArgs(
  input: string,
  separator = ",",
): string[] {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let quote: string | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      current += ch;
      if (ch === "\\" && i + 1 < input.length) {
        current += input[i + 1];
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") parenDepth += 1;
    else if (ch === ")") parenDepth -= 1;
    else if (ch === "[") bracketDepth += 1;
    else if (ch === "]") bracketDepth -= 1;
    else if (ch === "{") braceDepth += 1;
    else if (ch === "}") braceDepth -= 1;

    if (
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      input.slice(i, i + separator.length) === separator
    ) {
      parts.push(current.trim());
      current = "";
      i += separator.length - 1;
      continue;
    }

    current += ch;
  }

  if (current.trim().length > 0 || parts.length > 0) {
    parts.push(current.trim());
  }
  return parts;
}

function findTopLevelEqualsIndex(text: string): number {
  let paren = 0;
  let bracket = 0;
  let brace = 0;
  let quote: string | null = null;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && i + 1 < text.length) {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") paren += 1;
    else if (ch === ")") paren -= 1;
    else if (ch === "[") bracket += 1;
    else if (ch === "]") bracket -= 1;
    else if (ch === "{") brace += 1;
    else if (ch === "}") brace -= 1;

    if (paren === 0 && bracket === 0 && brace === 0 && ch === "=") {
      const prev = text[i - 1] ?? "";
      const next = text[i + 1] ?? "";
      if (
        prev !== "=" &&
        prev !== "!" &&
        prev !== "<" &&
        prev !== ">" &&
        prev !== "+" &&
        prev !== "-" &&
        prev !== "*" &&
        prev !== "/" &&
        prev !== "%" &&
        next !== "="
      ) {
        return i;
      }
    }
  }
  return -1;
}

function findTopLevelCompoundOp(
  text: string,
): { operator: CompoundOp; index: number } | null {
  const ops: CompoundOp[] = ["+=", "-=", "*=", "/=", "%="];
  let paren = 0;
  let bracket = 0;
  let quote: string | null = null;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && i + 1 < text.length) {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "(") paren += 1;
    else if (ch === ")") paren -= 1;
    else if (ch === "[") bracket += 1;
    else if (ch === "]") bracket -= 1;

    if (paren === 0 && bracket === 0) {
      const two = text.slice(i, i + 2) as CompoundOp;
      if (ops.includes(two)) {
        return { operator: two, index: i };
      }
    }
  }
  return null;
}

/* ==========================================================================
   Python Parser
   ========================================================================== */

interface PyLine {
  line: number;
  indent: number;
  text: string;
}

function stripPythonComment(raw: string): string {
  let quote: string | null = null;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (quote) {
      if (ch === "\\" && i + 1 < raw.length) {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#") {
      return raw.slice(0, i);
    }
  }
  return raw;
}

function tokenizePythonLines(code: string): PyLine[] {
  const rawLines = code.split(/\r?\n/);
  const result: PyLine[] = [];

  for (let i = 0; i < rawLines.length; i += 1) {
    const expanded = rawLines[i].replace(/\t/g, "    ");
    const withoutComment = stripPythonComment(expanded);
    const trimmed = withoutComment.trim();
    if (!trimmed) continue;

    const indent = withoutComment.length - withoutComment.trimStart().length;
    result.push({
      line: i + 1,
      indent,
      text: trimmed,
    });
  }
  return result;
}

function parsePythonSimple(text: string, line: number): Stmt {
  if (text === "break") return { kind: "break", line, sourceText: text };
  if (text === "continue") return { kind: "continue", line, sourceText: text };
  if (text === "return" || text.startsWith("return ")) {
    const expr = text === "return" ? null : text.slice(7).trim();
    return { kind: "return", line, sourceText: text, expr };
  }
  if (text === "pass") {
    return { kind: "continue", line, sourceText: text };
  }

  // print(...)
  const printMatch = /^print\s*\(([\s\S]*)\)$/.exec(text);
  if (printMatch) {
    const inner = printMatch[1].trim();
    const exprs = inner.length === 0 ? [] : splitTopLevelArgs(inner, ",");
    return {
      kind: "print",
      line,
      sourceText: text,
      exprs,
      joinWithSpace: true,
    };
  }

  const compound = findTopLevelCompoundOp(text);
  if (compound) {
    const name = text.slice(0, compound.index).trim();
    const expr = text.slice(compound.index + 2).trim();
    if (!VALID_IDENT_RE.test(name)) {
      throw new EngineError(line, `اسم متغير غير صالح: "${name}".`);
    }
    if (!expr) {
      throw new EngineError(line, "القيمة المفقودة بعد معامل التحديث.");
    }
    return {
      kind: "compound_assign",
      line,
      sourceText: text,
      name,
      operator: compound.operator,
      expr,
    };
  }

  const eqIdx = findTopLevelEqualsIndex(text);
  if (eqIdx !== -1) {
    const rawLhs = text.slice(0, eqIdx).trim();
    const name = rawLhs.includes(":") ? rawLhs.split(":")[0].trim() : rawLhs;
    const expr = text.slice(eqIdx + 1).trim();
    if (!VALID_IDENT_RE.test(name)) {
      throw new EngineError(line, `اسم متغير غير صالح: "${name}".`);
    }
    if (!expr) {
      throw new EngineError(line, "القيمة المفقودة بعد علامة `=`.");
    }
    return {
      kind: "assign",
      line,
      sourceText: text,
      name,
      expr,
      isDeclaration: false,
    };
  }

  throw new EngineError(
    line,
    `تعذر فهم السطر في Python: "${text}".`,
    "تأكد من صحة كتابة جملة التعيين أو الطباعة أو الشرط أو الحلقة.",
  );
}

function parsePythonBlock(
  lines: PyLine[],
  startIdx: number,
  expectedIndent: number,
): { stmts: Stmt[]; nextIdx: number } {
  const stmts: Stmt[] = [];
  let idx = startIdx;

  while (idx < lines.length) {
    const current = lines[idx];
    if (current.indent < expectedIndent) {
      break;
    }
    if (current.indent > expectedIndent) {
      throw new EngineError(
        current.line,
        "المسافات البادئة (Indentation) غير متناسقة عند هذا السطر.",
        "حافظ على محاذاة جميع الأسطر داخل نفس الكتلة.",
      );
    }

    const { line, text } = current;

    if (text.startsWith("elif ") || text === "else:" || text.startsWith("else :")) {
      throw new EngineError(
        line,
        "جملة elif أو else جاءت بدون جملة if سابقة على نفس المستوى.",
      );
    }

    // if / elif / else
    if (/^if\s+/.test(text) && text.endsWith(":")) {
      const cond = text.slice(2, -1).trim();
      const firstBody = parsePythonIndentedBody(lines, idx + 1, expectedIndent, line);
      const branches: Array<{
        condition: string | null;
        line: number;
        sourceText: string;
        body: Stmt[];
      }> = [
        {
          condition: cond,
          line,
          sourceText: text,
          body: firstBody.stmts,
        },
      ];
      idx = firstBody.nextIdx;

      while (idx < lines.length && lines[idx].indent === expectedIndent) {
        const branchLine = lines[idx];
        if (/^elif\s+/.test(branchLine.text) && branchLine.text.endsWith(":")) {
          const elifCond = branchLine.text.slice(4, -1).trim();
          const bodyRes = parsePythonIndentedBody(
            lines,
            idx + 1,
            expectedIndent,
            branchLine.line,
          );
          branches.push({
            condition: elifCond,
            line: branchLine.line,
            sourceText: branchLine.text,
            body: bodyRes.stmts,
          });
          idx = bodyRes.nextIdx;
          continue;
        }
        if (/^else\s*:$/.test(branchLine.text)) {
          const bodyRes = parsePythonIndentedBody(
            lines,
            idx + 1,
            expectedIndent,
            branchLine.line,
          );
          branches.push({
            condition: null,
            line: branchLine.line,
            sourceText: branchLine.text,
            body: bodyRes.stmts,
          });
          idx = bodyRes.nextIdx;
          break;
        }
        break;
      }

      stmts.push({ kind: "if", line, sourceText: text, branches });
      continue;
    }

    // for <var> in range(...) / iterable:
    const forMatch = /^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+):$/.exec(text);
    if (forMatch) {
      const iterator = forMatch[1];
      const iterablePart = forMatch[2].trim();
      const bodyRes = parsePythonIndentedBody(lines, idx + 1, expectedIndent, line);
      idx = bodyRes.nextIdx;

      const rangeMatch = /^range\s*\(([\s\S]*)\)$/.exec(iterablePart);
      if (rangeMatch) {
        const rangeArgs = splitTopLevelArgs(rangeMatch[1], ",").filter(
          (a) => a.length > 0,
        );
        if (rangeArgs.length < 1 || rangeArgs.length > 3) {
          throw new EngineError(
            line,
            "دالة range() تقبل من معامل واحد إلى 3 معاملات فقط.",
          );
        }
        stmts.push({
          kind: "for_range",
          line,
          sourceText: text,
          iterator,
          rangeArgs,
          iterableExpr: null,
          body: bodyRes.stmts,
        });
      } else {
        stmts.push({
          kind: "for_range",
          line,
          sourceText: text,
          iterator,
          rangeArgs: null,
          iterableExpr: iterablePart,
          body: bodyRes.stmts,
        });
      }
      continue;
    }

    // while <cond>:
    if (/^while\s+/.test(text) && text.endsWith(":")) {
      const condition = text.slice(5, -1).trim();
      const bodyRes = parsePythonIndentedBody(lines, idx + 1, expectedIndent, line);
      idx = bodyRes.nextIdx;
      stmts.push({
        kind: "while",
        line,
        sourceText: text,
        condition,
        body: bodyRes.stmts,
      });
      continue;
    }

    stmts.push(parsePythonSimple(text, line));
    idx += 1;
  }

  return { stmts, nextIdx: idx };
}

function parsePythonIndentedBody(
  lines: PyLine[],
  bodyStartIdx: number,
  parentIndent: number,
  headerLine: number,
): { stmts: Stmt[]; nextIdx: number } {
  if (
    bodyStartIdx >= lines.length ||
    lines[bodyStartIdx].indent <= parentIndent
  ) {
    throw new EngineError(
      headerLine,
      "يتوقع وجود أسطر مُزاحة (indented) داخل هذه الكتلة.",
      "أضف 4 مسافات قبل الأسطر التابعة للشرط أو الحلقة.",
    );
  }
  return parsePythonBlock(lines, bodyStartIdx, lines[bodyStartIdx].indent);
}

function parsePython(code: string): Stmt[] {
  const lines = tokenizePythonLines(code);
  if (lines.length === 0) return [];
  if (lines[0].indent !== 0) {
    throw new EngineError(
      lines[0].line,
      "لا يجب أن يبدأ أول سطر في البرنامج بمسافات بادئة.",
    );
  }
  return parsePythonBlock(lines, 0, 0).stmts;
}

/* ==========================================================================
   JavaScript & C++ Parser
   ========================================================================== */

function maskCCommentsAndPreproc(
  code: string,
  language: "javascript" | "cpp",
): string {
  const out = code.split("");
  let i = 0;
  let quote: string | null = null;

  while (i < out.length) {
    const ch = out[i];

    if (quote) {
      if (ch === "\\" && i + 1 < out.length) {
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || (language === "javascript" && ch === "`")) {
      quote = ch;
      i += 1;
      continue;
    }

    // Line comment //
    if (ch === "/" && out[i + 1] === "/") {
      while (i < out.length && out[i] !== "\n") {
        out[i] = " ";
        i += 1;
      }
      continue;
    }

    // Block comment /* ... */
    if (ch === "/" && out[i + 1] === "*") {
      out[i] = " ";
      out[i + 1] = " ";
      i += 2;
      while (i < out.length && !(out[i] === "*" && out[i + 1] === "/")) {
        if (out[i] !== "\n") out[i] = " ";
        i += 1;
      }
      if (i + 1 < out.length) {
        out[i] = " ";
        out[i + 1] = " ";
        i += 2;
      }
      continue;
    }

    // C++ preprocessor directive (#include, #define, ...) at line start
    if (language === "cpp" && ch === "#") {
      while (i < out.length && out[i] !== "\n") {
        out[i] = " ";
        i += 1;
      }
      continue;
    }

    i += 1;
  }

  return out.join("");
}

function splitCoutParts(rhs: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  let paren = 0;
  let bracket = 0;

  for (let i = 0; i < rhs.length; i += 1) {
    const ch = rhs[i];
    if (quote) {
      current += ch;
      if (ch === "\\" && i + 1 < rhs.length) {
        current += rhs[i + 1];
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") paren += 1;
    else if (ch === ")") paren -= 1;
    else if (ch === "[") bracket += 1;
    else if (ch === "]") bracket -= 1;

    if (paren === 0 && bracket === 0 && rhs[i] === "<" && rhs[i + 1] === "<") {
      if (current.trim()) parts.push(current.trim());
      current = "";
      i += 1;
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

class CStyleParser {
  private pos = 0;
  private readonly lineStarts: number[] = [0];

  constructor(
    private readonly src: string,
    private readonly language: "javascript" | "cpp",
  ) {
    for (let i = 0; i < src.length; i += 1) {
      if (src[i] === "\n") {
        this.lineStarts.push(i + 1);
      }
    }
  }

  private lineAt(index: number): number {
    let low = 0;
    let high = this.lineStarts.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.lineStarts[mid] <= index) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return high + 1;
  }

  private skipWs(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) {
      this.pos += 1;
    }
  }

  private startsWithWord(word: string): boolean {
    if (!this.src.startsWith(word, this.pos)) return false;
    const prev = this.src[this.pos - 1] ?? " ";
    const next = this.src[this.pos + word.length] ?? " ";
    return !/[A-Za-z0-9_]/.test(prev) && !/[A-Za-z0-9_]/.test(next);
  }

  private readParenGroup(openLine: number): string {
    this.skipWs();
    if (this.src[this.pos] !== "(") {
      throw new EngineError(openLine, "متوقع وجود قوس الفتح `(`. ");
    }
    this.pos += 1;
    const start = this.pos;
    let depth = 1;
    let quote: string | null = null;

    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (quote) {
        if (ch === "\\" && this.pos + 1 < this.src.length) {
          this.pos += 2;
          continue;
        }
        if (ch === quote) quote = null;
        this.pos += 1;
        continue;
      }
      if (ch === '"' || ch === "'" || (this.language === "javascript" && ch === "`")) {
        quote = ch;
        this.pos += 1;
        continue;
      }
      if (ch === "(") depth += 1;
      else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          const inner = this.src.slice(start, this.pos);
          this.pos += 1;
          return inner;
        }
      }
      this.pos += 1;
    }

    throw new EngineError(openLine, "قوس الشرط أو الحلقة `)` غير مغلق.");
  }

  private readStatementOrBlock(): Stmt[] {
    this.skipWs();
    if (this.src[this.pos] === "{") {
      this.pos += 1;
      return this.parseBlock(true);
    }
    const single = this.parseSingleStatement();
    if (!single) return [];
    return Array.isArray(single) ? single : [single];
  }

  private readSimpleStatementText(): { text: string; startPos: number } {
    const startPos = this.pos;
    let quote: string | null = null;
    let paren = 0;
    let bracket = 0;

    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (quote) {
        if (ch === "\\" && this.pos + 1 < this.src.length) {
          this.pos += 2;
          continue;
        }
        if (ch === quote) quote = null;
        this.pos += 1;
        continue;
      }
      if (ch === '"' || ch === "'" || (this.language === "javascript" && ch === "`")) {
        quote = ch;
        this.pos += 1;
        continue;
      }
      if (ch === "(") paren += 1;
      else if (ch === ")") paren -= 1;
      else if (ch === "[") bracket += 1;
      else if (ch === "]") bracket -= 1;

      if (paren === 0 && bracket === 0) {
        if (ch === ";") {
          const text = this.src.slice(startPos, this.pos).trim();
          this.pos += 1;
          return { text, startPos };
        }
        if (ch === "}" || ch === "{") {
          const text = this.src.slice(startPos, this.pos).trim();
          return { text, startPos };
        }
        if (ch === "\n") {
          const text = this.src.slice(startPos, this.pos).trim();
          if (text.length > 0) {
            this.pos += 1;
            return { text, startPos };
          }
        }
      }

      this.pos += 1;
    }

    return { text: this.src.slice(startPos).trim(), startPos };
  }

  parseAll(): Stmt[] {
    return this.parseBlock(false);
  }

  private parseBlock(stopOnCloseBrace: boolean): Stmt[] {
    const stmts: Stmt[] = [];

    while (this.pos < this.src.length) {
      this.skipWs();
      if (this.pos >= this.src.length) {
        if (stopOnCloseBrace) {
          throw new EngineError(
            this.lineAt(this.src.length - 1),
            "قوس الكتلة `}` مفقود في نهاية الكود.",
          );
        }
        break;
      }

      const ch = this.src[this.pos];
      if (ch === ";") {
        this.pos += 1;
        continue;
      }

      if (ch === "}") {
        if (stopOnCloseBrace) {
          this.pos += 1;
          return stmts;
        }
        throw new EngineError(
          this.lineAt(this.pos),
          "قوس إغلاق `}` زائد بدون قوس فتح `{` مقابل.",
        );
      }

      const stmt = this.parseSingleStatement();
      if (stmt) {
        if (Array.isArray(stmt)) {
          stmts.push(...stmt);
        } else {
          stmts.push(stmt);
        }
      }
    }

    return stmts;
  }

  private parseSingleStatement(): Stmt | Stmt[] | null {
    this.skipWs();
    if (this.pos >= this.src.length) return null;

    const stmtStart = this.pos;
    const line = this.lineAt(stmtStart);

    // Check C++ `int main() { ... }` or JS `function main() { ... }` wrapper
    if (this.language === "cpp") {
      const remaining = this.src.slice(this.pos);
      const mainMatch = /^(?:int|void)\s+main\s*\([^)]*\)\s*\{/.exec(remaining);
      if (mainMatch) {
        this.pos += mainMatch[0].length;
        return this.parseBlock(true);
      }
      const usingMatch = /^using\s+namespace\s+[A-Za-z0-9_:]+\s*;/.exec(remaining);
      if (usingMatch) {
        this.pos += usingMatch[0].length;
        return null;
      }
    }

    // if / else if / else
    if (this.startsWithWord("if")) {
      this.pos += 2;
      const cond = this.readParenGroup(line).trim();
      const body = this.readStatementOrBlock();
      const branches: Array<{
        condition: string | null;
        line: number;
        sourceText: string;
        body: Stmt[];
      }> = [
        {
          condition: cond,
          line,
          sourceText: `if (${cond})`,
          body,
        },
      ];

      while (true) {
        this.skipWs();
        if (!this.startsWithWord("else")) break;
        const branchLine = this.lineAt(this.pos);
        this.pos += 4;
        this.skipWs();
        if (this.startsWithWord("if")) {
          this.pos += 2;
          const elifCond = this.readParenGroup(branchLine).trim();
          const elifBody = this.readStatementOrBlock();
          branches.push({
            condition: elifCond,
            line: branchLine,
            sourceText: `else if (${elifCond})`,
            body: elifBody,
          });
        } else {
          const elseBody = this.readStatementOrBlock();
          branches.push({
            condition: null,
            line: branchLine,
            sourceText: "else",
            body: elseBody,
          });
          break;
        }
      }

      return {
        kind: "if",
        line,
        sourceText: `if (${cond})`,
        branches,
      };
    }

    // for (init; cond; update) { ... }
    if (this.startsWithWord("for")) {
      this.pos += 3;
      const header = this.readParenGroup(line);
      const segments = splitTopLevelArgs(header, ";");
      if (segments.length !== 3) {
        throw new EngineError(
          line,
          "جملة for يجب أن تحتوي على 3 أجزاء مفصولة بـ `;` مثل: for (let i = 1; i <= 10; i++).",
        );
      }
      const [initRaw, condRaw, updateRaw] = segments;
      const initStmt = initRaw ? parseCStyleSimple(initRaw, line, this.language) : null;
      const updateStmt = updateRaw
        ? parseCStyleSimple(updateRaw, line, this.language)
        : null;
      const body = this.readStatementOrBlock();

      return {
        kind: "for_cstyle",
        line,
        sourceText: `for (${header.trim()})`,
        init: initStmt,
        condition: condRaw.trim() || null,
        update: updateStmt,
        body,
      };
    }

    // while (cond) { ... }
    if (this.startsWithWord("while")) {
      this.pos += 5;
      const cond = this.readParenGroup(line).trim();
      const body = this.readStatementOrBlock();
      return {
        kind: "while",
        line,
        sourceText: `while (${cond})`,
        condition: cond,
        body,
      };
    }

    if (this.startsWithWord("else")) {
      throw new EngineError(line, "جملة else جاءت بدون جملة if سابقة.");
    }

    const { text, startPos } = this.readSimpleStatementText();
    if (!text) return null;
    return parseCStyleSimple(text, this.lineAt(startPos), this.language);
  }
}

function stripDeclarationKeyword(
  text: string,
  language: "javascript" | "cpp",
): { cleaned: string; isDeclaration: boolean } {
  if (language === "javascript") {
    const jsDecl = /^(let|const|var)\s+([\s\S]+)$/.exec(text);
    if (jsDecl) {
      return { cleaned: jsDecl[2].trim(), isDeclaration: true };
    }
    return { cleaned: text, isDeclaration: false };
  }

  const cppDecl =
    /^(?:const\s+)?(?:unsigned\s+|long\s+long\s+|long\s+|short\s+)?(?:int|double|float|bool|char|auto|std::string|string)\s+([\s\S]+)$/.exec(
      text,
    );
  if (cppDecl) {
    return { cleaned: cppDecl[1].trim(), isDeclaration: true };
  }
  return { cleaned: text, isDeclaration: false };
}

function parseCStyleSimple(
  rawText: string,
  line: number,
  language: "javascript" | "cpp",
): Stmt {
  const text = rawText.trim();

  if (text === "break") return { kind: "break", line, sourceText: text };
  if (text === "continue") return { kind: "continue", line, sourceText: text };
  if (text === "return" || /^return\s+/.test(text)) {
    const expr = text === "return" ? null : text.slice(6).trim();
    return { kind: "return", line, sourceText: text, expr };
  }

  // JavaScript console.log(...)
  if (language === "javascript") {
    const logMatch = /^console\.log\s*\(([\s\S]*)\)$/.exec(text);
    if (logMatch) {
      const inner = logMatch[1].trim();
      const exprs = inner.length === 0 ? [] : splitTopLevelArgs(inner, ",");
      return {
        kind: "print",
        line,
        sourceText: text,
        exprs,
        joinWithSpace: true,
      };
    }
  }

  // C++ cout / std::cout << ...
  if (language === "cpp") {
    const coutMatch = /^(?:std::)?cout\s*<<([\s\S]+)$/.exec(text);
    if (coutMatch) {
      const rawParts = splitCoutParts(coutMatch[1]);
      const exprs = rawParts.filter(
        (part) =>
          part !== "endl" &&
          part !== "std::endl" &&
          part !== '"\\n"' &&
          part !== "'\\n'",
      );
      return {
        kind: "print",
        line,
        sourceText: text,
        exprs,
        joinWithSpace: false,
      };
    }
  }

  // i++ / ++i / i-- / --i
  const incDecMatch =
    /^(?:([A-Za-z_][A-Za-z0-9_]*)\s*(\+\+|--)|(\+\+|--)\s*([A-Za-z_][A-Za-z0-9_]*))$/.exec(
      text,
    );
  if (incDecMatch) {
    const name = incDecMatch[1] ?? incDecMatch[4];
    const op = incDecMatch[2] ?? incDecMatch[3];
    return {
      kind: "inc_dec",
      line,
      sourceText: text,
      name,
      delta: op === "++" ? 1 : -1,
    };
  }

  const { cleaned, isDeclaration } = stripDeclarationKeyword(text, language);

  const compound = findTopLevelCompoundOp(cleaned);
  if (compound) {
    const name = cleaned.slice(0, compound.index).trim();
    const expr = cleaned.slice(compound.index + 2).trim();
    if (!VALID_IDENT_RE.test(name)) {
      throw new EngineError(line, `اسم متغير غير صالح: "${name}".`);
    }
    return {
      kind: "compound_assign",
      line,
      sourceText: text,
      name,
      operator: compound.operator,
      expr,
    };
  }

  const eqIdx = findTopLevelEqualsIndex(cleaned);
  if (eqIdx !== -1) {
    const name = cleaned.slice(0, eqIdx).trim();
    const expr = cleaned.slice(eqIdx + 1).trim();
    if (!VALID_IDENT_RE.test(name)) {
      throw new EngineError(line, `اسم متغير غير صالح: "${name}".`);
    }
    if (!expr) {
      throw new EngineError(line, "القيمة المفقودة بعد علامة `=`.");
    }
    return {
      kind: "assign",
      line,
      sourceText: text,
      name,
      expr,
      isDeclaration,
    };
  }

  throw new EngineError(
    line,
    `تعذر فهم الجملة البرمجية: "${text}".`,
    "تحقق من صحة صياغة المتغيرات أو الطباعة أو الأقواس.",
  );
}

export function parseCode(code: string, language: PlaygroundLanguage): Stmt[] {
  if (language === "python") {
    return parsePython(code);
  }
  const masked = maskCCommentsAndPreproc(code, language);
  if (!masked.trim()) return [];
  const parser = new CStyleParser(masked, language);
  return parser.parseAll();
}
