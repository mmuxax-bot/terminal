/**
 * File helpers: MIME lookup, a dependency-free ZIP writer and a mobile-safe
 * "save to device" routine (Android Chrome, iOS Safari, desktop).
 */

export type ProjectFile = {
  /** Path inside the ZIP / file name on disk, e.g. "main.py" or "python/main.py". */
  name: string;
  content: string | Uint8Array;
  mime?: string;
};

const MIME: Record<string, string> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "text/javascript",
  mjs: "text/javascript",
  ts: "text/typescript",
  json: "application/json",
  md: "text/markdown",
  svg: "image/svg+xml",
  txt: "text/plain",
  csv: "text/csv",
  py: "text/x-python",
  c: "text/x-csrc",
  h: "text/x-chdr",
  cpp: "text/x-c++src",
  cc: "text/x-c++src",
  java: "text/x-java-source",
  php: "application/x-httpd-php",
  go: "text/x-go",
  rs: "text/x-rust",
  rb: "text/x-ruby",
  pl: "text/x-perl",
  lua: "text/x-lua",
  sh: "text/x-shellscript",
  swift: "text/x-swift",
  cs: "text/x-csharp",
  kt: "text/x-kotlin",
  scala: "text/x-scala",
  hs: "text/x-haskell",
  r: "text/x-r",
  jl: "text/x-julia",
  sql: "application/sql",
  sqlite: "application/vnd.sqlite3",
  zip: "application/zip",
  png: "image/png",
};

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i + 1).toLowerCase();
}

export function mimeFor(name: string): string {
  return MIME[extOf(name)] ?? "application/octet-stream";
}

/** MIME with charset for text types, as used for the Blob. */
function blobType(mime: string): string {
  return mime.startsWith("text/") || /json|sql|javascript|xml|svg/.test(mime)
    ? `${mime};charset=utf-8`
    : mime;
}

/** Remove path separators / control chars so a name is safe as a download name. */
export function safeFileName(name: string, fallback = "file.txt"): string {
  const base = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/^\.+/, "")
    .trim();
  return base || fallback;
}

/* ------------------------------------------------------------------ ZIP -- */

let crcTable: Uint32Array | null = null;

export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function toBytes(content: string | Uint8Array): Uint8Array {
  return typeof content === "string" ? new TextEncoder().encode(content) : content;
}

function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/** Normalise a path for use inside the archive (no leading slash, no "..", forward slashes). */
export function zipPath(name: string): string {
  const parts = name
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p && p !== "." && p !== "..");
  return parts.join("/") || "file";
}

/** Build a ZIP archive (STORE method, UTF-8 names). Returns the raw bytes. */
export function makeZip(files: ProjectFile[], when: Date = new Date()): Uint8Array {
  const { time, date } = dosDateTime(when);
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  const seen = new Set<string>();
  let offset = 0;

  for (const f of files) {
    let path = zipPath(f.name);
    // de-duplicate names so extractors don't silently drop a file
    if (seen.has(path)) {
      const dot = path.lastIndexOf(".");
      let n = 2;
      let next: string;
      do {
        next = dot > 0 ? `${path.slice(0, dot)} (${n})${path.slice(dot)}` : `${path} (${n})`;
        n++;
      } while (seen.has(next));
      path = next;
    }
    seen.add(path);
    const name = enc.encode(path);
    const data = toBytes(f.content);
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // STORE
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cd.set(name, 46);

    chunks.push(local, data);
    central.push(cd);
    offset += local.length + data.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const all = [...chunks, ...central, end];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

/* ------------------------------------------------------- save to device -- */

export type SaveResult = "download" | "share" | "tab" | "cancelled" | "failed";

function canDownloadAttr(): boolean {
  if (typeof document === "undefined") return false;
  return "download" in document.createElement("a");
}

function makeFile(name: string, blob: Blob): File | null {
  try {
    return new File([blob], name, { type: blob.type });
  } catch {
    return null;
  }
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;
  const probe = makeFile("a.txt", new Blob(["a"], { type: "text/plain" }));
  try {
    return Boolean(probe && navigator.canShare({ files: [probe] }));
  } catch {
    return false;
  }
}

/** Share files through the OS share sheet ("Save to Files", Drive, Telegram, …). */
export async function shareFiles(files: { name: string; blob: Blob }[]): Promise<SaveResult> {
  const list = files.map((f) => makeFile(f.name, f.blob)).filter((f): f is File => Boolean(f));
  if (!list.length || !canShareFiles()) return "failed";
  try {
    if (!navigator.canShare({ files: list })) return "failed";
    await navigator.share({ files: list, title: list[0].name });
    return "share";
  } catch (e) {
    return (e as Error)?.name === "AbortError" ? "cancelled" : "failed";
  }
}

/**
 * Save a Blob to the user's device.
 * 1. `<a download>` appended to the DOM (works on Android Chrome, iOS Safari 13+, desktop).
 * 2. Browsers without the download attribute: Web Share API with a File.
 * 3. Last resort: open the blob in a new tab so the user can "Save as…".
 */
export async function saveBlob(filename: string, blob: Blob): Promise<SaveResult> {
  const name = safeFileName(filename);
  if (typeof document === "undefined") return "failed";

  if (canDownloadAttr()) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => a.remove(), 1000);
      // keep the URL alive long enough for slow mobile downloads to start
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
      return "download";
    } catch {
      /* fall through */
    }
  }
  const shared = await shareFiles([{ name, blob }]);
  if (shared === "share" || shared === "cancelled") return shared;
  try {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    if (w) return "tab";
  } catch {
    /* ignore */
  }
  return "failed";
}

export function textBlob(content: string | Uint8Array, mime: string): Blob {
  return new Blob([content as BlobPart], { type: blobType(mime) });
}

export function fileBlob(f: ProjectFile): Blob {
  const n = f.name.split("/").pop() ?? f.name;
  return textBlob(f.content, f.mime ?? mimeFor(n));
}

export function saveFile(f: ProjectFile): Promise<SaveResult> {
  const name = f.name.split("/").pop() ?? f.name;
  return saveBlob(name, fileBlob(f));
}

export function zipBlob(files: ProjectFile[]): Blob {
  return new Blob([makeZip(files) as BlobPart], { type: "application/zip" });
}

export function saveZip(zipName: string, files: ProjectFile[]): Promise<SaveResult> {
  const n = safeFileName(zipName, "project.zip");
  return saveBlob(n.toLowerCase().endsWith(".zip") ? n : n + ".zip", zipBlob(files));
}
