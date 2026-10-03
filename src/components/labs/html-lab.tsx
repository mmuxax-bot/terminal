import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor, type EditorDiagnostic } from "@/components/code-editor";
import { ConsolePane, type LogItem, type Tone } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { hintForJsError, lintWebDoc, type HtmlIssue, type HtmlPane } from "@/lib/html-lint";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewControls } from "@/components/preview-controls";
import { htmlProjectFiles, htmlSingleFile } from "@/lib/project-files";
import { usePreview } from "@/lib/use-preview";
import {
  buildHtmlDoc,
  HTML_PREVIEW_ALLOW,
  HTML_PREVIEW_SANDBOX,
  HTML_SAMPLES,
  loadJSON,
  looksLikeHtml,
  saveJSON,
} from "@/lib/studio";
import { cn, uid } from "@/lib/utils";
import { Copy, Eraser, ExternalLink, Monitor, Play, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Split, Panel, Handle } from "@/components/split";
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

export function HtmlLab() {
  const [doc, setDoc] = useState<Doc>(DEFAULT);
  const [tab, setTab] = useState<HtmlPane>("html");
  const [width, setWidth] = useState<"full" | "768" | "390">("full");
  const [hydrated, setHydrated] = useState(false);
  const [live, setLive] = useState(() =>
    buildHtmlDoc(DEFAULT.html, DEFAULT.css, DEFAULT.js, { bridge: true }),
  );
  const [runtime, setRuntime] = useState<HtmlIssue[]>([]);
  const [jumpLine, setJumpLine] = useState(0);
  const [jumpSeq, setJumpSeq] = useState(0);
  const [status, setStatus] = useState<"ok" | "err">("ok");
  const [narrow, setNarrow] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pv = usePreview("html", "HTML / CSS", "index.html");

  const append = useCallback((tone: Tone, text: string) => {
    setLogs((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === "text" && last.tone === tone) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: uid(), kind: "text", tone, text }];
    });
  }, []);

  useEffect(() => {
    const saved = loadJSON<Doc | null>("html.doc", null);
    if (saved && typeof saved.html === "string") setDoc(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJSON("html.doc", doc);
  }, [doc, hydrated]);

  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);

  const built = useMemo(() => buildHtmlDoc(doc.html, doc.css, doc.js), [doc]);
  const bridged = useMemo(() => buildHtmlDoc(doc.html, doc.css, doc.js, { bridge: true }), [doc]);
  const staticIssues = useMemo(() => lintWebDoc(doc.html, doc.css, doc.js), [doc]);

  useEffect(() => {
    setRuntime([]);
    const id = window.setTimeout(() => setLive(bridged), 280);
    return () => window.clearTimeout(id);
  }, [bridged]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data as {
        source?: string;
        t?: string;
        k?: string;
        s?: string;
        msg?: string;
        line?: number;
        col?: number;
        file?: string;
        name?: string;
      };
      if (!d || d.source !== "nibras-html") return;
      if (d.t === "console") {
        if (d.k === "clear") {
          setLogs([]);
          return;
        }
        const tone = d.k === "error" ? "e" : d.k === "warn" ? "w" : "o";
        append(tone, d.s || "");
        return;
      }
      if (d.t !== "error") return;
      const file = (d.file || "").toLowerCase();
      const inUser = file.includes("user.js");
      const issue: HtmlIssue = {
        pane: inUser || !file || file === "about:srcdoc" ? "js" : "js",
        line: inUser ? d.line || 1 : d.line || 1,
        column: d.col,
        message: `${d.name || "Error"}: ${d.msg || "Xəta"}`,
        hint: hintForJsError(d.name, d.msg),
      };
      append("e", `✖ ${issue.message}\n`);
      if (issue.hint) append("h", `Səbəb: ${issue.hint}\n`);
      setRuntime((prev) => {
        if (prev.some((p) => p.message === issue.message && p.line === issue.line)) {
          return prev;
        }
        return [...prev, issue].slice(0, 12);
      });
    }
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [append]);

  const issues = useMemo(() => {
    const seen = new Set<string>();
    const out: HtmlIssue[] = [];
    for (const it of [...staticIssues, ...runtime]) {
      const k = `${it.pane}:${it.line}:${it.message}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
    return out;
  }, [staticIssues, runtime]);

  useEffect(() => {
    setStatus(issues.length ? "err" : "ok");
  }, [issues.length]);

  const snapshot = useCallback(
    (html: string, clean: string) => ({
      code: clean,
      html,
      state: "done" as const,
      label: "Hazırdır",
    }),
    [],
  );

  // keep an opened preview page in sync with edits
  useEffect(() => {
    pv.push(snapshot(bridged, built));
  }, [bridged, built, snapshot, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  const openFree = useCallback(() => {
    const ok = pv.open(snapshot(bridged, built));
    if (!ok)
      toast("Yeni səhifə bloklandı — brauzerdə pop-up-a icazə verin. Önizləmə burada göstərilir.");
  }, [pv, snapshot, bridged, built]);

  const onRun = useCallback(() => {
    setLogs([]);
    setRuntime([]);
    setLive(bridged);
    if (pv.autoOpen) openFree();
  }, [bridged, openFree, pv.autoOpen]);

  const onChange = useCallback((v: string) => setDoc((d) => ({ ...d, [tab]: v })), [tab]);

  const jumpTo = useCallback((issue: HtmlIssue) => {
    setTab(issue.pane);
    setJumpLine(issue.line);
    setJumpSeq((n) => n + 1);
  }, []);

  const onTerm = useCallback(
    (raw: string) => {
      const v = raw.trim();
      if (!v) return;
      append("m", `$ ${v}\n`);
      if (looksLikeHtml(v)) {
        const page = /<html[\s>]/i.test(v) ? v : buildHtmlDoc(v, "", "");
        const ok = pv.open(snapshot(buildHtmlDoc(page, "", "", { bridge: true }), page));
        append(
          "r",
          ok ? "→ yeni səhifədə açıldı\n" : "→ pop-up bloklandı — brauzerdə icazə verin\n",
        );
        return;
      }
      const win = iframeRef.current?.contentWindow;
      if (!win) {
        append("e", "Önizləmə hələ hazır deyil.\n");
        return;
      }
      win.postMessage({ source: "nibras-parent", t: "eval", code: v }, "*");
    },
    [append, pv, snapshot],
  );

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
      statusLabel={issues.length ? `${issues.length} xəta` : "Tam açıq önizləmə"}
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
            void navigator.clipboard.writeText(current);
            toast("Kod kopyalandı");
          }}
        >
          <Copy className="size-3.5" />
          Kopyala
        </Button>
        <DownloadMenu lang="html" zipName="html-layihe" files={files} zipFiles={zipFiles} />
        <Button
          size="sm"
          onClick={() => {
            setDoc({ html: "", css: "", js: "" });
            setLogs([]);
          }}
        >
          <Eraser className="size-3.5" />
          Təmizlə
        </Button>
        <PreviewControls auto={pv.autoOpen} onAuto={pv.setAutoOpen} onOpen={openFree} />
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {(
            [
              ["full", Monitor],
              ["768", Tablet],
              ["390", Smartphone],
            ] as const
          ).map(([w, Icon]) => (
            <button
              key={w}
              onClick={() => setWidth(w)}
              className={cn(
                "grid size-9 place-items-center rounded-md border border-border text-muted",
                width === w && "border-accent/40 bg-elevated text-fg",
              )}
              aria-label={w}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </ToolRow>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-2 py-1.5">
          {TABS.map((t) => {
            const n = issues.filter((i) => i.pane === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm",
                  tab === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {t.label}
                {n > 0 ? <span className="ml-1.5 text-xs text-danger">{n}</span> : null}
              </button>
            );
          })}
        </div>
        <Split orientation="vertical" className="min-h-0 flex-1">
          <Panel defaultSize="68%" minSize="28%" className="min-h-0">
            <Split orientation={narrow ? "vertical" : "horizontal"} className="h-full min-h-0">
              <Panel defaultSize="52%" minSize="28%" className="min-h-[36%] md:min-h-0">
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
              </Panel>
              <Handle className={narrow ? "h-1.5 w-full" : "w-1.5"} />
              <Panel defaultSize="48%" minSize="24%" className="min-h-[36%] bg-elevated md:min-h-0">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle">
                    <span>Önizləmə</span>
                    <button
                      className="inline-flex items-center gap-1 normal-case text-muted hover:text-fg"
                      onClick={openFree}
                    >
                      <ExternalLink className="size-3.5" />
                      Yeni səhifə
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto bg-elevated p-3">
                    <div
                      className="relative mx-auto h-full overflow-hidden rounded-md border border-border bg-fg"
                      style={{
                        width: width === "full" ? "100%" : width === "768" ? 768 : 390,
                        maxWidth: "100%",
                        height: "100%",
                      }}
                    >
                      <iframe
                        ref={iframeRef}
                        title="Nəticə"
                        sandbox={HTML_PREVIEW_SANDBOX}
                        srcDoc={live}
                        allow={HTML_PREVIEW_ALLOW}
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 h-full w-full border-0 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </Panel>
            </Split>
          </Panel>
          <Handle className="h-1.5 w-full" />
          <Panel defaultSize="32%" minSize="16%" className="min-h-[140px]">
            <ConsolePane
              items={logs}
              empty="Terminal: console.log burada. HTML yazıb Enter — yeni səhifədə açılır. JS yazıb Enter — önizləmədə işləyir."
              inputEnabled
              inputPlaceholder="HTML və ya JS yazın, Enter — yeni səhifə / icra"
              onSubmitInput={onTerm}
              header={
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle">
                  <span>Terminal</span>
                  <div className="flex items-center gap-3 normal-case">
                    <button
                      className="text-muted hover:text-fg"
                      onClick={() => {
                        const t = logs
                          .filter((i) => i.kind === "text")
                          .map((i) => (i.kind === "text" ? i.text : ""))
                          .join("");
                        void navigator.clipboard.writeText(t);
                        toast("Çıxış kopyalandı");
                      }}
                    >
                      Kopyala
                    </button>
                    <button className="text-muted hover:text-fg" onClick={() => setLogs([])}>
                      Təmizlə
                    </button>
                  </div>
                </div>
              }
            />
          </Panel>
        </Split>
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
