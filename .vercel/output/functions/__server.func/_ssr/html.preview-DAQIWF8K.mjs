import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as loadStr, m as htmlBlobUrl, n as HTML_PREVIEW_ALLOW } from "./studio-BVU5pMZd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/html.preview-DAQIWF8K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HtmlPreviewPage() {
	const [url, setUrl] = (0, import_react.useState)(null);
	const [empty, setEmpty] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const html = loadStr("html.preview", "");
		if (!html) {
			setEmpty(true);
			return;
		}
		const next = htmlBlobUrl(html);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh w-full bg-white",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/html",
			className: "absolute right-3 top-3 z-10 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white hover:bg-black",
			children: "Studio"
		}), url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
			title: "HTML önizləmə",
			src: url,
			allow: HTML_PREVIEW_ALLOW,
			allowFullScreen: true,
			referrerPolicy: "no-referrer",
			className: "h-full w-full border-0 bg-white"
		}) : empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid h-full place-items-center bg-bg text-muted",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Önizləmə tapılmadı. Studio-da Başlat basın." })
		}) : null]
	});
}
//#endregion
export { HtmlPreviewPage as component };
