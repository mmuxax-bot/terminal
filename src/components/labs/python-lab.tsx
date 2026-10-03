import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor, type EditorDiagnostic } from "@/components/code-editor";
import { type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { DownloadMenu } from "@/components/download-menu";
import { InputBar } from "@/components/input-bar";
import { PreviewStatus } from "@/components/preview-status";
import { derivePreviewState } from "@/lib/preview-channel";
import { simpleFiles } from "@/lib/project-files";
import { usePreview } from "@/lib/use-preview";
import { pythonRuntime, type PyMsg } from "@/lib/python-runtime";
import { loadStr, PY_HINTS, PY_SAMPLES, saveJSON, saveStr } from "@/lib/studio";
import { uid, lastPrompt } from "@/lib/utils";
import { Copy, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const SAMPLE_KEYS = Object.keys(PY_SAMPLES);

export function PythonLab() {
  const [code, setCode] = useState(PY_SAMPLES["Salam dünya"].code);
  const [stdin, setStdin] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(pythonRuntime.ready);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [status, setStatus] = useState<"load" | "ok" | "run" | "err">(
    pythonRuntime.ready ? "ok" : "load",
  );
  const [label, setLabel] = useState(pythonRuntime.ready ? "Python hazırdır" : "Python yüklənir…");
  const [items, setItems] = useState<LogItem[]>([]);
  const [elapsed, setElapsed] = useState("");
  const [diags, setDiags] = useState<EditorDiagnostic[]>([]);
  const inQ = useRef<string[]>([]);
  const shown = useRef(0);
  const skip = useRef(0);
  const seed = useRef(0);
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);
  const runRef = useRef<() => void>(() => {});

  const pv = usePreview("python", "Python", "main.py");
  const run = useCallback(() => {
    runRef.current();
  }, []);
  const onChange = useCallback((v: string) => setCode(v), []);

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
      note: "Python brauzerdə (Pyodide/WebAssembly) icra olunur.",
    });
  }, [code, items, busy, waiting, status, label, elapsed, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = loadStr("py.code", "");
    const savedIn = loadStr("py.stdin", "");
    if (saved) setCode(saved);
    if (savedIn) setStdin(savedIn);
    setHydrated(true);
    pythonRuntime.ensure();
  }, []);

  useEffect(() => {
    if (hydrated) saveStr("py.code", code);
  }, [code, hydrated]);
  useEffect(() => {
    if (hydrated) saveStr("py.stdin", stdin);
  }, [stdin, hydrated]);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === "text" && last.tone === tone) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { id: uid(), kind: "text", tone, text }];
    });
  }, []);

  const idle = useCallback(() => {
    setBusy(false);
    setWaiting(false);
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  const send = useCallback(() => {
    t0.current = performance.now();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setElapsed(((performance.now() - t0.current) / 1000).toFixed(1) + " s");
    }, 120);
    pythonRuntime.run(code, inQ.current, seed.current);
  }, [code]);

  useEffect(() => {
    return pythonRuntime.on((msg: PyMsg) => {
      if (msg.t === "ready") {
        setReady(true);
        setStatus("ok");
        setLabel("Python hazırdır");
      } else if (msg.t === "fatal") {
        setReady(false);
        setStatus("err");
        setLabel("Yükləmə xətası");
        append("e", "Python yüklənmədi: " + msg.e + "\n");
      } else if (msg.t === "pkg") {
        setStatus("load");
        setLabel(msg.names.join(", ") + " yüklənir…");
      } else if (msg.t === "out") {
        let s = msg.s;
        if (skip.current) {
          const c = Math.min(skip.current, s.length);
          skip.current -= c;
          s = s.slice(c);
        }
        if (!s) return;
        shown.current += s.length;
        if (msg.k === "i") {
          setItems((prev) => [...prev, { id: uid(), kind: "img", src: s }]);
        } else {
          const tone = msg.k === "e" ? "e" : msg.k === "r" ? "r" : "o";
          append(tone, s);
        }
      } else if (msg.t === "done") {
        const r = msg.r;
        if (r.need) {
          if (timer.current) window.clearInterval(timer.current);
          setWaiting(true);
          setStatus("run");
          setLabel("Giriş gözlənilir…");
          return;
        }
        idle();
        setElapsed((msg.ms / 1000).toFixed(2) + " s");
        setStatus("ok");
        setLabel("Hazırdır");
        if (r.ok) {
          setDiags([]);
          if (r.res) append("r", "→ " + r.res + "\n");
        } else {
          append("e", `✖ ${r.name}: ${r.msg}\n`);
          if (r.line) {
            append("e", `  Sətir ${r.line}${r.src ? ": " + r.src : ""}\n`);
            setDiags([{ line: r.line, message: `${r.name}: ${r.msg}` }]);
          } else {
            setDiags([]);
          }
          setStatus("err");
          setLabel("Xəta");
          if (r.name && PY_HINTS[r.name]) append("h", "İpucu: " + PY_HINTS[r.name] + "\n");
        }
      }
    });
  }, [append, idle]);

  runRef.current = () => {
    if (busy) {
      pythonRuntime.stop();
      idle();
      append("m", "\n■ İcra dayandırıldı.\n");
      setStatus("load");
      setLabel("Python yenidən yüklənir…");
      setReady(false);
      return;
    }
    if (!ready) return;
    if (!pv.open({ code, items: [], state: "running", label: "İcra olunur…" }))
      toast("Brauzer yeni səhifəni blokladı — «Önizləməni aç» düyməsinə basın.");
    setBusy(true);
    setWaiting(false);
    setItems([]);
    setDiags([]);
    inQ.current = stdin ? stdin.split(/\r?\n/) : [];
    shown.current = 0;
    skip.current = 0;
    seed.current = Math.floor(Math.random() * 1e9);
    setStatus("run");
    setLabel("İcra olunur…");
    send();
  };

  function onInput(v: string) {
    append("o", v + "\n");
    shown.current += v.length + 1;
    inQ.current.push(v);
    skip.current = shown.current;
    setWaiting(false);
    setStatus("run");
    setLabel("İcra olunur…");
    send();
  }

  const sample = useMemo(() => "", []);
  const files = useMemo(
    () => simpleFiles("main.py", code, [{ name: "stdin.txt", content: stdin }]),
    [code, stdin],
  );

  return (
    <AppShell
      lang="python"
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
      <ToolRow>
        <NativeSelect
          label="Nümunələr"
          value={sample}
          className="min-w-[160px] flex-1 sm:flex-none"
          onChange={(k) => {
            if (PY_SAMPLES[k]) {
              setCode(PY_SAMPLES[k].code);
              setStdin(PY_SAMPLES[k].stdin);
              saveJSON("py.lastSample", k);
            }
          }}
        >
          <option value="">Nümunələr</option>
          {SAMPLE_KEYS.map((k) => (
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
        <DownloadMenu lang="python" zipName="python-layihe" files={files} />
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
          Ctrl+Enter · {elapsed || "limitsiz"}
        </span>
      </ToolRow>
      <PreviewStatus
        href={pv.href}
        target={pv.target}
        state={derivePreviewState({
          busy: busy,
          waiting: waiting,
          failed: status === "err",
          hasOutput: items.length > 0,
        })}
        opened={pv.opened}
        blocked={pv.blocked}
        onPrime={() => pv.prime()}
      />
      <div className="min-h-0 flex-1">
        <CodeEditor
          lang="python"
          value={code}
          onChange={onChange}
          onRun={run}
          diagnostics={diags}
        />
      </div>
      <details className="shrink-0 border-t border-border bg-surface px-3 py-2">
        <summary className="flex min-h-9 cursor-pointer items-center text-sm text-muted">
          input() dəyərləri
        </summary>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          placeholder="Hər sətirdə bir dəyər — və ya işləyərkən cavab verin"
          className="mt-2 w-full resize-y rounded-md border border-border bg-bg p-2 font-mono text-xs text-fg outline-none"
        />
      </details>
      {waiting ? <InputBar prompt={lastPrompt(items)} onSubmit={onInput} /> : null}
    </AppShell>
  );
}
