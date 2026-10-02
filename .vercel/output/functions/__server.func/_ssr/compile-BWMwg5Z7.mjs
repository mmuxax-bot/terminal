import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/compile-BWMwg5Z7.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
var compileC_createServerFn_handler = createServerRpc({
	id: "cf52a77f0df67f2ba245b47f2ca60674e2f19acbf960074470989c9e4fa76dc0",
	name: "compileC",
	filename: "src/lib/compile.ts"
}, (opts) => compileC.__executeServer(opts));
var compileC = createServerFn({ method: "POST" }).validator((d) => Input.parse(d)).handler(compileC_createServerFn_handler, async ({ data }) => {
	const res = await fetch("https://wandbox.org/api/compile.json", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: JSON.stringify({
			code: data.code,
			compiler: data.compiler,
			stdin: data.stdin,
			"compiler-option-raw": data.flags,
			save: false
		})
	});
	if (!res.ok) {
		const t = await res.text().catch(() => "");
		throw new Error(`Compiler xidməti xətası (${res.status}) ${t.slice(0, 180)}`);
	}
	return await res.json();
});
//#endregion
export { compileC_createServerFn_handler };
