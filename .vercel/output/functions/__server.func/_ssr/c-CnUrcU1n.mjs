import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { b as saveStr, f as download, g as loadStr, h as loadJSON, t as C_SAMPLES, y as saveJSON } from "./studio-BVU5pMZd.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as Handle, c as ToolRow, i as ConsolePane, n as Button, o as NativeSelect, r as CodeEditor, s as Split, t as AppShell, u as uid } from "./split-JmMS_udW.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
import { d as Eraser, f as Download, i as Square, m as Copy, s as Play } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/c-CnUrcU1n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var Input = object({
	code: string().max(4e5),
	compiler: string().max(80),
	stdin: string().max(2e5),
	flags: string().max(2e3)
});
var compileC = createServerFn({ method: "POST" }).validator((d) => Input.parse(d)).handler(createSsrRpc("cf52a77f0df67f2ba245b47f2ca60674e2f19acbf960074470989c9e4fa76dc0"));
async function runCCompile(req, signal) {
	try {
		const r = await fetch("https://wandbox.org/api/compile.json", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			signal,
			body: JSON.stringify({
				code: req.code,
				compiler: req.compiler,
				stdin: req.stdin,
				"compiler-option-raw": req.flags,
				save: false
			})
		});
		if (!r.ok) throw new Error("http");
		return await r.json();
	} catch (e) {
		if (signal?.aborted) throw e;
		return compileC({ data: req });
	}
}
var KEYS = Object.keys(C_SAMPLES);
var PROFILES = {
	balanced: "-std=c17 -Wall -Wextra -Wpedantic -O2",
	debug: "-std=c17 -Wall -Wextra -Wpedantic -Wconversion -Wshadow -O0 -g",
	perf: "-std=c17 -O3 -DNDEBUG",
	custom: ""
};
function CLab() {
	const [code, setCode] = (0, import_react.useState)(C_SAMPLES["Salam dünya"].code);
	const [stdin, setStdin] = (0, import_react.useState)("");
	const [flags, setFlags] = (0, import_react.useState)(PROFILES.balanced);
	const [profile, setProfile] = (0, import_react.useState)("balanced");
	const [compiler, setCompiler] = (0, import_react.useState)("gcc-head-c");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("ok");
	const [label, setLabel] = (0, import_react.useState)("Compiler hazırdır");
	const [items, setItems] = (0, import_react.useState)([]);
	const [elapsed, setElapsed] = (0, import_react.useState)("");
	const abort = (0, import_react.useRef)(null);
	const t0 = (0, import_react.useRef)(0);
	const runRef = (0, import_react.useRef)(() => {});
	const run = (0, import_react.useCallback)(() => runRef.current(), []);
	const onChange = (0, import_react.useCallback)((v) => setCode(v), []);
	const append = (0, import_react.useCallback)((tone, text) => {
		setItems((prev) => [...prev, {
			id: uid(),
			kind: "text",
			tone,
			text
		}]);
	}, []);
	(0, import_react.useEffect)(() => {
		const saved = loadStr("c.code", "");
		if (saved) setCode(saved);
		setStdin(loadStr("c.stdin", ""));
		const f = loadStr("c.flags", PROFILES.balanced);
		setFlags(f);
		setCompiler(loadStr("c.compiler", "gcc-head-c"));
		const st = loadJSON("c.meta", {});
		if (st.compiler) setCompiler(st.compiler);
		setHydrated(true);
		fetch("https://wandbox.org/api/list.json").then((r) => {
			if (!r.ok) throw 0;
			setStatus("ok");
			setLabel("Compiler hazırdır");
		}).catch(() => {
			setStatus("ok");
			setLabel("Uzaq compiler");
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		saveStr("c.code", code);
		saveStr("c.stdin", stdin);
		saveStr("c.flags", flags);
		saveStr("c.compiler", compiler);
		saveJSON("c.meta", { compiler });
	}, [
		code,
		stdin,
		flags,
		compiler,
		hydrated
	]);
	function format(d) {
		const parts = [];
		if (d.compiler_error) parts.push({
			tone: "e",
			text: "COMPILER ERROR\n" + d.compiler_error + "\n"
		});
		if (d.compiler_message && d.compiler_message !== d.compiler_error) parts.push({
			tone: "h",
			text: d.compiler_message + "\n"
		});
		if (d.program_output) parts.push({
			tone: "o",
			text: d.program_output
		});
		if (d.program_error) parts.push({
			tone: "e",
			text: "PROGRAM ERROR\n" + d.program_error + "\n"
		});
		if (!parts.length) parts.push({
			tone: "r",
			text: "Proqram çıxış vermədən uğurla tamamlandı.\n"
		});
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
		runCCompile({
			code,
			compiler,
			stdin,
			flags
		}, ctl.signal).then((d) => {
			const err = Boolean(d.compiler_error || d.program_error || Number(d.status) !== 0);
			format(d).forEach((p) => append(p.tone, p.text.endsWith("\n") ? p.text : p.text + "\n"));
			setStatus(err ? "err" : "ok");
			setLabel(err ? "Xəta" : "Hazırdır");
			setElapsed(Math.round(performance.now() - t0.current) + " ms · exit " + (d.status ?? 0));
		}).catch((e) => {
			if (e.name === "AbortError") return;
			append("e", "Xidmət xətası: " + (e.message || e) + "\n");
			setStatus("err");
			setLabel("Xəta");
		}).finally(() => {
			setBusy(false);
			abort.current = null;
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "c",
		status,
		statusLabel: label,
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: busy ? "stop" : "default",
			size: "lg",
			className: "min-w-[140px] flex-1 md:flex-none",
			onClick: run,
			children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), busy ? "Dayandır" : "Compile & Run"]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
				label: "Nümunələr",
				value: "",
				className: "min-w-[140px]",
				onChange: (k) => {
					if (C_SAMPLES[k]) {
						setCode(C_SAMPLES[k].code);
						setStdin(C_SAMPLES[k].stdin);
					}
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "Nümunələr"
				}), KEYS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: k,
					children: k
				}, k))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
				label: "Compiler",
				value: compiler,
				onChange: setCompiler,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "gcc-head-c",
					children: "GCC"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "clang-head-c",
					children: "Clang"
				})]
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
				onClick: () => download("main.c", code, "text/x-c"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), ".c"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => {
					setCode("");
					setStdin("");
					setItems([]);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Təmizlə"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-auto hidden text-xs text-subtle sm:block",
				children: elapsed || "limitsiz"
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
			orientation: "vertical",
			className: "min-h-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
					defaultSize: "58%",
					minSize: "28%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
						lang: "c",
						value: code,
						onChange,
						onRun: run
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "h-1.5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
					defaultSize: "42%",
					minSize: "20%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-full min-h-0 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid shrink-0 gap-3 border-b border-border bg-surface p-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle",
								children: ["Compiler flags", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-[140px_minmax(0,1fr)] gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
										label: "Profil",
										value: profile,
										onChange: (v) => {
											setProfile(v);
											if (v !== "custom") setFlags(PROFILES[v] || flags);
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "balanced",
												children: "Balanced"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "debug",
												children: "Strict Debug"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "perf",
												children: "Performance"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "custom",
												children: "Custom"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: flags,
										onChange: (e) => {
											setFlags(e.target.value);
											setProfile("custom");
										},
										className: "h-10 rounded-md border border-border bg-elevated px-2 font-mono text-xs text-fg outline-none"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "grid gap-1.5 text-[11px] uppercase tracking-wide text-subtle",
								children: ["stdin", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: stdin,
									onChange: (e) => setStdin(e.target.value),
									rows: 2,
									placeholder: "Proqram üçün giriş",
									className: "rounded-md border border-border bg-elevated p-2 font-mono text-xs text-fg outline-none"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePane, {
							className: "min-h-0 flex-1",
							items,
							empty: "Kodu işə salmaq üçün Compile & Run.",
							header: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Output" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
var SplitComponent = CLab;
//#endregion
export { SplitComponent as component };
