import { AppShell, NativeSelect, ToolRow } from "@/components/app-shell";
import { CodeEditor } from "@/components/code-editor";
import { ConsolePane, type LogItem } from "@/components/console-pane";
import { Button } from "@/components/ui/button";
import { sqlRuntime, type SqlMsg, type SqlTable } from "@/lib/sql-runtime";
import {
  download,
  downloadBytes,
  loadStr,
  saveStr,
  SQL_HINTS,
  SQL_SAMPLES,
} from "@/lib/studio";
import { uid } from "@/lib/utils";
import { Copy, Download, Eraser, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Split, Panel, Handle } from "@/components/split";
import { toast } from "sonner";

const KEYS = Object.keys(SQL_SAMPLES);

export function SqlLab() {
  const [code, setCode] = useState(SQL_SAMPLES["JOIN (3 cədvəl)"]);
  const [hydrated, setHydrated] = useState(false);
  const [ready, setReady] = useState(sqlRuntime.ready);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"load" | "ok" | "run" | "err">(
    sqlRuntime.ready ? "ok" : "load",
  );
  const [label, setLabel] = useState(
    sqlRuntime.ready ? "SQLite hazırdır" : "SQLite yüklənir…",
  );
  const [items, setItems] = useState<LogItem[]>([]);
  const [tables, setTables] = useState<SqlTable[]>([]);
  const [elapsed, setElapsed] = useState("");
  const t0 = useRef(0);
  const timer = useRef<number | null>(null);
  const selection = useRef("");
  const runRef = useRef<() => void>(() => {});
  const run = useCallback(() => runRef.current(), []);
  const onChange = useCallback((v: string) => setCode(v), []);

  const append = useCallback((tone: "o" | "e" | "r" | "h" | "m" | "w", text: string) => {
    setItems((prev) => [...prev, { id: uid(), kind: "text", tone, text }]);
  }, []);

  useEffect(() => {
    const saved = loadStr("sql.code", "");
    if (saved) setCode(saved);
    setHydrated(true);
    sqlRuntime.ensure();
  }, []);

  useEffect(() => {
    if (hydrated) saveStr("sql.code", code);
  }, [code, hydrated]);

  useEffect(() => {
    return sqlRuntime.on((msg: SqlMsg) => {
      if (msg.t === "ready") {
        setReady(true);
        setStatus("ok");
        setLabel("SQLite hazırdır");
      } else if (msg.t === "fatal") {
        setReady(false);
        setStatus("err");
        setLabel("Yükləmə xətası");
        append("e", "SQLite yüklənmədi: " + msg.e + "\n");
      } else if (msg.t === "schema") setTables(msg.list);
      else if (msg.t === "rows") {
        setItems((prev) => [
          ...prev,
          { id: uid(), kind: "table", cols: msg.cols, rows: msg.rows, more: msg.more },
        ]);
      } else if (msg.t === "ok") {
        append(
          "r",
          /^\s*(insert|update|delete|replace)/i.test(msg.sql || "")
            ? `✓ ${msg.changes} sətir təsirləndi\n`
            : "✓ Tamamlandı\n",
        );
      } else if (msg.t === "err") {
        append("e", `✖ SQL xətası${msg.n ? " (" + msg.n + "-ci əmr)" : ""}: ${msg.msg}\n`);
        const h = SQL_HINTS.find(([re]) => re.test(msg.msg));
        if (h) append("h", "İpucu: " + h[1] + "\n");
      } else if (msg.t === "done") {
        setBusy(false);
        if (timer.current) window.clearInterval(timer.current);
        setElapsed((msg.ms / 1000).toFixed(2) + " s");
        setStatus("ok");
        setLabel("SQLite hazırdır");
      } else if (msg.t === "reset") {
        setItems([]);
        append("r", "✓ Nümunə bazası bərpa olundu.\n");
      } else if (msg.t === "file") {
        downloadBytes("nibrascode.sqlite", msg.data, "application/x-sqlite3");
      }
    });
  }, [append]);

  runRef.current = () => {
    if (busy) {
      sqlRuntime.stop();
      setBusy(false);
      append("m", "\n■ İcra dayandırıldı. Baza bərpa olunur…\n");
      setStatus("load");
      setLabel("SQLite yenidən yüklənir…");
      setReady(false);
      return;
    }
    if (!ready) return;
    const sql = selection.current.trim() || code;
    if (!sql.trim()) return;
    setBusy(true);
    setItems([]);
    setStatus("run");
    setLabel("İcra olunur…");
    t0.current = performance.now();
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setElapsed(((performance.now() - t0.current) / 1000).toFixed(1) + " s");
    }, 120);
    sqlRuntime.run(sql);
  };

  return (
    <AppShell
      lang="sql"
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
          value=""
          className="min-w-[160px] flex-1 sm:flex-none"
          onChange={(k) => {
            if (SQL_SAMPLES[k]) setCode(SQL_SAMPLES[k]);
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
        <Button size="sm" disabled={!ready || busy} onClick={() => sqlRuntime.exportDb()}>
          <Download className="size-3.5" />
          .sqlite
        </Button>
        <Button
          size="sm"
          disabled={!ready || busy}
          onClick={() => sqlRuntime.reset()}
        >
          <RotateCcw className="size-3.5" />
          DB sıfırla
        </Button>
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
          {elapsed || "limitsiz"}
        </span>
      </ToolRow>
      <Split orientation="horizontal" className="min-h-0 flex-1 max-md:hidden">
        <Panel defaultSize="22%" minSize="16%" className="bg-surface">
          <Schema tables={tables} onInsert={(s) => setCode((c) => c + (c.endsWith("\n") ? "" : "\n") + s)} />
        </Panel>
        <Handle className="w-1.5" />
        <Panel defaultSize="78%" minSize="40%">
          <EditorAndOut
            code={code}
            onChange={onChange}
            run={run}
            items={items}
            onSelect={selection}
          />
        </Panel>
      </Split>
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <EditorAndOut
          code={code}
          onChange={onChange}
          run={run}
          items={items}
          onSelect={selection}
        />
      </div>
    </AppShell>
  );
}

function Schema({
  tables,
  onInsert,
}: {
  tables: SqlTable[];
  onInsert: (sql: string) => void;
}) {
  return (
    <div className="h-full overflow-auto p-3">
      <p className="mb-3 text-[11px] uppercase tracking-wide text-subtle">Cədvəllər</p>
      {tables.length === 0 ? <p className="text-sm text-muted">Hələ cədvəl yoxdur.</p> : null}
      <div className="flex flex-col gap-3">
        {tables.map((t) => (
          <div key={t.name} className="rounded-md border border-border bg-elevated p-2.5">
            <button
              className="mb-1.5 text-left text-sm font-medium text-fg"
              onClick={() => onInsert(`SELECT * FROM ${t.name} LIMIT 20;`)}
            >
              {t.name}
              {t.type === "view" ? " (view)" : ""}
            </button>
            {t.cols.map((c) => (
              <div key={c.n} className="font-mono text-[11px] text-muted">
                {c.pk ? "PK " : ""}
                {c.n} <span className="text-subtle">{c.t}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorAndOut({
  code,
  onChange,
  run,
  items,
  onSelect,
}: {
  code: string;
  onChange: (v: string) => void;
  run: () => void;
  items: LogItem[];
  onSelect: { current: string };
}) {
  return (
    <Split orientation="vertical" className="h-full min-h-0">
      <Panel defaultSize="55%" minSize="28%">
        <div
          className="h-full"
          onMouseUp={() => {
            onSelect.current = window.getSelection()?.toString() ?? "";
          }}
        >
          <CodeEditor lang="sql" value={code} onChange={onChange} onRun={run} />
        </div>
      </Panel>
      <Handle className="h-1.5" />
      <Panel defaultSize="45%" minSize="18%">
        <ConsolePane
          items={items}
          empty="Sorğunu yazıb Başlat basın. Mətn seçilibsə yalnız seçilmiş sorğu işləyir."
          header={
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle">
              <span>Nəticə</span>
            </div>
          }
        />
      </Panel>
    </Split>
  );
}
