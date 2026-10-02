import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  code: z.string().max(400000),
  compiler: z.string().max(80),
  stdin: z.string().max(200000),
  flags: z.string().max(2000),
});

export type CompileResult = {
  status?: string | number;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
};

export const compileC = createServerFn({ method: "POST" })
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<CompileResult> => {
    const res = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        code: data.code,
        compiler: data.compiler,
        stdin: data.stdin,
        "compiler-option-raw": data.flags,
        save: false,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Compiler xidməti xətası (${res.status}) ${t.slice(0, 180)}`);
    }
    return (await res.json()) as CompileResult;
  });

export async function runCCompile(
  req: z.infer<typeof Input>,
  signal?: AbortSignal,
): Promise<CompileResult> {
  try {
    const r = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal,
      body: JSON.stringify({
        code: req.code,
        compiler: req.compiler,
        stdin: req.stdin,
        "compiler-option-raw": req.flags,
        save: false,
      }),
    });
    if (!r.ok) throw new Error("http");
    return (await r.json()) as CompileResult;
  } catch (e) {
    if (signal?.aborted) throw e;
    return compileC({ data: req });
  }
}
