import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, m as useRouterState, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as LANGUAGES } from "./studio-D8F66u3l.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { K as EditorView, P as tags, at as keymap, bt as Prec, c as HighlightStyle, j as syntaxHighlighting } from "../_libs/@codemirror/autocomplete+[...].mjs";
import { t as ReactCodeMirror } from "../_libs/uiw__react-codemirror.mjs";
import { t as cpp } from "../_libs/@codemirror/lang-cpp+[...].mjs";
import { t as python } from "../_libs/@codemirror/lang-python+[...].mjs";
import { n as javascript, t as html } from "../_libs/@codemirror/lang-html+[...].mjs";
import { t as css } from "../_libs/@codemirror/lang-css+[...].mjs";
import { t as sql } from "../_libs/codemirror__lang-sql.mjs";
import { n as io, r as po } from "../_libs/react-resizable-panels.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/split-CRXWGIF6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	return Math.random().toString(36).slice(2, 10);
}
function StatusDot({ state, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", state === "ok" ? "bg-ok" : state === "run" ? "bg-accent" : state === "err" ? "bg-danger" : "bg-warn", state === "load" || state === "run" ? "animate-pulse" : "") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "max-w-[140px] truncate sm:max-w-none",
			children: label
		})]
	});
}
function AppShell({ lang, status, statusLabel, actions, children, footer }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "shrink-0 text-[17px] font-semibold tracking-tight text-fg",
						children: ["Nibras", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-accent",
							children: "Code"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "hidden min-w-0 flex-1 items-center gap-1 md:flex",
						children: LANGUAGES.map((l) => {
							const on = pathname === l.path;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: l.path,
								className: cn("rounded-md px-3 py-1.5 text-sm transition-colors duration-150", on ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg"),
								children: l.label
							}, l.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusDot, {
							state: status,
							label: statusLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden items-center gap-1.5 md:flex",
							children: actions
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden",
				children: LANGUAGES.map((l) => {
					const on = pathname === l.path;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: l.path,
						className: cn("shrink-0 rounded-md px-3 py-2 text-sm", on ? "bg-elevated text-fg" : "text-muted"),
						children: l.short
					}, l.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-0 flex-1 flex-col",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 items-center gap-2 border-t border-border p-2 md:hidden",
				children: actions
			}),
			footer,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: lang
			})
		]
	});
}
function ToolRow({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2",
		children
	});
}
function NativeSelect({ value, onChange, children, label, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		"aria-label": label,
		value,
		onChange: (e) => onChange(e.target.value),
		className: cn("h-10 min-w-0 max-w-full rounded-md border border-border bg-elevated px-2.5 text-sm text-fg", className),
		children
	});
}
var highlight = HighlightStyle.define([
	{
		tag: tags.keyword,
		color: "#7ec8e3"
	},
	{
		tag: tags.controlKeyword,
		color: "#7ec8e3"
	},
	{
		tag: tags.operatorKeyword,
		color: "#7ec8e3"
	},
	{
		tag: tags.comment,
		color: "#5d6d82",
		fontStyle: "italic"
	},
	{
		tag: tags.lineComment,
		color: "#5d6d82",
		fontStyle: "italic"
	},
	{
		tag: tags.string,
		color: "#9dce8a"
	},
	{
		tag: tags.number,
		color: "#e6a07c"
	},
	{
		tag: tags.bool,
		color: "#e6a07c"
	},
	{
		tag: tags.null,
		color: "#e6a07c"
	},
	{
		tag: tags.function(tags.variableName),
		color: "#82b4e8"
	},
	{
		tag: tags.function(tags.propertyName),
		color: "#82b4e8"
	},
	{
		tag: tags.definition(tags.variableName),
		color: "#e8eef6"
	},
	{
		tag: tags.typeName,
		color: "#6ec8c0"
	},
	{
		tag: tags.className,
		color: "#82b4e8"
	},
	{
		tag: tags.propertyName,
		color: "#c5d4e4"
	},
	{
		tag: tags.tagName,
		color: "#7ec8e3"
	},
	{
		tag: tags.attributeName,
		color: "#6ec8c0"
	},
	{
		tag: tags.angleBracket,
		color: "#8b9bb0"
	},
	{
		tag: tags.operator,
		color: "#8b9bb0"
	},
	{
		tag: tags.punctuation,
		color: "#8b9bb0"
	},
	{
		tag: tags.meta,
		color: "#e0c07a"
	},
	{
		tag: tags.processingInstruction,
		color: "#e0c07a"
	},
	{
		tag: tags.regexp,
		color: "#9dce8a"
	},
	{
		tag: tags.self,
		color: "#e6a07c"
	}
]);
var theme = EditorView.theme({
	"&": {
		height: "100%",
		backgroundColor: "transparent",
		color: "#e8eef6",
		fontSize: "14px"
	},
	".cm-content": {
		caretColor: "#2fd4bf",
		fontFamily: "\"IBM Plex Mono\", ui-monospace, Menlo, Consolas, monospace",
		lineHeight: "1.7",
		padding: "14px 0"
	},
	".cm-gutters": {
		backgroundColor: "transparent",
		color: "#5d6d82",
		border: "none"
	},
	".cm-lineNumbers .cm-gutterElement": {
		minWidth: "2.6rem",
		padding: "0 10px 0 8px"
	}
}, { dark: true });
function langExt(lang) {
	switch (lang) {
		case "python": return python();
		case "javascript": return javascript();
		case "html": return html({ autoCloseTags: true });
		case "css": return css();
		case "sql": return sql();
		case "c": return cpp();
	}
}
function editorExtensions(lang, onRun) {
	return [
		langExt(lang),
		theme,
		syntaxHighlighting(highlight),
		Prec.highest(keymap.of([{
			key: "Mod-Enter",
			run: () => {
				onRun();
				return true;
			}
		}]))
	];
}
function CodeEditor({ lang, value, onChange, onRun, className }) {
	const extensions = (0, import_react.useMemo)(() => editorExtensions(lang, onRun), [lang, onRun]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-full min-h-0 overflow-hidden bg-panel", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactCodeMirror, {
			value,
			height: "100%",
			theme: "dark",
			extensions,
			onChange,
			basicSetup: {
				lineNumbers: true,
				foldGutter: true,
				highlightActiveLine: true,
				autocompletion: true,
				indentOnInput: true,
				bracketMatching: true
			}
		})
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			ghost: "bg-transparent text-muted hover:bg-elevated hover:text-fg",
			outline: "border border-border bg-elevated text-fg hover:border-muted",
			stop: "bg-danger/15 text-danger hover:bg-danger/25"
		},
		size: {
			sm: "h-9 px-3 text-xs",
			md: "h-10 px-3.5 text-sm",
			lg: "h-11 px-4 text-sm min-w-11"
		}
	},
	defaultVariants: {
		variant: "outline",
		size: "md"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Split({ orientation, className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(io, {
		orientation,
		className: cn("h-full min-h-0 w-full", className),
		children
	});
}
function Handle({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(po, { className: cn("bg-border hover:bg-accent/40", className) });
}
//#endregion
export { NativeSelect as a, cn as c, Handle as i, uid as l, Button as n, Split as o, CodeEditor as r, ToolRow as s, AppShell as t };
