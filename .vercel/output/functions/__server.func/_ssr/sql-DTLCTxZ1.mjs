import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as saveStr, g as loadStr, l as SQL_HINTS, p as downloadBytes, u as SQL_SAMPLES } from "./studio-BVU5pMZd.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as Handle, c as ToolRow, i as ConsolePane, n as Button, o as NativeSelect, r as CodeEditor, s as Split, t as AppShell, u as uid } from "./split-JmMS_udW.mjs";
import { d as Eraser, f as Download, i as Square, m as Copy, o as RotateCcw, s as Play } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as sqlRuntime } from "./sql-runtime-_M684rUr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sql-DTLCTxZ1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEYS = Object.keys(SQL_SAMPLES);
function SqlLab() {
	const [code, setCode] = (0, import_react.useState)(SQL_SAMPLES["JOIN (3 cədvəl)"]);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(sqlRuntime.ready);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)(sqlRuntime.ready ? "ok" : "load");
	const [label, setLabel] = (0, import_react.useState)(sqlRuntime.ready ? "SQLite hazırdır" : "SQLite yüklənir…");
	const [items, setItems] = (0, import_react.useState)([]);
	const [tables, setTables] = (0, import_react.useState)([]);
	const [elapsed, setElapsed] = (0, import_react.useState)("");
	const t0 = (0, import_react.useRef)(0);
	const timer = (0, import_react.useRef)(null);
	const selection = (0, import_react.useRef)("");
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
		const saved = loadStr("sql.code", "");
		if (saved) setCode(saved);
		setHydrated(true);
		sqlRuntime.ensure();
	}, []);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveStr("sql.code", code);
	}, [code, hydrated]);
	(0, import_react.useEffect)(() => {
		return sqlRuntime.on((msg) => {
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
			else if (msg.t === "rows") setItems((prev) => [...prev, {
				id: uid(),
				kind: "table",
				cols: msg.cols,
				rows: msg.rows,
				more: msg.more
			}]);
			else if (msg.t === "ok") append("r", /^\s*(insert|update|delete|replace)/i.test(msg.sql || "") ? `✓ ${msg.changes} sətir təsirləndi\n` : "✓ Tamamlandı\n");
			else if (msg.t === "err") {
				append("e", `✖ SQL xətası${msg.n ? " (" + msg.n + "-ci əmr)" : ""}: ${msg.msg}\n`);
				const h = SQL_HINTS.find(([re]) => re.test(msg.msg));
				if (h) append("h", "İpucu: " + h[1] + "\n");
			} else if (msg.t === "done") {
				setBusy(false);
				if (timer.current) window.clearInterval(timer.current);
				setElapsed((msg.ms / 1e3).toFixed(2) + " s");
				setStatus("ok");
				setLabel("SQLite hazırdır");
			} else if (msg.t === "reset") {
				setItems([]);
				append("r", "✓ Nümunə bazası bərpa olundu.\n");
			} else if (msg.t === "file") downloadBytes("nibrascode.sqlite", msg.data, "application/x-sqlite3");
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
			setElapsed(((performance.now() - t0.current) / 1e3).toFixed(1) + " s");
		}, 120);
		sqlRuntime.run(sql);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "sql",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolRow, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
					label: "Nümunələr",
					value: "",
					className: "min-w-[160px] flex-1 sm:flex-none",
					onChange: (k) => {
						if (SQL_SAMPLES[k]) setCode(SQL_SAMPLES[k]);
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
					disabled: !ready || busy,
					onClick: () => sqlRuntime.exportDb(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), ".sqlite"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					disabled: !ready || busy,
					onClick: () => sqlRuntime.reset(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "DB sıfırla"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => {
						setCode("");
						setItems([]);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Təmizlə"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto hidden text-xs text-subtle sm:block",
					children: elapsed || "limitsiz"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
				orientation: "horizontal",
				className: "min-h-0 flex-1 max-md:hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "22%",
						minSize: "16%",
						className: "bg-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Schema, {
							tables,
							onInsert: (s) => setCode((c) => c + (c.endsWith("\n") ? "" : "\n") + s)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "w-1.5" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "78%",
						minSize: "40%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorAndOut, {
							code,
							onChange,
							run,
							items,
							onSelect: selection
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-0 flex-1 flex-col md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorAndOut, {
					code,
					onChange,
					run,
					items,
					onSelect: selection
				})
			})
		]
	});
}
function Schema({ tables, onInsert }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full overflow-auto p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-[11px] uppercase tracking-wide text-subtle",
				children: "Cədvəllər"
			}),
			tables.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Hələ cədvəl yoxdur."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3",
				children: tables.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-md border border-border bg-elevated p-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "mb-1.5 text-left text-sm font-medium text-fg",
						onClick: () => onInsert(`SELECT * FROM ${t.name} LIMIT 20;`),
						children: [t.name, t.type === "view" ? " (view)" : ""]
					}), t.cols.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-mono text-[11px] text-muted",
						children: [
							c.pk ? "PK " : "",
							c.n,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: c.t
							})
						]
					}, c.n))]
				}, t.name))
			})
		]
	});
}
function EditorAndOut({ code, onChange, run, items, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
		orientation: "vertical",
		className: "h-full min-h-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
				defaultSize: "55%",
				minSize: "28%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full",
					onMouseUp: () => {
						onSelect.current = window.getSelection()?.toString() ?? "";
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
						lang: "sql",
						value: code,
						onChange,
						onRun: run
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "h-1.5" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
				defaultSize: "45%",
				minSize: "18%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePane, {
					items,
					empty: "Sorğunu yazıb Başlat basın. Mətn seçilibsə yalnız seçilmiş sorğu işləyir.",
					header: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Nəticə" })
					})
				})
			})
		]
	});
}
var SplitComponent = SqlLab;
//#endregion
export { SplitComponent as component };
