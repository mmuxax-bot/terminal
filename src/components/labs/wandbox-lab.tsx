import { AppShell, ToolRow } from "@/components/app-shell";
import { CodeEditor } from "@/components/code-editor";
import { type LogItem } from "@/components/console-pane";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewStatus } from "@/components/preview-status";
import { Button } from "@/components/ui/button";
import { runCCompile } from "@/lib/compile";
import { getMoreLang, type MoreId } from "@/lib/more-langs";
import { derivePreviewState } from "@/lib/preview-channel";
import { simpleFiles } from "@/lib/project-files";
import { loadJSON, loadStr, saveStr } from "@/lib/studio";
import { usePreview } from "@/lib/use-preview";
import { adaptJava, formatResult, resultFailed } from "@/lib/wandbox";
import { uid } from "@/lib/utils";
import { Copy, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** One language per page (/cpp, /java, …): editor + run through Wandbox; result only in /preview. */
export function WandboxLab({ id }: { id: MoreId }) {
  const lang = getMoreLang(id);
  const [code, setCode] = useState(lang.sample);
  const [stdin, setStdin] = useState(lang.stdin ?? "");
  const [flags, setFlags] = useState(lang.flags);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"ok" | "run" | "err">("ok");
  const [label, setLabel] = useState("Compiler hazırdır");
  const [items, setItems] = useState<LogItem[]>([]);
  const [elapsed, setElapsed] = useState("");
  const abort = useRef<AbortController | null>(null);
  const t0 = useRef(0);
  const runRef = useRef<() => void>(() => {});
  const run = useCallback(() => runRef.current(), []);
  const pv = usePreview(id, lang.label, lang.file);
  const onChange = useCallback((v: string) => setCode(v), []);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => [...prev, { id: uid(), kind: "text", tone, text }]);
  }, []);

  const key = (k: string) => `lab.${id}.${k}`;

  useEffect(() => {
    const legacy = loadJSON<Record<string, string>>("more.codes", {});
    setCode(loadStr(key("code"), legacy[id] ?? lang.sample));
    setStdin(loadStr(key("stdin"), loadStr("more.stdin." + id, lang.stdin ?? "")));
    setFlags(loadStr(key("flags"), loadStr("more.flags." + id, lang.flags)));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!hydrated) return;
    saveStr(key("code"), code);
    saveStr(key("stdin"), stdin);
    saveStr(key("flags"), flags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, code, stdin, flags, hydrated]);

  useEffect(() => {
    pv.push({
      code,
      items,
      state: derivePreviewState({
        busy,
        failed: status === "err",
        hasOutput: items.length > 0,
      }),
      label,
      elapsed: busy ? undefined : elapsed,
      note: `${lang.label} kodu tərtib edilib işlədildi.`,
    });
  }, [code, items, busy, status, label, elapsed, lang.label, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  runRef.current = () => {
    if (busy) {
      abort.current?.abort();
      abort.current = null;
      setBusy(false);
      setStatus("ok");
      setLabel("Dayandırıldı");
      append("m", "İcra dayandırıldı.\n");
      return;
    }
    if (!pv.open({ code, items: [], state: "running", label: "Kompilyasiya…" }))
      toast("Brauzer yeni səhifəni blokladı — «Önizləməni aç» düyməsinə basın.");
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(true);
    setItems([]);
    setStatus("run");
    setLabel("Kompilyasiya və icra…");
    t0.current = performance.now();
    const src = lang.id === "java" ? adaptJava(code) : code;
    void runCCompile({ code: src, compiler: lang.compiler, stdin, flags }, ctl.signal)
      .then((d) => {
        const err = resultFailed(d);
        formatResult(d).forEach((p) =>
          append(p.tone, p.text.endsWith("\n") ? p.text : p.text + "\n"),
        );
        setStatus(err ? "err" : "ok");
        setLabel(err ? "Xəta" : "Hazırdır");
        setElapsed(Math.round(performance.now() - t0.current) + " ms · exit " + (d.status ?? 0));
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        append("e", "Xidmət xətası: " + ((e as Error).message || e) + "\n");
        setStatus("err");
        setLabel("Xəta");
      })
      .finally(() => {
        setBusy(false);
        abort.current = null;
      });
  };

  const files = useMemo(
    () => simpleFiles(lang.file, code, [{ name: "stdin.txt", content: stdin }]),
    [lang.file, code, stdin],
  );

  return (
    <AppShell
      lang={id}
      status={status}
      statusLabel={label}
      actions={
        <Button
          variant={busy ? "stop" : "default"}
          size="lg"
          className="min-w-[140px] flex-1 md:flex-none"
          onClick={run}
        >
          {busy ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {busy ? "Dayandır" : "Compile & Run"}
        </Button>
      }
    >
      <ToolRow>
        <Button
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            toast("Kod kopyalandı");
          }}
        >
          <Copy className="size-3.5" />
          Kopyala
        </Button>
        <DownloadMenu lang={id} zipName={`${lang.id}-layihe`} files={files} />
        <Button
          size="sm"
          onClick={() => {
            setCode(lang.sample);
            setStdin(lang.stdin ?? "");
            setItems([]);
          }}
        >
          <Eraser className="size-3.5" />
          Nümunə
        </Button>
        <span className="ml-auto hidden text-xs text-subtle sm:block">{elapsed || lang.file}</span>
      </ToolRow>
      <PreviewStatus
        href={pv.href}
        target={pv.target}
        state={derivePreviewState({
          busy: busy,
          waiting: false,
          failed: status === "err",
          hasOutput: items.length > 0,
        })}
        opened={pv.opened}
        blocked={pv.blocked}
        onPrime={() => pv.prime()}
      />
      <div className="min-h-0 flex-1">
        <CodeEditor lang={lang.editor} value={code} onChange={onChange} onRun={run} />
      </div>
      <div className="grid shrink-0 gap-3 border-t border-border bg-surface p-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
          Compiler / runtime parametrləri
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="(boş ola bilər)"
            className="h-10 rounded-md border border-border bg-elevated px-2 font-mono text-xs text-fg outline-none"
          />
        </label>
        <label className="grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
          stdin
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            placeholder="Proqram üçün giriş"
            className="rounded-md border border-border bg-elevated p-2 font-mono text-xs text-fg outline-none"
          />
        </label>
      </div>
    </AppShell>
  );
}
