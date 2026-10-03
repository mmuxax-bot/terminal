import { createFileRoute } from "@tanstack/react-router";
import { LogList, type LogItem } from "@/components/console-pane";
import { InputBar } from "@/components/input-bar";
import { decodeRunHash, type RunLang } from "@/lib/run-link";
import { pythonRuntime, type PyMsg } from "@/lib/python-runtime";
import { HTML_PREVIEW_ALLOW, HTML_PREVIEW_SANDBOX, buildHtmlDoc, saveStr } from "@/lib/studio";
import { lastPrompt, uid } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * /run#l=python|html|javascript&c=<base64url kod>[&z=1]
 * Kod hash-də gəlir (serverə getmir) və səhifə açılan kimi avtomatik işləyir.
 * Nibras AI-dəki «Aç» düyməsi bu səhifəni yeni tabda açır.
 */
export const Route = createFileRoute("/run")({
  component: RunPage,
  head: () => ({
    meta: [{ title: "Nəticə · NibrasCode" }, { name: "robots", content: "noindex" }],
  }),
});

type Loaded = { lang: RunLang; code: string };

const JS_WRAP_HEAD = `<!doctype html><html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>JavaScript</title>
<style>body{margin:0;background:#070b12;color:#e6edf3;font:13px/1.6 ui-monospace,Menlo,Consolas,monospace}
#o{margin:0;padding:16px;white-space:pre-wrap;word-break:break-word}.e{color:#ff7b72}.w{color:#e3b341}</style></head>
<body><pre id="o"></pre><script>
(function(){var o=document.getElementById("o");
function f(a){return Array.prototype.map.call(a,function(v){if(typeof v==="string")return v;
if(v instanceof Error)return v.name+": "+v.message;try{return JSON.stringify(v)}catch(e){return String(v)}}).join(" ")}
function add(t,c){var s=document.createElement("span");if(c)s.className=c;s.textContent=t+"\\n";o.appendChild(s)}
["log","info","debug"].forEach(function(k){console[k]=function(){add(f(arguments))}});
console.warn=function(){add(f(arguments),"w")};console.error=function(){add(f(arguments),"e")};
window.addEventListener("error",function(e){add("✖ "+(e.error&&e.error.name||"Error")+": "+e.message+(e.lineno?" (sətir "+e.lineno+")":""),"e")});
window.addEventListener("unhandledrejection",function(e){add("✖ "+(e.reason&&e.reason.message||e.reason),"e")});
})();
</script><script>
`;

function jsDoc(code: string) {
  return JS_WRAP_HEAD + code.replace(/<\/script/gi, "<\\/script") + "\n</script></body></html>";
}

function Bar({
  title,
  status,
  tone,
  children,
}: {
  title: string;
  status: string;
  tone: "load" | "run" | "ok" | "err";
  children?: React.ReactNode;
}) {
  const dot = {
    load: "bg-subtle animate-pulse",
    run: "bg-accent animate-pulse",
    ok: "bg-ok",
    err: "bg-danger",
  }[tone];
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-3 text-sm">
      <p className="font-semibold tracking-tight">
        Nibras<span className="text-accent">Code</span>
      </p>
      <span className="text-subtle">·</span>
      <p className="truncate text-muted">{title}</p>
      <p className="flex items-center gap-1.5 text-xs text-muted" role="status" data-testid="run-status">
        <span className={`size-1.5 rounded-full ${dot}`} />
        {status}
      </p>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}

const btn =
  "inline-flex h-8 items-center rounded-md border border-border bg-elevated px-3 text-xs text-fg hover:border-accent";

function HtmlRun({ doc, title, children }: { doc: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <Bar title={title} status="Hazırdır" tone="ok">
        {children}
      </Bar>
      <iframe
        title="Nəticə"
        data-testid="run-frame"
        sandbox={HTML_PREVIEW_SANDBOX}
        allow={HTML_PREVIEW_ALLOW}
        allowFullScreen
        referrerPolicy="no-referrer"
        srcDoc={doc}
        className="min-h-0 flex-1 border-0 bg-white"
      />
    </div>
  );
}

function PythonRun({ code }: { code: string }) {
  const [items, setItems] = useState<LogItem[]>([]);
  const [status, setStatus] = useState<"load" | "run" | "ok" | "err">("load");
  const [label, setLabel] = useState("Python yüklənir…");
  const [waiting, setWaiting] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const inQ = useRef<string[]>([]);
  const shown = useRef(0);
  const skip = useRef(0);
  const started = useRef(false);

  const append = useCallback((tone: "o" | "e" | "r" | "h", text: string) => {
    setItems((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === "text" && last.tone === tone)
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      return [...prev, { id: uid(), kind: "text", tone, text }];
    });
  }, []);

  const start = useCallback(() => {
    setItems([]);
    setWaiting(false);
    setElapsed("");
    inQ.current = [];
    shown.current = 0;
    skip.current = 0;
    setStatus("run");
    setLabel("İcra olunur…");
    pythonRuntime.run(code, [], Math.floor(Math.random() * 1e9));
  }, [code]);

  useEffect(() => {
    const off = pythonRuntime.on((msg: PyMsg) => {
      if (msg.t === "ready") {
        if (!started.current) {
          started.current = true;
          start();
        }
      } else if (msg.t === "fatal") {
        setStatus("err");
        setLabel("Yükləmə xətası");
        append("e", "Python yüklənmədi: " + msg.e + "\nİnternet bağlantısını yoxlayıb səhifəni yeniləyin.\n");
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
        if (msg.k === "i") setItems((prev) => [...prev, { id: uid(), kind: "img", src: s }]);
        else append(msg.k === "e" ? "e" : msg.k === "r" ? "r" : "o", s);
      } else if (msg.t === "done") {
        const r = msg.r;
        if (r.need) {
          setWaiting(true);
          setStatus("run");
          setLabel("Giriş gözlənilir…");
          return;
        }
        setElapsed((msg.ms / 1000).toFixed(2) + " s");
        if (r.ok) {
          if (r.res) append("r", "→ " + r.res + "\n");
          setStatus("ok");
          setLabel("Hazırdır");
        } else {
          append("e", `✖ ${r.name}: ${r.msg}\n`);
          if (r.line) append("e", `  Sətir ${r.line}${r.src ? ": " + r.src : ""}\n`);
          setStatus("err");
          setLabel("Xəta");
        }
      }
    });
    pythonRuntime.ensure();
    // Runtime artıq hazırdırsa (SPA keçidi) dərhal başlat
    if (pythonRuntime.ready && !started.current) {
      started.current = true;
      start();
    }
    return off;
  }, [append, start]);

  function onInput(v: string) {
    append("o", v + "\n");
    shown.current += v.length + 1;
    inQ.current.push(v);
    skip.current = shown.current;
    setWaiting(false);
    setStatus("run");
    setLabel("İcra olunur…");
    pythonRuntime.run(code, inQ.current, Math.floor(Math.random() * 1e9));
  }

  function openInStudio() {
    saveStr("py.code", code);
    window.open("/python", "_blank", "noopener");
  }

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <Bar title="Python" status={label + (elapsed ? ` · ${elapsed}` : "")} tone={status}>
        <button className={btn} onClick={() => { started.current = true; start(); }} disabled={status === "load"}>
          Yenidən işlə
        </button>
        <button className={btn} onClick={openInStudio}>
          Studiyada aç
        </button>
      </Bar>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div
            data-testid="run-output"
            className="min-h-24 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-[13px] leading-relaxed"
          >
            {items.length ? (
              <LogList items={items} />
            ) : (
              <p className="text-subtle">{status === "ok" ? "Çıxış yoxdur." : label}</p>
            )}
          </div>
          <details className="mt-4 rounded-lg border border-border bg-surface">
            <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm text-muted">
              Kod
            </summary>
            <pre className="overflow-auto border-t border-border px-4 py-3 font-mono text-xs leading-relaxed text-fg/90">
              {code}
            </pre>
          </details>
        </div>
      </div>
      {waiting ? <InputBar prompt={lastPrompt(items)} onSubmit={onInput} /> : null}
    </div>
  );
}

function RunPage() {
  const [state, setState] = useState<
    { s: "wait" } | { s: "err"; msg: string } | { s: "ok"; v: Loaded }
  >({ s: "wait" });

  useEffect(() => {
    let alive = true;
    const load = () =>
      void decodeRunHash(window.location.hash).then((r) => {
        if (!alive) return;
        setState(r.ok ? { s: "ok", v: { lang: r.lang, code: r.code } } : { s: "err", msg: r.error });
      });
    load();
    window.addEventListener("hashchange", load);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", load);
    };
  }, []);

  if (state.s === "wait")
    return (
      <div className="grid h-dvh place-items-center bg-bg text-muted">
        <p>Yüklənir…</p>
      </div>
    );
  if (state.s === "err")
    return (
      <div className="grid h-dvh place-items-center bg-bg px-6 text-center text-fg">
        <div>
          <p className="text-lg font-semibold">
            Nibras<span className="text-accent">Code</span>
          </p>
          <p data-testid="run-error" className="mt-3 text-danger">
            {state.msg}
          </p>
          <a
            href="/"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Studiyaya get
          </a>
        </div>
      </div>
    );

  const { lang, code } = state.v;
  const key = lang + ":" + code;
  if (lang === "python") return <PythonRun key={key} code={code} />;
  if (lang === "javascript") return <HtmlRun key={key} title="JavaScript" doc={jsDoc(code)} />;
  return <HtmlRun key={key} title="HTML" doc={buildHtmlDoc(code, "", "", { bridge: true })} />;
}
