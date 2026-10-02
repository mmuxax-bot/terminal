import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as looksLikeHtml, d as buildHtmlDoc, f as download, h as loadJSON, m as htmlBlobUrl, n as HTML_PREVIEW_ALLOW, r as HTML_SAMPLES, v as openHtmlPreview, y as saveJSON } from "./studio-BVU5pMZd.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as Handle, c as ToolRow, i as ConsolePane, l as cn, n as Button, o as NativeSelect, r as CodeEditor, s as Split, t as AppShell, u as uid } from "./split-JmMS_udW.mjs";
import { a as Smartphone, c as Monitor, d as Eraser, f as Download, m as Copy, r as Tablet, s as Play, u as ExternalLink } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/html-BKOk_ljl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VOID = /* @__PURE__ */ new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr"
]);
var JS_HINTS = {
	SyntaxError: "Yazılış xətası: mötərizə, dırnaq və ya nöqtəli vergül səhvi ola bilər.",
	ReferenceError: "Dəyişən və ya funksiya təyin edilməyib, yaxud adda hərf səhvi var.",
	TypeError: "Dəyər tipi uyğun gəlmir — çox vaxt element tapılmayıb (id səhvdir).",
	RangeError: "Dəyər icazə verilən aralıqdan kənardadır."
};
function lineAt(src, index) {
	let line = 1;
	const end = Math.min(index, src.length);
	for (let i = 0; i < end; i++) if (src.charCodeAt(i) === 10) line++;
	return line;
}
function lintHtml(src) {
	if (!src.trim()) return [];
	const issues = [];
	const stack = [];
	const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)([^>]*?)(\/?)\s*>/gi;
	let m;
	while (m = re.exec(src)) {
		const line = lineAt(src, m.index);
		const raw = m[0];
		if (raw.startsWith("<!--") || /^<!doctype/i.test(raw)) continue;
		if (m[1]) {
			const name = m[1].toLowerCase();
			let idx = stack.length - 1;
			while (idx >= 0 && stack[idx].name !== name) idx--;
			if (idx < 0) issues.push({
				pane: "html",
				line,
				message: `Bağlanış teqi </${name}> üçün açılış yoxdur.`,
				hint: "Açılış teqini əlavə edin və ya bu bağlanışı silin."
			});
			else {
				const inner = stack.slice(idx + 1);
				stack.length = idx;
				for (const s of inner) issues.push({
					pane: "html",
					line: s.line,
					message: `<${s.name}> teqi bağlanmayıb.`,
					hint: `</${s.name}> əlavə edin.`
				});
			}
			continue;
		}
		const name = (m[2] || "").toLowerCase();
		if (!name) continue;
		const attrs = m[3] || "";
		const self = m[4] === "/" || VOID.has(name);
		const quotes = attrs.replace(/\\["']/g, "");
		const dq = (quotes.match(/"/g) || []).length;
		const sq = (quotes.match(/'/g) || []).length;
		if (dq % 2 !== 0 || sq % 2 !== 0) issues.push({
			pane: "html",
			line,
			message: `<${name}> atributunda dırnaq bağlanmayıb.`,
			hint: "Atributu name=\"dəyər\" şəklində yazın."
		});
		if (!self) stack.push({
			name,
			line
		});
	}
	for (const s of stack) issues.push({
		pane: "html",
		line: s.line,
		message: `<${s.name}> teqi bağlanmayıb.`,
		hint: `</${s.name}> əlavə edin.`
	});
	return issues.slice(0, 16);
}
function lintCss(src) {
	if (!src.trim()) return [];
	const issues = [];
	let braces = 0;
	let lastOpen = 1;
	let line = 1;
	let inStr = "";
	let inComment = false;
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		const n = src[i + 1];
		if (inComment) {
			if (c === "*" && n === "/") {
				inComment = false;
				i++;
			} else if (c === "\n") line++;
			continue;
		}
		if (inStr) {
			if (c === "\\") {
				i++;
				continue;
			}
			if (c === inStr) inStr = "";
			else if (c === "\n") {
				issues.push({
					pane: "css",
					line,
					message: "Sətirdə bağlanmamış dırnaq.",
					hint: "Dırnağı eyni sətirdə bağlayın."
				});
				inStr = "";
				line++;
			}
			continue;
		}
		if (c === "/" && n === "*") {
			inComment = true;
			i++;
			continue;
		}
		if (c === "\"" || c === "'") {
			inStr = c;
			continue;
		}
		if (c === "\n") {
			line++;
			continue;
		}
		if (c === "{") {
			braces++;
			lastOpen = line;
			continue;
		}
		if (c === "}") {
			braces--;
			if (braces < 0) {
				issues.push({
					pane: "css",
					line,
					message: "Artıq bağlanış mötərizəsi `}`.",
					hint: "Əlavə `}` silin və ya `{` əlavə edin."
				});
				braces = 0;
			}
		}
	}
	if (inComment) issues.push({
		pane: "css",
		line,
		message: "Şərh bağlanmayıb (`*/` yoxdur).",
		hint: "Şərhin sonuna `*/` yazın."
	});
	if (inStr) issues.push({
		pane: "css",
		line,
		message: "Dırnaq bağlanmayıb.",
		hint: "Açıq dırnağı bağlayın."
	});
	if (braces > 0) issues.push({
		pane: "css",
		line: lastOpen,
		message: `${braces} ədəd \`{\` bağlanmayıb.`,
		hint: "`}` əlavə edin."
	});
	return issues.slice(0, 12);
}
function lintJs(src) {
	if (!src.trim()) return [];
	try {
		new Function(src);
		return [];
	} catch (err) {
		const name = err instanceof Error && err.name ? err.name : "SyntaxError";
		const message = err instanceof Error ? err.message : String(err);
		const stack = err instanceof Error ? err.stack ?? "" : "";
		const fx = err;
		let line = 1;
		let column;
		const m = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/Function:(\d+):(\d+)/) || message.match(/:(\d+):(\d+)/);
		if (typeof fx.lineNumber === "number") {
			line = Math.max(1, fx.lineNumber);
			if (typeof fx.columnNumber === "number") column = fx.columnNumber;
		} else if (m) {
			line = Number(m[1]);
			column = m[2] ? Number(m[2]) : void 0;
			if (stack.includes("<anonymous>") || stack.includes("Function:")) line = Math.max(1, line - 2);
		}
		const clean = message.replace(/^(?:[A-Za-z]*Error:\s*)+/, "");
		return [{
			pane: "js",
			line,
			column,
			message: `${name}: ${clean}`,
			hint: JS_HINTS[name] || JS_HINTS.SyntaxError
		}];
	}
}
function lintWebDoc(html, css, js) {
	return [
		...lintHtml(html),
		...lintCss(css),
		...lintJs(js)
	].slice(0, 20);
}
function hintForJsError(name, message) {
	const msg = message || "";
	if (/null|undefined/i.test(msg) && /property|read|click|of/i.test(msg)) return "Element tapılmadı. HTML-də id-nin düzgün yazıldığına əmin olun.";
	if (name && JS_HINTS[name]) return JS_HINTS[name];
}
var KEYS = Object.keys(HTML_SAMPLES);
var TABS = [
	{
		id: "html",
		label: "HTML",
		lang: "html"
	},
	{
		id: "css",
		label: "CSS",
		lang: "css"
	},
	{
		id: "js",
		label: "JS",
		lang: "javascript"
	}
];
var DEFAULT = HTML_SAMPLES["Kart dizaynı"];
var PANE_LABEL = {
	html: "HTML",
	css: "CSS",
	js: "JS"
};
function HtmlLab() {
	const [doc, setDoc] = (0, import_react.useState)(DEFAULT);
	const [tab, setTab] = (0, import_react.useState)("html");
	const [width, setWidth] = (0, import_react.useState)("full");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [live, setLive] = (0, import_react.useState)(() => buildHtmlDoc(DEFAULT.html, DEFAULT.css, DEFAULT.js, { bridge: true }));
	const [runtime, setRuntime] = (0, import_react.useState)([]);
	const [jumpLine, setJumpLine] = (0, import_react.useState)(0);
	const [jumpSeq, setJumpSeq] = (0, import_react.useState)(0);
	const [status, setStatus] = (0, import_react.useState)("ok");
	const [narrow, setNarrow] = (0, import_react.useState)(false);
	const [logs, setLogs] = (0, import_react.useState)([]);
	const iframeRef = (0, import_react.useRef)(null);
	const blobRef = (0, import_react.useRef)(null);
	const append = (0, import_react.useCallback)((tone, text) => {
		setLogs((prev) => {
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
	(0, import_react.useEffect)(() => {
		const saved = loadJSON("html.doc", null);
		if (saved && typeof saved.html === "string") setDoc(saved);
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveJSON("html.doc", doc);
	}, [doc, hydrated]);
	(0, import_react.useEffect)(() => {
		const q = window.matchMedia("(max-width: 767px)");
		const apply = () => setNarrow(q.matches);
		apply();
		q.addEventListener("change", apply);
		return () => q.removeEventListener("change", apply);
	}, []);
	const built = (0, import_react.useMemo)(() => buildHtmlDoc(doc.html, doc.css, doc.js), [doc]);
	const bridged = (0, import_react.useMemo)(() => buildHtmlDoc(doc.html, doc.css, doc.js, { bridge: true }), [doc]);
	const staticIssues = (0, import_react.useMemo)(() => lintWebDoc(doc.html, doc.css, doc.js), [doc]);
	(0, import_react.useEffect)(() => {
		setRuntime([]);
		const id = window.setTimeout(() => setLive(bridged), 280);
		return () => window.clearTimeout(id);
	}, [bridged]);
	(0, import_react.useEffect)(() => {
		const el = iframeRef.current;
		if (!el) return;
		const url = htmlBlobUrl(live);
		const prev = blobRef.current;
		blobRef.current = url;
		el.removeAttribute("sandbox");
		el.src = url;
		if (prev) URL.revokeObjectURL(prev);
	}, [live]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (blobRef.current) URL.revokeObjectURL(blobRef.current);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		function onMsg(e) {
			const d = e.data;
			if (!d || d.source !== "nibras-html") return;
			if (d.t === "console") {
				if (d.k === "clear") {
					setLogs([]);
					return;
				}
				const tone = d.k === "error" ? "e" : d.k === "warn" ? "w" : "o";
				append(tone, d.s || "");
				return;
			}
			if (d.t !== "error") return;
			const file = (d.file || "").toLowerCase();
			const inUser = file.includes("user.js");
			const issue = {
				pane: inUser || !file || file === "about:srcdoc" ? "js" : "js",
				line: inUser ? d.line || 1 : d.line || 1,
				column: d.col,
				message: `${d.name || "Error"}: ${d.msg || "Xəta"}`,
				hint: hintForJsError(d.name, d.msg)
			};
			append("e", `✖ ${issue.message}\n`);
			if (issue.hint) append("h", `Səbəb: ${issue.hint}\n`);
			setRuntime((prev) => {
				if (prev.some((p) => p.message === issue.message && p.line === issue.line)) return prev;
				return [...prev, issue].slice(0, 12);
			});
		}
		addEventListener("message", onMsg);
		return () => removeEventListener("message", onMsg);
	}, [append]);
	const issues = (0, import_react.useMemo)(() => {
		const seen = /* @__PURE__ */ new Set();
		const out = [];
		for (const it of [...staticIssues, ...runtime]) {
			const k = `${it.pane}:${it.line}:${it.message}`;
			if (seen.has(k)) continue;
			seen.add(k);
			out.push(it);
		}
		return out;
	}, [staticIssues, runtime]);
	(0, import_react.useEffect)(() => {
		setStatus(issues.length ? "err" : "ok");
	}, [issues.length]);
	const openFree = (0, import_react.useCallback)(() => {
		if (!openHtmlPreview(built)) toast("Yeni səhifə bloklandı — önizləmə burada göstərilir");
		else toast("Yeni səhifə açıldı — tam açıq, məhdudiyyət yoxdur");
	}, [built]);
	const onRun = (0, import_react.useCallback)(() => {
		setLogs([]);
		setRuntime([]);
		setLive(bridged);
		openFree();
	}, [bridged, openFree]);
	const onChange = (0, import_react.useCallback)((v) => setDoc((d) => ({
		...d,
		[tab]: v
	})), [tab]);
	const jumpTo = (0, import_react.useCallback)((issue) => {
		setTab(issue.pane);
		setJumpLine(issue.line);
		setJumpSeq((n) => n + 1);
	}, []);
	const onTerm = (0, import_react.useCallback)((raw) => {
		const v = raw.trim();
		if (!v) return;
		append("m", `$ ${v}\n`);
		if (looksLikeHtml(v)) {
			const page = /<html[\s>]/i.test(v) ? v : buildHtmlDoc(v, "", "");
			const ok = openHtmlPreview(page);
			append("r", ok ? "→ yeni səhifədə açıldı (tam açıq)\n" : "→ popup bloklandı\n");
			return;
		}
		const win = iframeRef.current?.contentWindow;
		if (!win) {
			append("e", "Önizləmə hələ hazır deyil.\n");
			return;
		}
		win.postMessage({
			source: "nibras-parent",
			t: "eval",
			code: v
		}, "*");
	}, [append]);
	const current = doc[tab];
	const lang = TABS.find((t) => t.id === tab).lang;
	const diagnostics = (0, import_react.useMemo)(() => issues.filter((i) => i.pane === tab).map((i) => ({
		line: i.line,
		column: i.column,
		message: i.message
	})), [issues, tab]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "html",
		status,
		statusLabel: issues.length ? `${issues.length} xəta` : "Tam açıq önizləmə",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "default",
			size: "lg",
			className: "min-w-[118px] flex-1 md:flex-none",
			onClick: onRun,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), "Başlat"]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ToolRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
				label: "Nümunələr",
				value: "",
				className: "min-w-[160px] flex-1 sm:flex-none",
				onChange: (k) => {
					if (HTML_SAMPLES[k]) setDoc(HTML_SAMPLES[k]);
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
					navigator.clipboard.writeText(current);
					toast("Kod kopyalandı");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "Kopyala"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => download("index.html", built, "text/html"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), ".html"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: () => {
					setDoc({
						html: "",
						css: "",
						js: ""
					});
					setLogs([]);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Təmizlə"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				onClick: openFree,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "Yeni səhifə"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ml-auto hidden items-center gap-1 sm:flex",
				children: [
					["full", Monitor],
					["768", Tablet],
					["390", Smartphone]
				].map(([w, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setWidth(w),
					className: cn("grid size-9 place-items-center rounded-md border border-border text-muted", width === w && "border-accent/40 bg-elevated text-fg"),
					"aria-label": w,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
				}, w))
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 flex-1 flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex shrink-0 gap-1 border-b border-border bg-surface px-2 py-1.5",
					children: TABS.map((t) => {
						const n = issues.filter((i) => i.pane === t.id).length;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTab(t.id),
							className: cn("rounded-md px-3 py-1.5 text-sm", tab === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg"),
							children: [t.label, n > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1.5 text-xs text-danger",
								children: n
							}) : null]
						}, t.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
					orientation: "vertical",
					className: "min-h-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
							defaultSize: "68%",
							minSize: "28%",
							className: "min-h-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
								orientation: narrow ? "vertical" : "horizontal",
								className: "h-full min-h-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
										defaultSize: "52%",
										minSize: "28%",
										className: "min-h-[36%] md:min-h-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
											lang,
											value: current,
											onChange,
											onRun,
											diagnostics,
											jumpLine,
											jumpSeq
										}, tab)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: narrow ? "h-1.5 w-full" : "w-1.5" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
										defaultSize: "48%",
										minSize: "24%",
										className: "min-h-[36%] bg-elevated md:min-h-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex h-full min-h-0 flex-col",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Önizləmə" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: "inline-flex items-center gap-1 normal-case text-muted hover:text-fg",
													onClick: openFree,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "Yeni səhifə"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-h-0 flex-1 overflow-auto bg-elevated p-3",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "relative mx-auto h-full overflow-hidden rounded-md border border-border bg-fg",
													style: {
														width: width === "full" ? "100%" : width === "768" ? 768 : 390,
														maxWidth: "100%",
														height: "100%"
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
														ref: iframeRef,
														title: "Nəticə",
														allow: HTML_PREVIEW_ALLOW,
														allowFullScreen: true,
														referrerPolicy: "no-referrer",
														className: "absolute inset-0 h-full w-full border-0 bg-white"
													})
												})
											})]
										})
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "h-1.5 w-full" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
							defaultSize: "32%",
							minSize: "16%",
							className: "min-h-[140px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsolePane, {
								items: logs,
								empty: "Terminal: console.log burada. HTML yazıb Enter — yeni səhifədə açılır. JS yazıb Enter — önizləmədə işləyir.",
								inputEnabled: true,
								inputPlaceholder: "HTML və ya JS yazın, Enter — yeni səhifə / icra",
								onSubmitInput: onTerm,
								header: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Terminal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 normal-case",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "text-muted hover:text-fg",
											onClick: () => {
												const t = logs.filter((i) => i.kind === "text").map((i) => i.kind === "text" ? i.text : "").join("");
												navigator.clipboard.writeText(t);
												toast("Çıxış kopyalandı");
											},
											children: "Kopyala"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "text-muted hover:text-fg",
											onClick: () => setLogs([]),
											children: "Təmizlə"
										})]
									})]
								})
							})
						})
					]
				}),
				issues.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-28 shrink-0 overflow-auto border-t border-danger/35 bg-danger/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "sticky top-0 border-b border-danger/20 bg-danger/10 px-3 py-1.5 text-[11px] uppercase tracking-wide text-danger",
						children: "Xətalar — səbəb aşağıda, kodda qırmızı sətir"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "px-3 py-2",
						children: issues.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex w-full flex-col items-start gap-0.5 rounded-sm py-1 text-left hover:bg-danger/10",
							onClick: () => jumpTo(it),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[13px] text-danger",
								children: [
									"✖ ",
									PANE_LABEL[it.pane],
									" · sətir ",
									it.line,
									": ",
									it.message
								]
							}), it.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-warn",
								children: ["Səbəb: ", it.hint]
							}) : null]
						}) }, `${it.pane}-${it.line}-${i}`))
					})]
				}) : null
			]
		})]
	});
}
var SplitComponent = HtmlLab;
//#endregion
export { SplitComponent as component };
