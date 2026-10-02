import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { d as download, h as saveJSON, n as HTML_SAMPLES, p as loadJSON, u as buildHtmlDoc } from "./studio-D8F66u3l.mjs";
import { t as co } from "../_libs/react-resizable-panels.mjs";
import { a as NativeSelect, c as cn, i as Handle, n as Button, o as Split, r as CodeEditor, s as ToolRow, t as AppShell } from "./split-CRXWGIF6.mjs";
import { a as Smartphone, c as Monitor, d as Download, p as Copy, r as Tablet, u as Eraser } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/html-DpG2u-Pt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
function HtmlLab() {
	const [doc, setDoc] = (0, import_react.useState)(DEFAULT);
	const [tab, setTab] = (0, import_react.useState)("html");
	const [width, setWidth] = (0, import_react.useState)("full");
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const [live, setLive] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const saved = loadJSON("html.doc", null);
		if (saved && typeof saved.html === "string") setDoc(saved);
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (hydrated) saveJSON("html.doc", doc);
	}, [doc, hydrated]);
	const built = (0, import_react.useMemo)(() => buildHtmlDoc(doc.html, doc.css, doc.js), [doc]);
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => setLive(built), 280);
		return () => window.clearTimeout(id);
	}, [built]);
	const onRun = (0, import_react.useCallback)(() => setLive(built), [built]);
	const onChange = (0, import_react.useCallback)((v) => setDoc((d) => ({
		...d,
		[tab === "js" ? "js" : tab]: v
	})), [tab]);
	const current = tab === "js" ? doc.js : doc[tab];
	const lang = TABS.find((t) => t.id === tab).lang;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		lang: "html",
		status: "ok",
		statusLabel: "Canlı önizləmə",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "default",
			size: "lg",
			className: "min-w-[118px] flex-1 md:flex-none",
			onClick: onRun,
			children: "Yenilə"
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
				onClick: () => setDoc({
					html: "",
					css: "",
					js: ""
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Təmizlə"]
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
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 gap-1 border-b border-border bg-surface px-2 py-1.5",
				children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t.id),
					className: cn("rounded-md px-3 py-1.5 text-sm", tab === t.id ? "bg-elevated text-fg" : "text-muted hover:text-fg"),
					children: t.label
				}, t.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Split, {
				orientation: "horizontal",
				className: "min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "52%",
						minSize: "28%",
						className: "min-h-[40%] md:min-h-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeEditor, {
							lang,
							value: current,
							onChange,
							onRun
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, { className: "w-1.5 max-md:h-1.5 max-md:w-full" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(co, {
						defaultSize: "48%",
						minSize: "24%",
						className: "min-h-[40%] bg-elevated md:min-h-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-full min-h-0 flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-10 shrink-0 items-center justify-between border-b border-border px-3 text-[11px] uppercase tracking-wide text-subtle",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Önizləmə" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "normal-case text-subtle",
									children: "sandbox"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "min-h-0 flex-1 overflow-auto bg-elevated p-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto h-full overflow-hidden rounded-md border border-border bg-fg",
									style: {
										width: width === "full" ? "100%" : width === "768" ? 768 : 390,
										maxWidth: "100%",
										height: "100%"
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
										title: "Nəticə",
										sandbox: "allow-scripts allow-forms allow-modals allow-popups allow-downloads",
										srcDoc: live,
										className: "h-full w-full border-0 bg-white"
									})
								})
							})]
						})
					})
				]
			})]
		})]
	});
}
var SplitComponent = HtmlLab;
//#endregion
export { SplitComponent as component };
