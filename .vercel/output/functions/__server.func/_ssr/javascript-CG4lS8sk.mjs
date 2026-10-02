import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as download, g as saveStr, i as JS_SAMPLES, m as loadStr, r as JS_HINTS } from "./studio-D8F66u3l.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as NativeSelect, i as Handle, l as uid, n as Button, o as Split, r as CodeEditor, s as ToolRow, t as AppShell } from "./split-CRXWGIF6.mjs";
import { t as ConsolePane } from "./console-pane-6qKuG5hf.mjs";
import { d as Download, i as Square, p as Copy, s as Play, u as Eraser } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/javascript-CG4lS8sk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEYS = Object.keys(JS_SAMPLES);
function JsLab() {
	const [code, setCode] = (0, import_react.useState)(JS_SAMPLES["Salam dünya"]);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [waiting, setWaiting] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("load");
	const [label, setLabel] = (0, import_react.useState)("Hazırlanır…");
	const [items, setItems] = (0, import_react.useState)([]);
	const [elapsed, setElapsed] = (0, import_react.useState)("");
	const frame = (0, import_react.useRef)(null);
	const host = (0, import_react.useRef)(null);
	const t0 = (0, import_react.useRef)(0);
	const timer = (0, import_react.useRef)(null);
	const waitId = (0, import_react.useRef)(null);
	const runRef = (0, import_react.useRef)(() => {});
	const run = (0, import_react.useCallback)(() => runRef.current(), []);
	const onChange = (0, import_react.useCallback)((v) => setCode(v), []);
	const append = (0, import_react.useCallback)((tone, text) => {
		setItems((prev) => {
			const last = prev[prev.length - 1];
			if (last && last.kind === "text" && last.tone === tone) return [...prev.slice(0, -1), {
				...last,
				text: last.text + text
			}];
			return [...prev, {
				id: uid(),
				kind: "text",
				tone,
				text
			}];
		});
	}, []);
	const boot = (0, import_react.useCallback)(() => {
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
	(0, import_react.useEffect)(() => {
		const saved = loadStr("js.code", "");
		if (saved) setCode(saved);
		setHydrated(true);
		boot();
		return () => {
			frame.current?.remove();
			if (timer.current) window.clearInterval(timer.current);
		};
	}, [boot]);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveStr("js.code", code);
	}, [code, hydrated]);
	(0, import_react.useEffect)(() => {
		function onMsg(e) {
			if (!frame.current || e.source !== frame.current.contentWindow || !e.data) return;
			const d = e.data;
			if (d.t === "ready") {
				setReady(true);
				setStatus("ok");
				setLabel("Hazırdır");
				return;
			}
			if (!busy && d.t !== "ready") return;
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
				setBusy(false);
				setWaiting(false);
				setElapsed(((performance.now() - t0.current) / 1e3).toFixed(2) + " s");
				setStatus("ok");
				setLabel("Hazırdır");
				if (!d.ok) {
					append("e", `✖ ${d.name}: ${d.msg}\n`);
					if (d.line) {
						const src = (code.split("\n")[d.line - 1] || "").trim();
						append("e", `  Sətir ${d.line}${src ? ": " + src : ""}\n`);
					}
					if (d.name && JS_HINTS[d.name]) append("h", "İpucu: " + JS_HINTS[d.name] + "\n");
				}
			}
		}
		addEventListener("message", onMsg);
		return () => removeEventListener("message", onMsg);
	}, [
		append,
		busy,
		code
	]);
	runRef.current = () => {
		if (busy) {
			setBusy(false);
			setWaiting(false);
			if (timer.current) window.clearInterval(timer.current);
			append("m", "\n■ İcra dayandırıldı.\n");
			boot();
			return;
		}
		if (!ready || !frame.current?.contentWindow) return;
		setBusy(true);
		setWaiting(false);
		setItems([]);
		setStatus("run");
		setLabel("İcra olunur…");
		t0.current = performance.now();
		if (timer.current) window.clearInterval(timer.current);
		timer.current = window.setInterval(() => {
			setElapsed(((performance.now() - t0.current) / 1e3).toFixed(1) + " s");
		}, 120);
		frame.current.contentWindow.postMessage({
			t: "run",
			code
		}, "*");
	};
	function onInput(v) {
		append("o", v + "\n");
		setWaiting(false);
		setStatus("run");
		setLabel("İcra olunur…");
		t0.current = performance.now();
		if (timer.current) window.clearInterval(timer.current);
		timer.current = window.setInterval(() => {
			setElapsed(((performance.now() - t0.current) / 1e3).toFixed(1) + " s");
		}, 120);
		frame.current?.contentWindow?.postMessage({
			t: "input",
			id: waitId.current,
			v
		}, "*");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "javascript",
		status,
		statusLabel: label,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: busy ? "stop" : "default",
			size: "lg",
			className: "min-w-[118px] flex-1 md:flex-none",
			disabled: !ready && !busy,
			onClick: run,
			children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), busy ? "Dayandır" : "Başlat"]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: host }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
					label: "Nümunələr",
					value: "",
					className: "min-w-[160px] flex-1 sm:flex-none",
					onChange: (k) => {
						if (JS_SAMPLES[k]) setCode(JS_SAMPLES[k]);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "Nümunələr"
					}), KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: k,
						children: k
					}, k))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => {
						navigator.clipboard.writeText(code);
						toast("Kod kopyalandı");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Kopyala"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => download("main.js", code, "text/javascript"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), ".js"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => {
						setCode("");
						setItems([]);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Təmizlə"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "ml-auto hidden text-xs text-subtle sm:block",
					children: ["await input(\"…\") · ", elapsed || "limitsiz"]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
				orientation: "vertical",
				className: "min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "62%",
						minSize: "28%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
							lang: "javascript",
							value: code,
							onChange,
							onRun: run
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "h-1.5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "38%",
						minSize: "18%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePane, {
							items,
							waiting,
							onSubmitInput: onInput,
							empty: "Kodu başladanda nəticə burada görünəcək. input üçün: await input('Sual: ')",
							header: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Konsol" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "text-muted hover:text-fg",
									onClick: () => {
										const t = items.filter((i) => i.kind === "text").map((i) => i.kind === "text" ? i.text : "").join("");
										navigator.clipboard.writeText(t);
										toast("Çıxış kopyalandı");
									},
									children: "Kopyala"
								})]
							})
						})
					})
				]
			})
		]
	});
}
var SplitComponent = JsLab;
//#endregion
export { SplitComponent as component };
