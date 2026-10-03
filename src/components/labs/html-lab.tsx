import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor, type EditorDiagnostic } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { lintWebDoc, type HtmlIssue, type HtmlPane } from "@/lib/html-lint";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewStatus } from "@/components/preview-status";
import { htmlProjectFiles, htmlSingleFile } from "@/lib/project-files";
import { usePreview } from "@/lib/use-preview";
import { buildHtmlDoc, HTML_SAMPLES, loadJSON, saveJSON } from "@/lib/studio";
import { cn } from "@/lib/utils";
import { Copy, Eraser, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { EditorLang } from "@/lib/cm-theme";

const KEYS = Object.keys(HTML_SAMPLES);
const TABS: { id: HtmlPane; label: string; lang: EditorLang }[] = [
  { id: "html", label: "HTML", lang: "html" },
  { id: "css", label: "CSS", lang: "css" },
  { id: "js", label: "JS", lang: "javascript" },
];

type Doc = { html: string; css: string; js: string };
const DEFAULT = HTML_SAMPLES["Kart dizaynı"];
const PANE_LABEL: Record<HtmlPane, string> = { html: "HTML", css: "CSS", js: "JS" };

/** HTML / CSS / JS editor. The rendered page is shown ONLY in the /preview tab. */
export function HtmlLab() {
  const [doc, setDoc] = useState<Doc>(DEFAULT);
  const [tab, setTab] = useState<HtmlPane>("html");
  const [hydrated, setHydrated] = useState(false);
  const [jumpLine, setJumpLine] = useState(0);
  const [jumpSeq, setJumpSeq] = useState(0);
  const pv = usePreview("html", "HTML / CSS", "index.html");

  useEffect(() => {
    const saved = loadJSON<Doc | null>("html.doc", null);
    if (saved && typeof saved.html === "string") setDoc(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJSON("html.doc", doc);
  }, [doc, hydrated]);

  const built = useMemo(() => buildHtmlDoc(doc.html, doc.css, doc.js), [doc]);
  const bridged = useMemo(() => buildHtmlDoc(doc.html, doc.css, doc.js, { bridge: true }), [doc]);
  const issues: HtmlIssue[] = useMemo(() => lintWebDoc(doc.html, doc.css, doc.js), [doc]);
  const status: "ok" | "err" = issues.length ? "err" : "ok";

  const snapshot = useMemo(
    () => ({ code: built, html: bridged, state: "done" as const, label: "Hazırdır" }),
    [built, bridged],
  );

  // keep an opened preview page in sync with edits
  useEffect(() => {
    pv.push(snapshot);
  }, [snapshot, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRun = useCallback(() => {
    // opened synchronously inside the click / Ctrl+Enter so pop-up blockers allow it
    if (!pv.open(snapshot))
      toast("Brauzer yeni səhifəni blokladı — «Önizləməni aç» düyməsinə basın.");
  }, [pv, snapshot]);

  const onChange = useCallback((v: string) => setDoc((d) => ({ ...d, [tab]: v })), [tab]);

  const jumpTo = useCallback((issue: HtmlIssue) => {
    setTab(issue.pane);
    setJumpLine(issue.line);
    setJumpSeq((n) => n + 1);
  }, []);

  const zipFiles = useMemo(() => htmlProjectFiles(doc), [doc]);
  const files = useMemo(() => [htmlSingleFile(doc), ...zipFiles.slice(1)], [doc, zipFiles]);
  const current = doc[tab];
  const lang = TABS.find((t) => t.id === tab)!.lang;
  const diagnostics: EditorDiagnostic[] = useMemo(
    () =>
      issues
        .filter((i) => i.pane === tab)
        .map((i) => ({ line: i.line, column: i.column, message: i.message })),
    [issues, tab],
  );

  return (
    <AppShell
      lang="html"
      status={status}
      statusLabel={issues.length ? `${issues.length} xəta` : "Hazırdır"}
      actions={
        <Button
          variant="default"
          size="lg"
          className="min-w-[118px] flex-1 md:flex-none"
          onClick={onRun}
        >
          <Play className="size-3.5" />
          Başlat
        </Button>
      }
    >
      <ToolRow>
        <NativeSelect
          label="Nümunələr"
          value=""
          className="min-w-[160px] flex-1 sm:flex-none"
          onChange={(k) => {
            if (HTML_SAMPLES[k]) setDoc(HTML_SAMPLES[k]);
          }}
        >
          <option value="">Nümunələr</option>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </NativeSelect>
        <Button
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(current);
            toast("Kod kopyalandı");
          }}
        >
          <Copy className="size-3.5" />
          Kopyala
        </Button>
        <DownloadMenu lang="html" zipName="html-layihe" files={files} zipFiles={zipFiles} />
        <Button size="sm" onClick={() => setDoc({ html: "", css: "", js: "" })}>
          <Eraser className="size-3.5" />
          Təmizlə
        </Button>
      </ToolRow>
      <PreviewStatus
        href={pv.href}
        target={pv.target}
        state="done"
        opened={pv.opened}
        blocked={pv.blocked}
        onPrime={() => pv.prime(snapshot)}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-2 py-1.5">
          {TABS.map((t) => {
            const n = issues.filter((i) => i.pane === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm max-md:min-h-11",
                  tab === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {t.label}
                {n > 0 ? <span className="ml-1.5 text-xs text-danger">{n}</span> : null}
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1">
          <CodeEditor
            key={tab}
            lang={lang}
            value={current}
            onChange={onChange}
            onRun={onRun}
            diagnostics={diagnostics}
            jumpLine={jumpLine}
            jumpSeq={jumpSeq}
          />
        </div>
        {issues.length > 0 ? (
          <div className="max-h-28 shrink-0 overflow-auto border-t border-danger/35 bg-danger/10">
            <p className="sticky top-0 border-b border-danger/20 bg-danger/10 px-3 py-1.5 text-[11px] uppercase tracking-wide text-danger">
              Xətalar — səbəb aşağıda, kodda qırmızı sətir
            </p>
            <ul className="px-3 py-2">
              {issues.map((it, i) => (
                <li key={`${it.pane}-${it.line}-${i}`}>
                  <button
                    className="flex w-full flex-col items-start gap-0.5 rounded-sm py-1 text-left hover:bg-danger/10"
                    onClick={() => jumpTo(it)}
                  >
                    <span className="font-mono text-[13px] text-danger">
                      ✖ {PANE_LABEL[it.pane]} · sətir {it.line}: {it.message}
                    </span>
                    {it.hint ? <span className="text-xs text-warn">Səbəb: {it.hint}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
