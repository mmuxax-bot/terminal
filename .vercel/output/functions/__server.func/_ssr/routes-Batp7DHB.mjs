import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as LANGUAGES } from "./studio-BVU5pMZd.mjs";
import { _ as ArrowUpRight, g as Braces, h as CodeXml, l as FileCode, n as Terminal, p as Database } from "../_libs/lucide-react.mjs";
import { t as pythonRuntime } from "./python-runtime-DPuzWqGx.mjs";
import { t as sqlRuntime } from "./sql-runtime-_M684rUr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Batp7DHB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS = {
	python: Terminal,
	html: FileCode,
	javascript: Braces,
	sql: Database,
	c: CodeXml
};
function Home() {
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => {
			pythonRuntime.ensure();
			sqlRuntime.ensure();
		}, 1200);
		return () => window.clearTimeout(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bg-grid pointer-events-none absolute inset-0 opacity-60" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent_70%)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-5 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-lg font-semibold tracking-tight",
						children: ["Nibras", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-accent",
							children: "Code"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-subtle",
						children: "Studio"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-1 flex-col justify-center py-8 sm:py-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-accent",
							children: "Limitsiz brauzer IDE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 max-w-xl text-balance text-3xl font-medium leading-tight tracking-tight sm:text-4xl",
							children: "Beş dil. Bir studio."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted sm:text-base",
							children: "Python, HTML/CSS, JavaScript, SQL və C — kodu yazın, dərhal işə salın."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5",
							children: LANGUAGES.map((l, i) => {
								const Icon = ICONS[l.id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: l.path,
									className: "glow-card group block",
									style: { "--glow-delay": `${i * -1.15}s` },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex h-full items-center gap-3 rounded-[15px] bg-surface px-3.5 py-3.5 transition-colors duration-200 group-hover:bg-elevated lg:flex-col lg:items-start lg:gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-9 shrink-0 place-items-center rounded-md bg-elevated text-accent",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-sm font-medium",
													children: l.label
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5 shrink-0 text-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-0.5 truncate text-xs leading-relaxed text-muted",
												children: l.blurb
											})]
										})]
									})
								}, l.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Ctrl+Enter — işə sal" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "HTML terminalı yeni səhifədə açır" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Avtomatik yaddaş" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "numpy / pandas / matplotlib" })
							]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { Home as component };
