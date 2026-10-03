/**
 * What "my code" means per language, and helpers to bundle it for download.
 * Reads the same localStorage keys the labs persist to.
 */
import type { ProjectFile } from "@/lib/files";
import { MORE_LANGS } from "@/lib/more-langs";
import { buildHtmlDoc, loadJSON, loadStr, type LangId } from "@/lib/studio";

export type HtmlDoc = { html: string; css: string; js: string };

export function htmlProjectFiles(d: HtmlDoc): ProjectFile[] {
  return [
    { name: "index.html", content: buildHtmlDoc(d.html, d.css, d.js, { external: true }) },
    { name: "style.css", content: d.css },
    { name: "script.js", content: d.js },
  ];
}

/** Self-contained single file (CSS and JS inlined). */
export function htmlSingleFile(d: HtmlDoc): ProjectFile {
  return { name: "index.html", content: buildHtmlDoc(d.html, d.css, d.js) };
}

export function simpleFiles(file: string, code: string, extra: ProjectFile[] = []): ProjectFile[] {
  return [{ name: file, content: code }, ...extra.filter((f) => f.content !== "")];
}

/** Files per language as stored in the browser (only languages the user has used). */
export function storedProjects(): Partial<Record<LangId, ProjectFile[]>> {
  const out: Partial<Record<LangId, ProjectFile[]>> = {};
  const py = loadStr("py.code", "");
  if (py)
    out.python = simpleFiles("main.py", py, [
      { name: "stdin.txt", content: loadStr("py.stdin", "") },
    ]);
  const doc = loadJSON<HtmlDoc | null>("html.doc", null);
  if (doc && typeof doc.html === "string") out.html = htmlProjectFiles(doc);
  const js = loadStr("js.code", "");
  if (js) out.javascript = simpleFiles("main.js", js);
  const sql = loadStr("sql.code", "");
  if (sql) out.sql = simpleFiles("query.sql", sql);
  const c = loadStr("c.code", "");
  if (c) out.c = simpleFiles("main.c", c, [{ name: "stdin.txt", content: loadStr("c.stdin", "") }]);
  const codes = loadJSON<Record<string, string>>("more.codes", {});
  const moreFiles: ProjectFile[] = [];
  for (const l of MORE_LANGS) {
    if (codes[l.id]) moreFiles.push({ name: l.file, content: codes[l.id] });
  }
  if (moreFiles.length) out.more = moreFiles;
  return out;
}

/** Every language's files in folders; `current` overrides what's in storage (unsaved edits). */
export function allLanguageFiles(current?: { lang: LangId; files: ProjectFile[] }): ProjectFile[] {
  const stored = storedProjects();
  if (current) stored[current.lang] = current.files;
  const out: ProjectFile[] = [];
  for (const [lang, files] of Object.entries(stored)) {
    for (const f of files ?? []) out.push({ ...f, name: `${lang}/${f.name}` });
  }
  return out;
}
