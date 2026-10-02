import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as saveStr, c as PY_SAMPLES, f as download, g as loadStr, s as PY_HINTS, y as saveJSON } from "./studio-BVU5pMZd.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as Handle, c as ToolRow, i as ConsolePane, n as Button, o as NativeSelect, r as CodeEditor, s as Split, t as AppShell, u as uid } from "./split-JmMS_udW.mjs";
import { d as Eraser, f as Download, i as Square, m as Copy, s as Play } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as pythonRuntime } from "./python-runtime-DPuzWqGx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/python-azo0cP-w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SAMPLE_KEYS = Object.keys(PY_SAMPLES);
function PythonLab() {
	const [code, setCode] = (0, import_react.useState)(PY_SAMPLES["Salam dünya"].code);
	const [stdin, setStdin] = (0, import_react.useState)("");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(pythonRuntime.ready);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [waiting, setWaiting] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)(pythonRuntime.ready ? "ok" : "load");
	const [label, setLabel] = (0, import_react.useState)(pythonRuntime.ready ? "Python hazırdır" : "Python yüklənir…");
	const [items, setItems] = (0, import_react.useState)([]);
	const [elapsed, setElapsed] = (0, import_react.useState)("");
	const [diags, setDiags] = (0, import_react.useState)([]);
	const inQ = (0, import_react.useRef)([]);
	const shown = (0, import_react.useRef)(0);
	const skip = (0, import_react.useRef)(0);
	const seed = (0, import_react.useRef)(0);
	const t0 = (0, import_react.useRef)(0);
	const timer = (0, import_react.useRef)(null);
	const runRef = (0, import_react.useRef)(() => {});
	const run = (0, import_react.useCallback)(() => {
		runRef.current();
	}, []);
	const onChange = (0, import_react.useCallback)((v) => setCode(v), []);
	(0, import_react.useEffect)(() => {
		const saved = loadStr("py.code", "");
		const savedIn = loadStr("py.stdin", "");
		if (saved) setCode(saved);
		if (savedIn) setStdin(savedIn);
		setHydrated(true);
		pythonRuntime.ensure();
	}, []);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveStr("py.code", code);
	}, [code, hydrated]);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveStr("py.stdin", stdin);
	}, [stdin, hydrated]);
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
	const idle = (0, import_react.useCallback)(() => {
		setBusy(false);
		setWaiting(false);
		if (timer.current) window.clearInterval(timer.current);
	}, []);
	const send = (0, import_react.useCallback)(() => {
		t0.current = performance.now();
		if (timer.current) window.clearInterval(timer.current);
		timer.current = window.setInterval(() => {
			setElapsed(((performance.now() - t0.current) / 1e3).toFixed(1) + " s");
		}, 120);
		pythonRuntime.run(code, inQ.current, seed.current);
	}, [code]);
	(0, import_react.useEffect)(() => {
		return pythonRuntime.on((msg) => {
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
				if (msg.k === "i") setItems((prev) => [...prev, {
					id: uid(),
					kind: "img",
					src: s
				}]);
				else {
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
				setElapsed((msg.ms / 1e3).toFixed(2) + " s");
				setStatus("ok");
				setLabel("Hazırdır");
				if (r.ok) {
					setDiags([]);
					if (r.res) append("r", "→ " + r.res + "\n");
				} else {
					append("e", `✖ ${r.name}: ${r.msg}\n`);
					if (r.line) {
						append("e", `  Sətir ${r.line}${r.src ? ": " + r.src : ""}\n`);
						setDiags([{
							line: r.line,
							message: `${r.name}: ${r.msg}`
						}]);
					} else setDiags([]);
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
	function onInput(v) {
		append("o", v + "\n");
		shown.current += v.length + 1;
		inQ.current.push(v);
		skip.current = shown.current;
		setWaiting(false);
		setStatus("run");
		setLabel("İcra olunur…");
		send();
	}
	const sample = (0, import_react.useMemo)(() => "", []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "python",
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
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
				label: "Nümunələr",
				value: sample,
				className: "min-w-[160px] flex-1 sm:flex-none",
				onChange: (k) => {
					if (PY_SAMPLES[k]) {
						setCode(PY_SAMPLES[k].code);
						setStdin(PY_SAMPLES[k].stdin);
						saveJSON("py.lastSample", k);
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "Nümunələr"
				}), SAMPLE_KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
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
				onClick: () => download("main.py", code, "text/x-python"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), ".py"]
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
				children: ["Ctrl+Enter · ", elapsed || "limitsiz"]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
			orientation: "vertical",
			className: "min-h-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
					defaultSize: "62%",
					minSize: "28%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
						lang: "python",
						value: code,
						onChange,
						onRun: run,
						diagnostics: diags
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "h-1.5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
					defaultSize: "38%",
					minSize: "18%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-full min-h-0 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "shrink-0 border-b border-border bg-surface px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer text-sm text-muted",
								children: "input() dəyərləri"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: stdin,
								onChange: (e) => setStdin(e.target.value),
								rows: 3,
								placeholder: "Hər sətirdə bir dəyər — və ya konsolda canlı cavab verin",
								className: "mt-2 w-full resize-y rounded-md border border-border bg-bg p-2 font-mono text-xs text-fg outline-none"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePane, {
							className: "min-h-0 flex-1",
							items,
							waiting,
							onSubmitInput: onInput,
							empty: "Kodu başladanda nəticə burada görünəcək.",
							header: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Terminal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "text-muted hover:text-fg",
									onClick: () => {
										const t = items.filter((i) => i.kind === "text").map((i) => i.kind === "text" ? i.text : "").join("");
										navigator.clipboard.writeText(t);
										toast("Çıxış kopyalandı");
									},
									children: "Kopyala"
								})]
							})
						})]
					})
				})
			]
		})]
	});
}
var SplitComponent = PythonLab;
//#endregion
export { SplitComponent as component };
