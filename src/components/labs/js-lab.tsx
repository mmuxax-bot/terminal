import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor, type EditorDiagnostic } from "@/components/code-editor";
import { ConsolePane, type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewControls } from "@/components/preview-controls";
import { derivePreviewState } from "@/lib/preview-channel";
import { simpleFiles } from "@/lib/project-files";
import { usePreview } from "@/lib/use-preview";
import { JS_HINTS, JS_SAMPLES, loadStr, saveStr } from "@/lib/studio";
import { uid } from "@/lib/utils";
import { Copy, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Split, Panel, Handle } from "@/components/split";
import { toast } from "sonner";

const KEYS = Object.keys(JS_SAMPLES);

export function JsLab() {
  const [code, setCode] = useState(JS_SAMPLES["Salam dünya"]);
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState<"load" | "ok" | "run" | "err">("load");
  const [label, setLabel] = useState("Hazırlanır…");
  const [items, setItems] = useState<LogItem[]>([]);
  const [elapsed, setElapsed] = useState("");
  const [diags, setDiags] = useState<EditorDiagnostic[]>([]);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);
  const waitId = useRef<number | null>(null);
  const runRef = useRef<() => void>(() => {});
  const busyRef = useRef(false);
  const codeRef = useRef(code);
  codeRef.current = code;
  const pv = usePreview("javascript", "JavaScript", "main.js");
  const run = useCallback(() => runRef.current(), []);
  const onChange = useCallback((v: string) => setCode(v), []);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === "text" && last.tone === tone) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: uid(), kind: "text", tone, text }];
    });
  }, []);

  const boot = useCallback(() => {
    setReady(false);
    setStatus("load");
    setLabel("Hazırlanır…");
    frame.current?.remove();
    const f = document.createElement("iframe");
    f.sandbox.add("allow-scripts");
    f.className = "rf";
    f.title = "runner";
    f.src = "/runtime/js-runner.html";
    host.current?.append(f);
    frame.current = f;
  }, []);

  useEffect(() => {
    pv.push({
      code: code,
      items,
      state: derivePreviewState({
        busy: busy,
        waiting: waiting,
        failed: status === "err",
        hasOutput: items.length > 0,
      }),
      label,
      elapsed: busy ? undefined : elapsed,
      note: "JavaScript brauzerdə, təcrid olunmuş sandbox-da icra olunur.",
    });
  }, [code, items, busy, waiting, status, label, elapsed, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPreview = useCallback(() => {
    const ok = pv.open({ code: code, items, state: "idle", label: "Gözləyir" });
    if (!ok) toast("Yeni səhifə bloklandı — brauzerdə pop-up-a icazə verin.");
  }, [pv, code, items]);

  useEffect(() => {
    const saved = loadStr("js.code", "");
    if (saved) setCode(saved);
    setHydrated(true);
    boot();
    return () => {
      frame.current?.remove();
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [boot]);

  useEffect(() => {
    if (hydrated) saveStr("js.code", code);
  }, [code, hydrated]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!frame.current || e.source !== frame.current.contentWindow || !e.data) return;
      const d = e.data as {
        t: string;
        s?: string;
        k?: string;
        id?: number;
        ok?: number;
        name?: string;
        msg?: string;
        line?: number;
      };
      if (d.t === "ready") {
        setReady(true);
        setStatus("ok");
        setLabel("Hazırdır");
        return;
      }
      if (!busyRef.current && d.t !== "ready") return;
      if (d.t === "out") {
        const tone = d.k === "e" ? "e" : d.k === "w" ? "w" : "o";
        append(tone, d.s || "");
      } else if (d.t === "clear") setItems([]);
      else if (d.t === "res") append("r", "→ " + d.s + "\n");
      else if (d.t === "need") {
        waitId.current = d.id ?? 0;
        setWaiting(true);
        setStatus("run");
        setLabel("Giriş gözlənilir…");
        if (timer.current) window.clearInterval(timer.current);
      } else if (d.t === "done") {
        if (timer.current) window.clearInterval(timer.current);
        busyRef.current = false;
        setBusy(false);
        setWaiting(false);
        setElapsed(((performance.now() - t0.current) / 1000).toFixed(2) + " s");
        setStatus("ok");
        setLabel("Hazırdır");
        if (!d.ok) {
          append("e", `✖ ${d.name}: ${d.msg}\n`);
          if (d.line) {
            const src = (codeRef.current.split("\n")[d.line - 1] || "").trim();
            append("e", `  Sətir ${d.line}${src ? ": " + src : ""}\n`);
            setDiags([{ line: d.line, message: `${d.name}: ${d.msg}` }]);
            setStatus("err");
            setLabel("Xəta");
          }
          if (d.name && JS_HINTS[d.name]) append("h", "İpucu: " + JS_HINTS[d.name] + "\n");
        } else {
          setDiags([]);
        }
      }
    }
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [append]);

  runRef.current = () => {
    if (busyRef.current) {
      busyRef.current = false;
      setBusy(false);
      setWaiting(false);
      if (timer.current) window.clearInterval(timer.current);
      append("m", "\n■ İcra dayandırıldı.\n");
      boot();
      return;
    }
    if (!ready || !frame.current?.contentWindow) return;
    if (pv.autoOpen) {
      const ok = pv.open({ code, items: [], state: "running", label: "İcra olunur…" });
      if (!ok) toast("Yeni səhifə bloklandı — brauzerdə pop-up-a icazə verin.");
    }
    busyRef.current = true;
    setBusy(true);
    setWaiting(false);
    setItems([]);
    setDiags([]);
    setStatus("run");
    setLabel("İcra olunur…");
    t0.current = performance.now();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setElapsed(((performance.now() - t0.current) / 1000).toFixed(1) + " s");
    }, 120);
    frame.current.contentWindow.postMessage({ t: "run", code }, "*");
  };

  const files = useMemo(() => simpleFiles("main.js", code), [code]);

  function onInput(v: string) {
    append("o", v + "\n");
    setWaiting(false);
    setStatus("run");
    setLabel("İcra olunur…");
    t0.current = performance.now();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setElapsed(((performance.now() - t0.current) / 1000).toFixed(1) + " s");
    }, 120);
    frame.current?.contentWindow?.postMessage({ t: "input", id: waitId.current, v }, "*");
  }

  return (
    <AppShell
      lang="javascript"
      status={status}
      statusLabel={label}
      actions={
        <Button
          variant={busy ? "stop" : "default"}
          size="lg"
          className="min-w-[118px] flex-1 md:flex-none"
          disabled={!ready && !busy}
          onClick={run}
        >
          {busy ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {busy ? "Dayandır" : "Başlat"}
        </Button>
      }
    >
      <div ref={host} />
      <ToolRow>
        <NativeSelect
          label="Nümunələr"
          value=""
          className="min-w-[160px] flex-1 sm:flex-none"
          onChange={(k) => {
            if (JS_SAMPLES[k]) setCode(JS_SAMPLES[k]);
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
            void navigator.clipboard.writeText(code);
            toast("Kod kopyalandı");
          }}
        >
          <Copy className="size-3.5" />
          Kopyala
        </Button>
        <DownloadMenu lang="javascript" zipName="javascript-layihe" files={files} />
        <PreviewControls auto={pv.autoOpen} onAuto={pv.setAutoOpen} onOpen={openPreview} />
        <Button
          size="sm"
          onClick={() => {
            setCode("");
            setItems([]);
          }}
        >
          <Eraser className="size-3.5" />
          Təmizlə
        </Button>
        <span className="ml-auto hidden text-xs text-subtle sm:block">
          await input("…") · {elapsed || "limitsiz"}
        </span>
      </ToolRow>
      <Split orientation="vertical" className="min-h-0 flex-1">
        <Panel defaultSize="62%" minSize="28%">
          <CodeEditor
            lang="javascript"
            value={code}
            onChange={onChange}
            onRun={run}
            diagnostics={diags}
          />
        </Panel>
        <Handle className="h-1.5" />
        <Panel defaultSize="38%" minSize="18%">
          <ConsolePane
            items={items}
            waiting={waiting}
            onSubmitInput={onInput}
            empty="Kodu başladanda nəticə burada görünəcək. input üçün: await input('Sual: ')"
            header={
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle">
                <span>Konsol</span>
                <button
                  className="text-muted hover:text-fg"
                  onClick={() => {
                    const t = items
                      .filter((i) => i.kind === "text")
                      .map((i) => (i.kind === "text" ? i.text : ""))
                      .join("");
                    void navigator.clipboard.writeText(t);
                    toast("Çıxış kopyalandı");
                  }}
                >
                  Kopyala
                </button>
              </div>
            }
          />
        </Panel>
      </Split>
    </AppShell>
  );
}
