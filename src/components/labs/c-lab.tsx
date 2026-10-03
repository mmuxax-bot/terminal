import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor } from "@/components/code-editor";
import { type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewStatus } from "@/components/preview-status";
import { derivePreviewState } from "@/lib/preview-channel";
import { simpleFiles } from "@/lib/project-files";
import { usePreview } from "@/lib/use-preview";
import { runCCompile } from "@/lib/compile";
import { formatResult, resultFailed } from "@/lib/wandbox";
import { C_SAMPLES, loadJSON, loadStr, saveJSON, saveStr } from "@/lib/studio";
import { uid } from "@/lib/utils";
import { Copy, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const KEYS = Object.keys(C_SAMPLES);
const PROFILES: Record<string, string> = {
  balanced: "-std=c17 -Wall -Wextra -Wpedantic -O2",
  debug: "-std=c17 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -O0 -g",
  perf: "-std=c17 -O3 -DNDEBUG",
  custom: "",
};

export function CLab() {
  const [code, setCode] = useState(C_SAMPLES["Salam dünya"].code);
  const [stdin, setStdin] = useState("");
  const [flags, setFlags] = useState(PROFILES.balanced);
  const [profile, setProfile] = useState("balanced");
  const [compiler, setCompiler] = useState("gcc-head-c");
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"load" | "ok" | "run" | "err">("ok");
  const [label, setLabel] = useState("Compiler hazırdır");
  const [items, setItems] = useState<LogItem[]>([]);
  const [elapsed, setElapsed] = useState("");
  const abort = useRef<AbortController | null>(null);
  const t0 = useRef(0);
  const runRef = useRef<() => void>(() => {});
  const pv = usePreview("c", "C", "main.c");
  const run = useCallback(() => runRef.current(), []);
  const onChange = useCallback((v: string) => setCode(v), []);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => [...prev, { id: uid(), kind: "text", tone, text }]);
  }, []);

  useEffect(() => {
    pv.push({
      code: code,
      items,
      state: derivePreviewState({
        busy: busy,
        waiting: false,
        failed: status === "err",
        hasOutput: items.length > 0,
      }),
      label,
      elapsed: busy ? undefined : elapsed,
      note: "C kodu uzaq sandbox compiler xidmətində (wandbox.org) tərtib edilib işləyir.",
    });
  }, [code, items, busy, false, status, label, elapsed, pv.push]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = loadStr("c.code", "");
    if (saved) setCode(saved);
    setStdin(loadStr("c.stdin", ""));
    const f = loadStr("c.flags", PROFILES.balanced);
    setFlags(f);
    setCompiler(loadStr("c.compiler", "gcc-head-c"));
    const st = loadJSON<{ compiler?: string }>("c.meta", {});
    if (st.compiler) setCompiler(st.compiler);
    setHydrated(true);
    fetch("https://wandbox.org/api/list.json")
      .then((r) => {
        if (!r.ok) throw 0;
        setStatus("ok");
        setLabel("Compiler hazırdır");
      })
      .catch(() => {
        setStatus("ok");
        setLabel("Uzaq compiler");
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStr("c.code", code);
    saveStr("c.stdin", stdin);
    saveStr("c.flags", flags);
    saveStr("c.compiler", compiler);
    saveJSON("c.meta", { compiler });
  }, [code, stdin, flags, compiler, hydrated]);

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
    setLabel("Kompilyasiya…");
    t0.current = performance.now();
    void runCCompile({ code, compiler, stdin, flags }, ctl.signal)
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
    () => simpleFiles("main.c", code, [{ name: "stdin.txt", content: stdin }]),
    [code, stdin],
  );

  return (
    <AppShell
      lang="c"
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
        <NativeSelect
          label="Nümunələr"
          value=""
          className="min-w-[140px]"
          onChange={(k) => {
            if (C_SAMPLES[k]) {
              setCode(C_SAMPLES[k].code);
              setStdin(C_SAMPLES[k].stdin);
            }
          }}
        >
          <option value="">Nümunələr</option>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect label="Compiler" value={compiler} onChange={setCompiler}>
          <option value="gcc-head-c">GCC</option>
          <option value="clang-head-c">Clang</option>
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
        <DownloadMenu lang="c" zipName="c-layihe" files={files} />
        <Button
          size="sm"
          onClick={() => {
            setCode("");
            setStdin("");
            setItems([]);
          }}
        >
          <Eraser className="size-3.5" />
          Təmizlə
        </Button>
        <span className="ml-auto hidden text-xs text-subtle sm:block">{elapsed || "limitsiz"}</span>
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
        <CodeEditor lang="c" value={code} onChange={onChange} onRun={run} />
      </div>
      <div className="grid shrink-0 gap-3 border-t border-border bg-surface p-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
          Compiler flags
          <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-2">
            <NativeSelect
              label="Profil"
              value={profile}
              onChange={(v) => {
                setProfile(v);
                if (v !== "custom") setFlags(PROFILES[v] || flags);
              }}
            >
              <option value="balanced">Balanced</option>
              <option value="debug">Strict Debug</option>
              <option value="perf">Performance</option>
              <option value="custom">Custom</option>
            </NativeSelect>
            <input
              value={flags}
              onChange={(e) => {
                setFlags(e.target.value);
                setProfile("custom");
              }}
              className="h-10 rounded-md border border-border bg-elevated px-2 font-mono text-xs text-fg outline-none"
            />
          </div>
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
