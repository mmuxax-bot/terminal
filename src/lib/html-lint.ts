export type HtmlPane = "html" | "css" | "js";

export type HtmlIssue = {
  pane: HtmlPane;
  line: number;
  column?: number;
  message: string;
  hint?: string;
};

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const JS_HINTS: Record<string, string> = {
  SyntaxError: "Yazılış xətası: mötərizə, dırnaq və ya nöqtəli vergül səhvi ola bilər.",
  ReferenceError: "Dəyişən və ya funksiya təyin edilməyib, yaxud adda hərf səhvi var.",
  TypeError: "Dəyər tipi uyğun gəlmir — çox vaxt element tapılmayıb (id səhvdir).",
  RangeError: "Dəyər icazə verilən aralıqdan kənardadır.",
};

function lineAt(src: string, index: number) {
  let line = 1;
  const end = Math.min(index, src.length);
  for (let i = 0; i < end; i++) if (src.charCodeAt(i) === 10) line++;
  return line;
}

export function lintHtml(src: string): HtmlIssue[] {
  if (!src.trim()) return [];
  const issues: HtmlIssue[] = [];
  const stack: { name: string; line: number }[] = [];
  const re =
    /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)([^>]*?)(\/?)\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const line = lineAt(src, m.index);
    const raw = m[0];
    if (raw.startsWith("<!--") || /^<!doctype/i.test(raw)) continue;
    if (m[1]) {
      const name = m[1].toLowerCase();
      let idx = stack.length - 1;
      while (idx >= 0 && stack[idx].name !== name) idx--;
      if (idx < 0) {
        issues.push({
          pane: "html",
          line,
          message: `Bağlanış teqi </${name}> üçün açılış yoxdur.`,
          hint: "Açılış teqini əlavə edin və ya bu bağlanışı silin.",
        });
      } else {
        const inner = stack.slice(idx + 1);
        stack.length = idx;
        for (const s of inner) {
          issues.push({
            pane: "html",
            line: s.line,
            message: `<${s.name}> teqi bağlanmayıb.`,
            hint: `</${s.name}> əlavə edin.`,
          });
        }
      }
      continue;
    }
    const name = (m[2] || "").toLowerCase();
    if (!name) continue;
    const attrs = m[3] || "";
    const self = m[4] === "/" || VOID.has(name);
    const quotes = attrs.replace(/\\["']/g, "");
    const dq = (quotes.match(/"/g) || []).length;
    const sq = (quotes.match(/'/g) || []).length;
    if (dq % 2 !== 0 || sq % 2 !== 0) {
      issues.push({
        pane: "html",
        line,
        message: `<${name}> atributunda dırnaq bağlanmayıb.`,
        hint: 'Atributu name="dəyər" şəklində yazın.',
      });
    }
    if (!self) stack.push({ name, line });
  }
  for (const s of stack) {
    issues.push({
      pane: "html",
      line: s.line,
      message: `<${s.name}> teqi bağlanmayıb.`,
      hint: `</${s.name}> əlavə edin.`,
    });
  }
  return issues.slice(0, 16);
}

export function lintCss(src: string): HtmlIssue[] {
  if (!src.trim()) return [];
  const issues: HtmlIssue[] = [];
  let braces = 0;
  let lastOpen = 1;
  let line = 1;
  let inStr = "";
  let inComment = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (inComment) {
      if (c === "*" && n === "/") {
        inComment = false;
        i++;
      } else if (c === "\n") line++;
      continue;
    }
    if (inStr) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === inStr) inStr = "";
      else if (c === "\n") {
        issues.push({
          pane: "css",
          line,
          message: "Sətirdə bağlanmamış dırnaq.",
          hint: "Dırnağı eyni sətirdə bağlayın.",
        });
        inStr = "";
        line++;
      }
      continue;
    }
    if (c === "/" && n === "*") {
      inComment = true;
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      continue;
    }
    if (c === "\n") {
      line++;
      continue;
    }
    if (c === "{") {
      braces++;
      lastOpen = line;
      continue;
    }
    if (c === "}") {
      braces--;
      if (braces < 0) {
        issues.push({
          pane: "css",
          line,
          message: "Artıq bağlanış mötərizəsi `}`.",
          hint: "Əlavə `}` silin və ya `{` əlavə edin.",
        });
        braces = 0;
      }
    }
  }
  if (inComment) {
    issues.push({
      pane: "css",
      line,
      message: "Şərh bağlanmayıb (`*/` yoxdur).",
      hint: "Şərhin sonuna `*/` yazın.",
    });
  }
  if (inStr) {
    issues.push({
      pane: "css",
      line,
      message: "Dırnaq bağlanmayıb.",
      hint: "Açıq dırnağı bağlayın.",
    });
  }
  if (braces > 0) {
    issues.push({
      pane: "css",
      line: lastOpen,
      message: `${braces} ədəd \`{\` bağlanmayıb.`,
      hint: "`}` əlavə edin.",
    });
  }
  return issues.slice(0, 12);
}

export function lintJs(src: string): HtmlIssue[] {
  if (!src.trim()) return [];
  try {
     
    new Function(src);
    return [];
  } catch (err) {
    const name = err instanceof Error && err.name ? err.name : "SyntaxError";
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack ?? "" : "";
    const fx = err as { lineNumber?: number; columnNumber?: number };
    let line = 1;
    let column: number | undefined;
    const m =
      stack.match(/<anonymous>:(\d+):(\d+)/) ||
      stack.match(/Function:(\d+):(\d+)/) ||
      message.match(/:(\d+):(\d+)/);
    if (typeof fx.lineNumber === "number") {
      line = Math.max(1, fx.lineNumber);
      if (typeof fx.columnNumber === "number") column = fx.columnNumber;
    } else if (m) {
      line = Number(m[1]);
      column = m[2] ? Number(m[2]) : undefined;
      if (stack.includes("<anonymous>") || stack.includes("Function:")) {
        line = Math.max(1, line - 2);
      }
    }
    const clean = message.replace(/^(?:[A-Za-z]*Error:\s*)+/, "");
    return [
      {
        pane: "js",
        line,
        column,
        message: `${name}: ${clean}`,
        hint: JS_HINTS[name] || JS_HINTS.SyntaxError,
      },
    ];
  }
}

export function lintWebDoc(html: string, css: string, js: string): HtmlIssue[] {
  return [...lintHtml(html), ...lintCss(css), ...lintJs(js)].slice(0, 20);
}

export function hintForJsError(name?: string, message?: string): string | undefined {
  const msg = message || "";
  if (/null|undefined/i.test(msg) && /property|read|click|of/i.test(msg)) {
    return "Element tapılmadı. HTML-də id-nin düzgün yazıldığına əmin olun.";
  }
  if (name && JS_HINTS[name]) return JS_HINTS[name];
  return undefined;
}

export function cErrorDiagnostics(text: string): { line: number; message: string }[] {
  const out: { line: number; message: string }[] = [];
  const re =
    /(?:^|\n)(?:[\w./ +-]+):(\d+)(?::(\d+))?:\s*(?:fatal )?error:\s*(.+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ line: Number(m[1]), message: m[3].trim() });
  }
  return out.slice(0, 12);
}
