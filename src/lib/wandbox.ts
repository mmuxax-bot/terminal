/** Pure helpers for the Wandbox compiler API (shared by C and "other languages" labs). */

export const WANDBOX_URL = "https://wandbox.org/api/compile.json";

export type CompileRequest = {
  code: string;
  compiler: string;
  stdin: string;
  flags: string;
};

export type CompileResult = {
  status?: string | number;
  signal?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
};

/**
 * Wandbox's `compiler-option-raw` takes ONE OPTION PER LINE. Users type flags on a
 * single line ("-std=c17 -Wall -O2"), so split on whitespace (honouring quotes).
 */
export function splitFlags(flags: string): string[] {
  const tokens = flags.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return tokens.map((t) => t.replace(/"([^"]*)"|'([^']*)'/g, (_m, a: string, b: string) => a ?? b));
}

export function wandboxBody(req: CompileRequest) {
  return {
    code: req.code,
    compiler: req.compiler,
    stdin: req.stdin,
    "compiler-option-raw": splitFlags(req.flags).join("\n"),
    save: false,
  };
}

/** Wandbox saves the program as prog.java, so a public class would not compile. */
export function adaptJava(code: string): string {
  return code.replace(/\bpublic\s+((?:final\s+|abstract\s+)?class\s)/, "$1");
}

export type OutPart = { tone: "o" | "e" | "r" | "h"; text: string };

/** Turn a compile result into labelled console parts. */
export function formatResult(d: CompileResult): OutPart[] {
  const parts: OutPart[] = [];
  if (d.compiler_error)
    parts.push({ tone: "e", text: "COMPILER ERROR\n" + d.compiler_error + "\n" });
  if (d.compiler_message && d.compiler_message !== d.compiler_error) {
    parts.push({ tone: "h", text: d.compiler_message + "\n" });
  }
  if (d.program_output) parts.push({ tone: "o", text: d.program_output });
  if (d.program_error) parts.push({ tone: "e", text: "PROGRAM ERROR\n" + d.program_error + "\n" });
  if (d.signal)
    parts.push({
      tone: "e",
      text: `Proqram dayandırıldı (siqnal: ${d.signal}) — vaxt/yaddaş limiti ola bilər.\n`,
    });
  if (!parts.length) parts.push({ tone: "r", text: "Proqram çıxış vermədən uğurla tamamlandı.\n" });
  return parts;
}

export function resultFailed(d: CompileResult): boolean {
  return Boolean(d.compiler_error || d.program_error || d.signal || Number(d.status ?? 0) !== 0);
}

export const WANDBOX_LIST_URL = "https://wandbox.org/api/list.json";

export type WandboxListItem = { name: string };

/** "rust-1.82.0" → "rust", "openjdk-jdk-22+36" → "openjdk-jdk", "gcc-head-c" → "gcc-c" (C vs C++ stay apart). */
export function compilerFamily(name: string): string {
  const suffix = /-(c|pp)$/.exec(name)?.[1];
  const base = name.replace(/-(c|pp)$/, "").replace(/[-+]?(\d.*|head)$/, "");
  return suffix ? `${base}-${suffix}` : base;
}

function versionParts(name: string): number[] {
  return (name.match(/\d+/g) ?? []).map(Number);
}

function cmpVersion(a: string, b: string): number {
  const x = versionParts(a);
  const y = versionParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/**
 * Wandbox retires compiler versions over time. Keep the pinned name when it is still listed;
 * otherwise pick the newest listed release of the same family (e.g. rust-1.82.0 → rust-1.85.0).
 * Without a usable list the pinned name is returned unchanged.
 */
export function pickCompiler(pinned: string, list: WandboxListItem[] | null | undefined): string {
  if (!list || list.length === 0) return pinned;
  const names = list.map((c) => c.name);
  if (names.includes(pinned)) return pinned;
  const fam = compilerFamily(pinned);
  const same = names.filter((n) => compilerFamily(n) === fam);
  if (same.length === 0) return pinned;
  const released = same.filter((n) => !/head/.test(n));
  const pool = released.length ? released : same;
  return [...pool].sort((a, b) => cmpVersion(b, a))[0];
}
