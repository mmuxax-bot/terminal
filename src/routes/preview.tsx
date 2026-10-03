import { createFileRoute, Link } from "@tanstack/react-router";
import { LogList, type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { canShareFiles, saveFile, shareFiles, textBlob, type SaveResult } from "@/lib/files";
import {
  readPreview,
  subscribePreview,
  type PreviewPayload,
  type PreviewState,
} from "@/lib/preview-channel";
import { HTML_PREVIEW_ALLOW, HTML_PREVIEW_SANDBOX, ALL_LANGUAGES, stripBridge } from "@/lib/studio";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Expand, RefreshCw, Share2, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Search = { lang: string };

export const Route = createFileRoute("/preview")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lang: typeof s.lang === "string" ? s.lang : "html",
  }),
  component: PreviewPage,
  head: () => ({ meta: [{ title: "Önizləmə · NibrasCode" }] }),
});

const STATE_LABEL: Record<PreviewState, string> = {
  idle: "Gözləyir",
  running: "İcra olunur…",
  waiting: "Giriş gözlənilir — Studio səhifəsində cavab verin",
  done: "Hazırdır",
  error: "Xəta",
};

const STATE_DOT: Record<PreviewState, string> = {
  idle: "bg-subtle",
  running: "bg-accent animate-pulse",
  waiting: "bg-warn animate-pulse",
  done: "bg-ok",
  error: "bg-danger",
};

function outputText(items: LogItem[] | undefined) {
  return (items ?? [])
    .map((i) => {
      if (i.kind === "text") return i.text;
      if (i.kind === "table") {
        return (
          [
            i.cols.join("\t"),
            ...i.rows.map((r) => r.map((v) => (v === null ? "NULL" : String(v))).join("\t")),
          ].join("\n") + "\n"
        );
      }
      return "";
    })
    .join("");
}

function report(r: SaveResult, what: string) {
  if (r === "download") toast(`${what} yüklənir`);
  else if (r === "share") toast(`${what} paylaşıldı`);
  else if (r === "tab") toast(`${what} yeni səhifədə açıldı`);
  else if (r === "failed") toast.error("Yükləmə alınmadı");
}

type ConsoleLine = { id: number; tone: "o" | "w" | "e" | "h"; text: string };

function PreviewPage() {
  const { lang } = Route.useSearch();
  const meta = ALL_LANGUAGES.find((l) => l.id === lang);
  const [p, setP] = useState<PreviewPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    setP(readPreview(lang));
    setLoaded(true);
    setCanShare(canShareFiles());
    return subscribePreview(lang, setP);
  }, [lang]);

  const htmlDoc = p?.html;
  // reset the in-page console whenever a new document is loaded
  useEffect(() => {
    setLines([]);
  }, [htmlDoc, nonce]);

  useEffect(() => {
    if (p?.title) document.title = `${p.title} · önizləmə`;
  }, [p?.title]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const d = e.data as {
        source?: string;
        t?: string;
        k?: string;
        s?: string;
        msg?: string;
        name?: string;
        line?: number;
      };
      if (!d || d.source !== "nibras-html") return;
      if (d.t === "console") {
        if (d.k === "clear") return setLines([]);
        const tone: ConsoleLine["tone"] = d.k === "error" ? "e" : d.k === "warn" ? "w" : "o";
        setLines((prev) => [...prev, { id: ++seq.current, tone, text: d.s ?? "" }].slice(-500));
      } else if (d.t === "error") {
        setLines((prev) =>
          [
            ...prev,
            {
              id: ++seq.current,
              tone: "e" as const,
              text: `✖ ${d.name ?? "Error"}: ${d.msg ?? "Xəta"}${d.line ? ` (sətir ${d.line})` : ""}\n`,
            },
          ].slice(-500),
        );
        setShowConsole(true);
      }
    }
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, []);

  const state: PreviewState = p?.state ?? "idle";
  const isHtml = typeof p?.html === "string";
  const text = useMemo(() => outputText(p?.items), [p?.items]);
  const errors = lines.filter((l) => l.tone === "e").length;

  function fullscreen() {
    const el = wrapRef.current as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (el.requestFullscreen)
      void el.requestFullscreen().catch(() => toast("Tam ekran bu brauzerdə dəstəklənmir"));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else toast("Tam ekran bu brauzerdə dəstəklənmir");
  }

  const codeFile = p
    ? { name: p.filename, content: isHtml ? stripBridge(p.html ?? p.code) : p.code }
    : null;

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-2 py-1.5 sm:px-3">
        <Link
          to={meta?.path ?? "/"}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted hover:bg-elevated hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          <span>Studio</span>
        </Link>
        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate text-sm font-medium">
            {p?.title ?? meta?.label ?? lang}
            {p?.filename ? (
              <span className="ml-2 font-mono text-xs text-subtle">{p.filename}</span>
            ) : null}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("size-1.5 rounded-full", STATE_DOT[state])} />
            <span className="truncate">
              {p?.label && state !== "waiting" ? p.label : STATE_LABEL[state]}
            </span>
            {p?.elapsed ? <span className="text-subtle">· {p.elapsed}</span> : null}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isHtml ? (
            <>
              <Button size="sm" onClick={() => setNonce((n) => n + 1)} aria-label="Yenilə">
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">Yenilə</span>
              </Button>
              <Button size="sm" onClick={fullscreen} aria-label="Tam ekran">
                <Expand className="size-3.5" />
                <span className="hidden sm:inline">Tam ekran</span>
              </Button>
            </>
          ) : null}
          {codeFile ? (
            <Button
              size="sm"
              onClick={() => void saveFile(codeFile).then((r) => report(r, codeFile.name))}
            >
              <Download className="size-3.5" />
              <span>{isHtml ? ".html" : "Kod"}</span>
            </Button>
          ) : null}
          {!isHtml && text ? (
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() =>
                void saveFile({ name: `${lang}-output.txt`, content: text }).then((r) =>
                  report(r, "Çıxış"),
                )
              }
            >
              <Download className="size-3.5" />
              Çıxış
            </Button>
          ) : null}
          {canShare && codeFile ? (
            <Button
              size="sm"
              aria-label="Paylaş"
              onClick={() =>
                void shareFiles([
                  { name: codeFile.name, blob: textBlob(codeFile.content, "text/plain") },
                ]).then((r) => report(r, codeFile.name))
              }
            >
              <Share2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </header>

      {!loaded ? null : !p ? (
        <div className="grid flex-1 place-items-center px-6 text-center text-muted">
          <div>
            <p>Önizləmə tapılmadı.</p>
            <p className="mt-1 text-sm text-subtle">
              Studio-da kodu işə salın — nəticə burada görünəcək.
            </p>
            <Link
              to={meta?.path ?? "/"}
              className="mt-4 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
            >
              Studio-ya qayıt
            </Link>
          </div>
        </div>
      ) : isHtml ? (
        <div ref={wrapRef} className="flex min-h-0 flex-1 flex-col bg-white">
          <iframe
            key={nonce}
            ref={frameRef}
            title="HTML önizləmə"
            sandbox={HTML_PREVIEW_SANDBOX}
            allow={HTML_PREVIEW_ALLOW}
            allowFullScreen
            referrerPolicy="no-referrer"
            srcDoc={p.html}
            className="min-h-0 flex-1 border-0 bg-white"
          />
          <div className="shrink-0 border-t border-border bg-bg text-fg">
            <button
              onClick={() => setShowConsole((v) => !v)}
              className="flex h-10 w-full items-center gap-2 px-3 text-left text-xs uppercase tracking-wide text-subtle"
            >
              <Terminal className="size-3.5" />
              Konsol
              {lines.length ? <span className="text-muted">({lines.length})</span> : null}
              {errors ? <span className="text-danger">{errors} xəta</span> : null}
            </button>
            {showConsole ? (
              <div className="max-h-[40dvh] overflow-auto px-4 pb-3 font-mono text-[13px] leading-relaxed">
                {lines.length === 0 ? (
                  <p className="text-subtle">console.log çıxışı burada görünəcək.</p>
                ) : (
                  <LogList
                    items={lines.map((l): LogItem => ({
                      id: String(l.id),
                      kind: "text",
                      tone: l.tone,
                      text: l.text,
                    }))}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-4 py-4">
            {p.note ? (
              <p className="mb-3 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
                {p.note}
              </p>
            ) : null}
            <div className="min-h-24 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed">
              {p.items && p.items.length ? (
                <LogList items={p.items} />
              ) : (
                <p className="text-subtle">
                  {state === "running" ? "İcra olunur…" : "Çıxış yoxdur."}
                </p>
              )}
            </div>
            {p.code ? (
              <details className="mt-4 rounded-lg border border-border bg-surface">
                <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm text-muted">
                  Kod
                </summary>
                <pre className="overflow-auto border-t border-border px-4 py-3 font-mono text-xs leading-relaxed text-fg/90">
                  {p.code}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
