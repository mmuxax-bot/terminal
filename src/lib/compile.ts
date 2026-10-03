import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  WANDBOX_LIST_URL,
  WANDBOX_URL,
  pickCompiler,
  wandboxBody,
  type CompileRequest,
  type CompileResult,
  type WandboxListItem,
} from "@/lib/wandbox";

export type { CompileResult } from "@/lib/wandbox";

const Input = z.object({
  code: z.string().max(400000),
  compiler: z.string().max(80),
  stdin: z.string().max(200000),
  flags: z.string().max(2000),
});

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "NibrasCode-Studio/1.0",
};

let listPromise: Promise<WandboxListItem[] | null> | null = null;

/** Currently valid compilers (cached per page / server instance); null when unreachable. */
function loadCompilerList(): Promise<WandboxListItem[] | null> {
  listPromise ??= fetch(WANDBOX_LIST_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  })
    .then((r) => (r.ok ? (r.json() as Promise<WandboxListItem[]>) : null))
    .catch(() => null)
    .then((l) => {
      if (!l) listPromise = null; // retry next time
      return l;
    });
  return listPromise;
}

/** Server-side fallback (used when the browser cannot reach wandbox.org directly). */
export const compileC = createServerFn({ method: "POST" })
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<CompileResult> => {
    const compiler = pickCompiler(data.compiler, await loadCompilerList());
    const res = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(wandboxBody({ ...data, compiler })),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Compiler xidməti xətası (${res.status}) ${t.slice(0, 180)}`);
    }
    return (await res.json()) as CompileResult;
  });

/** Compile & run through Wandbox: directly from the browser, falling back to the server. */
export async function runCCompile(
  req: CompileRequest,
  signal?: AbortSignal,
): Promise<CompileResult> {
  const compiler = pickCompiler(req.compiler, await loadCompilerList());
  req = { ...req, compiler };
  try {
    const r = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal,
      body: JSON.stringify(wandboxBody(req)),
    });
    if (!r.ok) throw new Error("http");
    return (await r.json()) as CompileResult;
  } catch (e) {
    if (signal?.aborted) throw e;
    return compileC({ data: req });
  }
}
