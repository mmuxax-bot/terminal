import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor } from "@/components/code-editor";
import { ConsolePane, type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { runCCompile, type CompileResult } from "@/lib/compile";
import { C_SAMPLES, download, loadJSON, loadStr, saveJSON, saveStr } from "@/lib/studio";
import { uid } from "@/lib/utils";
import { Copy, Download, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Split, Panel, Handle } from "@/components/split";
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
  const run = useCallback(() => runRef.current(), []);
  const onChange = useCallback((v: string) => setCode(v), []);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => [...prev, { id: uid(), kind: "text", tone, text }]);
  }, []);

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

  function format(d: CompileResult) {
    const parts: { tone: "o" | "e" | "r" | "h"; text: string }[] = [];
    if (d.compiler_error) parts.push({ tone: "e", text: "COMPILER ERROR\n" + d.compiler_error + "\n" });
    if (d.compiler_message && d.compiler_message !== d.compiler_error)
      parts.push({ tone: "h", text: d.compiler_message + "\n" });
    if (d.program_output) parts.push({ tone: "o", text: d.program_output });
    if (d.program_error) parts.push({ tone: "e", text: "PROGRAM ERROR\n" + d.program_error + "\n" });
    if (!parts.length) parts.push({ tone: "r", text: "Proqram çıxış vermədən uğurla tamamlandı.\n" });
    return parts;
  }

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
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(true);
    setItems([]);
    setStatus("run");
    setLabel("Kompilyasiya…");
    t0.current = performance.now();
    void runCCompile(
      { code, compiler, stdin, flags },
      ctl.signal,
    )
      .then((d) => {
        const err = Boolean(d.compiler_error || d.program_error || Number(d.status) !== 0);
        format(d).forEach((p) => append(p.tone, p.text.endsWith("\n") ? p.text : p.text + "\n"));
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
        <Button size="sm" onClick={() => download("main.c", code, "text/x-c")}>
          <Download className="size-3.5" />
          .c
        </Button>
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
      <Split orientation="vertical" className="min-h-0 flex-1">
        <Panel defaultSize="58%" minSize="28%">
          <CodeEditor lang="c" value={code} onChange={onChange} onRun={run} />
        </Panel>
        <Handle className="h-1.5" />
        <Panel defaultSize="42%" minSize="20%">
          <div className="flex h-full min-h-0 flex-col">
            <div className="grid shrink-0 gap-3 border-b border-border bg-surface p-3 sm:grid-cols-2">
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
            <ConsolePane
              className="min-h-0 flex-1"
              items={items}
              empty="Kodu işə salmaq üçün Compile & Run."
              header={
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle">
                  <span>Output</span>
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
          </div>
        </Panel>
      </Split>
    </AppShell>
  );
}
