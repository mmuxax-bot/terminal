/**
 * /run#l=<dil>&c=<base64url>[&z=1] — kodu linkin hash hissəsində daşıyır.
 * Hash serverə getmir. `z=1` olduqda kod əvvəlcə deflate-raw ilə sıxılıb.
 * Nibras AI səhifəsi eyni formatı yazır (public/ai/index.html).
 */
export type RunLang = "python" | "html" | "javascript";

export type RunPayload = { lang: string; code: string };

const LANG_ALIAS: Record<string, RunLang> = {
  python: "python",
  py: "python",
  html: "html",
  htm: "html",
  javascript: "javascript",
  js: "javascript",
};

export function normalizeRunLang(l: string | null | undefined): RunLang | null {
  return LANG_ALIAS[String(l ?? "").toLowerCase()] ?? null;
}

export function bytesToB64u(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64uToBytes(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipeBytes(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const buf = await new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(stream as ReadableWritablePair),
  ).arrayBuffer();
  return new Uint8Array(buf);
}

/** Hash yaradır (sıxma mümkündürsə və nəticəni qısaldırsa istifadə olunur). */
export async function encodeRunHash(lang: string, code: string): Promise<string> {
  const raw = new TextEncoder().encode(code);
  let best = bytesToB64u(raw);
  let z = false;
  if (typeof CompressionStream !== "undefined") {
    try {
      const packed = bytesToB64u(await pipeBytes(raw, new CompressionStream("deflate-raw")));
      if (packed.length < best.length) {
        best = packed;
        z = true;
      }
    } catch {
      /* sıxmadan istifadə et */
    }
  }
  return `#l=${encodeURIComponent(lang)}&c=${best}${z ? "&z=1" : ""}`;
}

export type DecodeResult =
  | { ok: true; lang: RunLang; code: string }
  | { ok: false; error: string };

export async function decodeRunHash(hash: string): Promise<DecodeResult> {
  const h = hash.replace(/^#/, "");
  if (!h) return { ok: false, error: "Link boşdur: kod tapılmadı." };
  const p = new URLSearchParams(h);
  const lang = normalizeRunLang(p.get("l"));
  const c = p.get("c");
  if (!lang) return { ok: false, error: "Bu dil dəstəklənmir. Python və HTML açıla bilər." };
  if (!c) return { ok: false, error: "Linkdə kod tapılmadı." };
  try {
    let bytes = b64uToBytes(c);
    if (p.get("z") === "1") {
      if (typeof DecompressionStream === "undefined")
        return { ok: false, error: "Brauzeriniz sıxılmış linki açmır. Brauzeri yeniləyin." };
      bytes = await pipeBytes(bytes, new DecompressionStream("deflate-raw"));
    }
    return { ok: true, lang, code: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: "Link zədəlidir: kodu oxumaq mümkün olmadı." };
  }
}
