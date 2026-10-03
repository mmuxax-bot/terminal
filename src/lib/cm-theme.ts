import {
  EditorView,
  keymap,
  gutterLineClass,
  GutterMarker,
  Decoration,
  type DecorationSet,
} from "@codemirror/view";
import { Prec, RangeSetBuilder } from "@codemirror/state";
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { haskell } from "@codemirror/legacy-modes/mode/haskell";
import { r } from "@codemirror/legacy-modes/mode/r";
import { julia } from "@codemirror/legacy-modes/mode/julia";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";

export type EditorLang =
  | "python"
  | "javascript"
  | "typescript"
  | "html"
  | "css"
  | "sql"
  | "c"
  | "cpp"
  | "java"
  | "php"
  | "rust"
  | "go"
  | "ruby"
  | "perl"
  | "lua"
  | "shell"
  | "haskell"
  | "r"
  | "julia";

export type EditorDiagnostic = {
  line: number;
  column?: number;
  message: string;
};

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: "#7ec8e3" },
  { tag: t.controlKeyword, color: "#7ec8e3" },
  { tag: t.operatorKeyword, color: "#7ec8e3" },
  { tag: t.comment, color: "#5d6d82", fontStyle: "italic" },
  { tag: t.lineComment, color: "#5d6d82", fontStyle: "italic" },
  { tag: t.string, color: "#9dce8a" },
  { tag: t.number, color: "#e6a07c" },
  { tag: t.bool, color: "#e6a07c" },
  { tag: t.null, color: "#e6a07c" },
  { tag: t.function(t.variableName), color: "#82b4e8" },
  { tag: t.function(t.propertyName), color: "#82b4e8" },
  { tag: t.definition(t.variableName), color: "#e8eef6" },
  { tag: t.typeName, color: "#6ec8c0" },
  { tag: t.className, color: "#82b4e8" },
  { tag: t.propertyName, color: "#c5d4e4" },
  { tag: t.tagName, color: "#7ec8e3" },
  { tag: t.attributeName, color: "#6ec8c0" },
  { tag: t.angleBracket, color: "#8b9bb0" },
  { tag: t.operator, color: "#8b9bb0" },
  { tag: t.punctuation, color: "#8b9bb0" },
  { tag: t.meta, color: "#e0c07a" },
  { tag: t.processingInstruction, color: "#e0c07a" },
  { tag: t.regexp, color: "#9dce8a" },
  { tag: t.self, color: "#e6a07c" },
]);

const theme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "transparent",
      color: "#e8eef6",
      fontSize: "14px",
    },
    ".cm-content": {
      caretColor: "#2fd4bf",
      fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
      lineHeight: "1.7",
      padding: "14px 0",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#5d6d82",
      border: "none",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "2.6rem",
      padding: "0 10px 0 8px",
    },
  },
  { dark: true },
);

function langExt(lang: EditorLang): Extension {
  switch (lang) {
    case "python":
      return python();
    case "javascript":
      return javascript();
    case "html":
      return html({ autoCloseTags: true });
    case "css":
      return css();
    case "sql":
      return sql();
    case "c":
    case "cpp":
      return cpp();
    case "typescript":
      return javascript({ typescript: true });
    case "java":
      return java();
    case "php":
      return php();
    case "rust":
      return rust();
    case "go":
      return go();
    case "ruby":
      return StreamLanguage.define(ruby);
    case "perl":
      return StreamLanguage.define(perl);
    case "lua":
      return StreamLanguage.define(lua);
    case "shell":
      return StreamLanguage.define(shell);
    case "haskell":
      return StreamLanguage.define(haskell);
    case "r":
      return StreamLanguage.define(r);
    case "julia":
      return StreamLanguage.define(julia);
  }
}

export function editorExtensions(lang: EditorLang, onRun: () => void): Extension[] {
  return [
    langExt(lang),
    theme,
    syntaxHighlighting(highlight),
    Prec.highest(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRun();
            return true;
          },
        },
      ]),
    ),
  ];
}

class ErrorLineMarker extends GutterMarker {
  override elementClass = "cm-error-gutter";
}

const errorLineMarker = new ErrorLineMarker();

export function errorExtensions(diags: EditorDiagnostic[]): Extension[] {
  if (!diags.length) return [];
  const lines = [
    ...new Set(diags.map((d) => d.line).filter((n) => Number.isFinite(n) && n >= 1)),
  ].sort((a, b) => a - b);

  return [
    lintGutter(),
    linter(
      (view) => {
        const out: Diagnostic[] = [];
        for (const d of diags) {
          if (d.line < 1 || d.line > view.state.doc.lines) continue;
          const line = view.state.doc.line(d.line);
          let from = line.from;
          if (d.column && d.column > 0) {
            from = line.from + Math.min(d.column - 1, Math.max(0, line.length));
          }
          const to = line.to === from ? Math.min(line.to + 0, line.to) : line.to;
          out.push({
            from,
            to: Math.max(from, to),
            severity: "error",
            message: d.message,
          });
        }
        return out;
      },
      { delay: 0 },
    ),
    EditorView.decorations.compute([], (state): DecorationSet => {
      const deco = [];
      for (const n of lines) {
        if (n > state.doc.lines) continue;
        deco.push(Decoration.line({ class: "cm-error-line" }).range(state.doc.line(n).from));
      }
      return Decoration.set(deco);
    }),
    gutterLineClass.compute([], (state) => {
      const builder = new RangeSetBuilder<GutterMarker>();
      for (const n of lines) {
        if (n > state.doc.lines) continue;
        const line = state.doc.line(n);
        builder.add(line.from, line.from, errorLineMarker);
      }
      return builder.finish();
    }),
  ];
}
