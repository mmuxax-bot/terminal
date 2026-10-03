/**
 * Studio → "new page" preview transport.
 *
 * A lab publishes a `PreviewPayload` (localStorage + BroadcastChannel); the
 * /preview route (opened in a new tab) reads it and live-updates while the lab
 * keeps running. Everything stays in the user's own browser.
 */
import type { LogItem } from "@/components/console-pane";

export type PreviewState = "idle" | "running" | "waiting" | "done" | "error";

export type PreviewPayload = {
  v: 1;
  lang: string;
  /** Human title, e.g. "Python". */
  title: string;
  /** File shown in the header / used for "download code". */
  filename: string;
  code: string;
  state: PreviewState;
  label?: string;
  elapsed?: string;
  /** Rendered preview document (HTML lab). */
  html?: string;
  /** Console / output items (all other labs). */
  items?: LogItem[];
  /** Honest note for the user, e.g. "Compiled remotely at wandbox.org". */
  note?: string;
  ts: number;
};

export const PREVIEW_CHANNEL = "nibrascode-preview";
const KEY_PREFIX = "nibrascode.studio.preview.";

export function previewKey(lang: string) {
  return KEY_PREFIX + lang;
}

export function previewPath(lang: string) {
  return `/preview?lang=${encodeURIComponent(lang)}`;
}

/** Keep payloads under the localStorage quota by dropping big inline images first. */
function slim(p: PreviewPayload): PreviewPayload {
  return {
    ...p,
    items: p.items?.map((it) =>
      it.kind === "img" && it.src.length > 600_000
        ? {
            id: it.id,
            kind: "text",
            tone: "w",
            text: "[şəkil çox böyükdür — Studio səhifəsində baxın]\n",
          }
        : it,
    ),
  };
}

export function publishPreview(p: PreviewPayload): void {
  if (typeof window === "undefined") return;
  const s = slim(p);
  try {
    localStorage.setItem(previewKey(p.lang), JSON.stringify(s));
  } catch {
    try {
      localStorage.setItem(previewKey(p.lang), JSON.stringify({ ...s, items: undefined }));
    } catch {
      /* quota — channel below still delivers */
    }
  }
  try {
    const ch = new BroadcastChannel(PREVIEW_CHANNEL);
    ch.postMessage(s);
    ch.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function readPreview(lang: string): PreviewPayload | null {
  try {
    const raw = localStorage.getItem(previewKey(lang));
    if (!raw) return null;
    const p = JSON.parse(raw) as PreviewPayload;
    return p && p.v === 1 && p.lang === lang ? p : null;
  } catch {
    return null;
  }
}

export function subscribePreview(lang: string, cb: (p: PreviewPayload) => void): () => void {
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(PREVIEW_CHANNEL);
    ch.onmessage = (e: MessageEvent<PreviewPayload>) => {
      const p = e.data;
      if (p && p.v === 1 && p.lang === lang) cb(p);
    };
  } catch {
    /* ignore */
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key !== previewKey(lang)) return;
    const p = readPreview(lang);
    if (p) cb(p);
  };
  window.addEventListener("storage", onStorage);
  return () => {
    ch?.close();
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Open (or re-use) the preview tab for a language. MUST be called synchronously
 * inside a click / key handler or mobile browsers block it as a pop-up.
 */
export function openPreviewWindow(lang: string): Window | null {
  try {
    return window.open(previewPath(lang), `nibras-preview-${lang}`);
  } catch {
    return null;
  }
}

export function derivePreviewState(o: {
  busy: boolean;
  waiting?: boolean;
  failed?: boolean;
  hasOutput: boolean;
}): PreviewState {
  if (o.busy) return o.waiting ? "waiting" : "running";
  if (o.failed) return "error";
  return o.hasOutput ? "done" : "idle";
}
