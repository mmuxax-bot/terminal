import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  openPreviewWindow,
  previewPath,
  publishPreview,
  type PreviewPayload,
} from "@/lib/preview-channel";

export type PreviewSnapshot = Omit<PreviewPayload, "v" | "lang" | "title" | "filename" | "ts">;

/**
 * Per-lab controller for the result page (/preview). The result is shown ONLY there.
 * - `open(snapshot)`: publish + open/reuse the tab. Call synchronously inside a click/key
 *   handler (otherwise pop-up blockers refuse it). Sets `blocked` when the browser refuses.
 * - `prime(snapshot)`: publish only; used by a real link (`<a target>`), which browsers never block.
 * - `push(snapshot)`: live updates once the page was opened/primed.
 */
export function usePreview(lang: string, title: string, filename: string) {
  const [blocked, setBlocked] = useState(false);
  const [opened, setOpened] = useState(false);
  const active = useRef(false);
  const timer = useRef<number | null>(null);
  const latest = useRef<PreviewSnapshot | null>(null);
  const meta = useRef({ lang, title, filename });
  meta.current = { lang, title, filename };

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const flush = useCallback(() => {
    timer.current = null;
    const s = latest.current;
    if (!s) return;
    publishPreview({ v: 1, ...meta.current, ...s, ts: Date.now() });
  }, []);

  const push = useCallback(
    (s: PreviewSnapshot) => {
      latest.current = s;
      if (!active.current || timer.current) return;
      timer.current = window.setTimeout(flush, 150);
    },
    [flush],
  );

  const prime = useCallback(
    (snapshot?: PreviewSnapshot) => {
      if (snapshot) latest.current = snapshot;
      active.current = true;
      if (timer.current) window.clearTimeout(timer.current);
      flush();
      setBlocked(false);
      setOpened(true);
    },
    [flush],
  );

  const open = useCallback(
    (snapshot?: PreviewSnapshot) => {
      prime(snapshot);
      const ok = Boolean(openPreviewWindow(meta.current.lang));
      setBlocked(!ok);
      setOpened(ok);
      return ok;
    },
    [prime],
  );

  return useMemo(
    () => ({
      open,
      prime,
      push,
      blocked,
      opened,
      href: previewPath(lang),
      target: `nibras-preview-${lang}`,
    }),
    [open, prime, push, blocked, opened, lang],
  );
}
