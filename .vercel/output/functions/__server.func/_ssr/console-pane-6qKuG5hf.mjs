import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as cn } from "./split-CRXWGIF6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/console-pane-6qKuG5hf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TONE = {
	o: "text-fg/90",
	e: "text-danger",
	r: "text-ok",
	h: "text-warn",
	m: "text-muted",
	w: "text-warn"
};
function ConsolePane({ items, empty, waiting, onSubmitInput, header, className }) {
	const end = (0, import_react.useRef)(null);
	const input = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		end.current?.scrollIntoView({ block: "end" });
	}, [items, waiting]);
	(0, import_react.useEffect)(() => {
		if (waiting) input.current?.focus();
	}, [waiting]);
	function submit(e) {
		e.preventDefault();
		const v = input.current?.value ?? "";
		onSubmitInput?.(v);
		if (input.current) input.current.value = "";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex h-full min-h-0 flex-col bg-bg", className),
		children: [header, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed",
			children: [
				items.length === 0 && !waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-subtle",
					children: empty
				}) : null,
				items.map((it) => {
					if (it.kind === "text") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("whitespace-pre-wrap break-words", TONE[it.tone]),
						children: it.text
					}, it.id);
					if (it.kind === "img") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: it.src,
						alt: "Qrafik",
						className: "my-3 max-w-full rounded-md border border-border"
					}, it.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "my-3 overflow-auto rounded-md border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "console-table",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: it.cols.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: c }, c)) }) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: it.rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.map((v, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: v === null ? "nil" : typeof v === "number" ? "num" : void 0,
									children: v === null ? "NULL" : String(v).slice(0, 400)
								}, j)) }, i)) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("caption", { children: [
									it.rows.length,
									" sətir",
									it.more ? " (limitə çatdı)" : ""
								] })
							]
						})
					}, it.id);
				}),
				waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					onSubmit: submit,
					className: "mt-1 flex items-center gap-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: input,
						className: "w-full max-w-md border-0 border-b border-accent bg-transparent px-1 py-1 text-fg outline-none",
						placeholder: "yazın və Enter basın",
						autoComplete: "off",
						enterKeyHint: "send"
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: end })
			]
		})]
	});
}
//#endregion
export { ConsolePane as t };
