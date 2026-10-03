// Runs every sample of the "other languages" lab against the real Wandbox API.
// Usage: node --experimental-strip-types scripts/verify-wandbox.mjs
import { MORE_LANGS } from "../src/lib/more-langs.ts";
import { adaptJava, wandboxBody } from "../src/lib/wandbox.ts";

let bad = 0;
for (const l of MORE_LANGS) {
  const code = l.id === "java" ? adaptJava(l.sample) : l.sample;
  const body = wandboxBody({ code, compiler: l.compiler, stdin: l.stdin ?? "", flags: l.flags });
  const r = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NibrasCode-Studio/1.0" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  const ok = r.ok && String(d.status) === "0" && d.program_output;
  if (!ok) bad++;
  console.log(ok ? "OK  " : "FAIL", l.label.padEnd(11), JSON.stringify((d.program_output || d.compiler_error || d.program_error || "").slice(0, 70)));
}
process.exit(bad ? 1 : 0);
