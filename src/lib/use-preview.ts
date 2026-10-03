import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openPreviewWindow, publishPreview, type PreviewPayload } from "@/lib/preview-channel";
import { loadStr, saveStr } from "@/lib/studio";

type Snapshot = Omit<PreviewPayload, "v" | "lang" | "title" | "filename" | "ts">;

/**
 * Per-lab "show result in a new page" controller.
 * - `autoOpen` (persisted): Run opens/re-uses the preview tab.
 * - `open()`: opens the tab now (call inside a user gesture) and starts live sync.
 * - `push(snapshot)`: publish the latest result when a preview tab was opened.
 */
export function usePreview(lang: string, title: string, filename: string) {
  const [autoOpen, setAutoOpenState] = useState(true);
  const active = useRef(false);
  const timer = useRef<number | null>(null);
  const latest = useRef<Snapshot | null>(null);
  const meta = useRef({ lang, title, filename });
  meta.current = { lang, title, filename };

  useEffect(() => {
    setAutoOpenState(loadStr("preview.auto", "1") !== "0");
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const setAutoOpen = useCallback((v: boolean) => {
    setAutoOpenState(v);
    saveStr("preview.auto", v ? "1" : "0");
  }, []);

  const flush = useCallback(() => {
    timer.current = null;
    const s = latest.current;
    if (!s) return;
    publishPreview({ v: 1, ...meta.current, ...s, ts: Date.now() });
  }, []);

  const push = useCallback(
    (s: Snapshot, immediate = false) => {
      latest.current = s;
      if (!active.current) return;
      if (immediate) {
        if (timer.current) window.clearTimeout(timer.current);
        flush();
      } else if (!timer.current) {
        timer.current = window.setTimeout(flush, 150);
      }
    },
    [flush],
  );

  /** Returns false when the browser blocked the new tab. */
  const open = useCallback(
    (snapshot?: Snapshot) => {
      if (snapshot) latest.current = snapshot;
      active.current = true;
      flush(); // payload is in storage before the new tab reads it
      const w = openPreviewWindow(meta.current.lang);
      return Boolean(w);
    },
    [flush],
  );

  return useMemo(
    () => ({ autoOpen, setAutoOpen, open, push }),
    [autoOpen, setAutoOpen, open, push],
  );
}
