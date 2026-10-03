import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor } from "@/components/code-editor";
import { type LogItem } from "@/components/console-pane";
import { DownloadMenu } from "@/components/download-menu";
import { PreviewStatus } from "@/components/preview-status";
import { Button } from "@/components/ui/button";
import { runCCompile } from "@/lib/compile";
import { getMoreLang, MORE_LANGS } from "@/lib/more-langs";
import { derivePreviewState } from "@/lib/preview-channel";
import { simpleFiles } from "@/lib/project-files";
import { loadJSON, loadStr, saveJSON, saveStr } from "@/lib/studio";
import { usePreview } from "@/lib/use-preview";
import { adaptJava, formatResult, resultFailed } from "@/lib/wandbox";
import { uid } from "@/lib/utils";
import { Copy, Eraser, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Codes = Record<string, string>;

export function MoreLab() {
  const [langId, setLangId] = useState(MORE_LANGS[0].id);
  const lang = getMoreLang(langId);
  const [codes, setCodes] = useState<Codes>({});
  const [stdin, setStdin] = useState(MORE_LANGS[0].stdin ?? "");
  const [flags, setFlags] = useState(MORE_LANGS[0].flags);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"ok" | "run" | "err">("ok");
  const [label, setLabel] = useState("Uzaq compiler");
  const [items, setItems] = useState<LogItem[]>([]);
  const [elapsed, setElapsed] = useState("");
  const abort = useRef<AbortController | null>(null);
  const t0 = useRef(0);
  const runRef = useRef<() => void>(() => {});
  const run = useCallback(() => runRef.current(), []);
  const pv = usePreview("more", lang.label, lang.file);

  const code = codes[langId] ?? lang.sample;
  const onChange = useCallback((v: string) => setCodes((c) => ({ ...c, [langId]: v })), [langId]);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => [...prev, { id: uid(), kind: "text", tone, text }]);
  }, []);

  useEffect(() => {
    const id = loadStr("more.lang", MORE_LANGS[0].id);
    const l = getMoreLang(id);
    setLangId(l.id);
    setCodes(loadJSON<Codes>("more.codes", {}));
    setStdin(loadStr("more.stdin." + l.id, l.stdin ?? ""));
    setFlags(loadStr("more.flags." + l.id, l.flags));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStr("more.lang", langId);
    saveJSON("more.codes", codes);
    saveStr("more.stdin." + langId, stdin);
    saveStr("more.flags." + langId, flags);
  }, [langId, codes, stdin, flags, hydrated]);

  function switchLang(id: string) {
    const l = getMoreLang(id);
    setLangId(l.id);
    setStdin(loadStr("more.stdin." + l.id, l.stdin ?? ""));
    setFlags(loadStr("more.flags." + l.id, l.flags));
    setItems([]);
    setElapsed("");
    setStatus("ok");
    setLabel("Uzaq compiler");
  }

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
      note: `${lang.label} kodu uzaq sandbox compiler xidmətində (wandbox.org) tərtib edilib işləyir — brauzerdə yox.`,
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
      lang="more"
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
        <NativeSelect label="Dil" value={langId} onChange={switchLang} className="min-w-[130px]">
          {MORE_LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </NativeSelect>
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
        <DownloadMenu lang="more" zipName={`${lang.id}-layihe`} files={files} />
        <Button
          size="sm"
          onClick={() => {
            setCodes((c) => ({ ...c, [langId]: lang.sample }));
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
        <CodeEditor key={langId} lang={lang.editor} value={code} onChange={onChange} onRun={run} />
      </div>
      <div className="grid shrink-0 gap-3 border-t border-torder bg-surface p-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
          Compiler / runtime parametrləri
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="(boş ola bilər)"
            className="h-10 rounded-md border border-torder bg-elevated px-2 font-mono text-xs text-fg outline-none"
          />
        </label>
        <label className="grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle">
          stdin
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            placeholder="Proqram üçün giriş"
            className="rounded-md border border-torder bg-elevated p-2 font-mono text-xs text-fg outline-none"
          />
        </label>
      </div>
    </AppShell>
  );
}
