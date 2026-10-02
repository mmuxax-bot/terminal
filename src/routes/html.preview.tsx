import { createFileRoute, Link } from "@tanstack/react-router";
import { HTML_PREVIEW_ALLOW, htmlBlobUrl, loadStr } from "@/lib/studio";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/html/preview")({
  component: HtmlPreviewPage,
  head: () => ({ meta: [{ title: "Önizləmə · NibrasCode" }] }),
});

function HtmlPreviewPage() {
  const [url, setUrl] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    const html = loadStr("html.preview", "");
    if (!html) {
      setEmpty(true);
      return;
    }
    const next = htmlBlobUrl(html);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, []);

  return (
    <div className="relative h-dvh w-full bg-white">
      <Link
        to="/html"
        className="absolute right-3 top-3 z-10 rounded-full bg-black/75 px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
      >
        Studio
      </Link>
      {url ? (
        <iframe
          title="HTML önizləmə"
          src={url}
          allow={HTML_PREVIEW_ALLOW}
          allowFullScreen
          referrerPolicy="no-referrer"
          className="h-full w-full border-0 bg-white"
        />
      ) : empty ? (
        <div className="grid h-full place-items-center bg-bg text-muted">
          <p>Önizləmə tapılmadı. Studio-da Başlat basın.</p>
        </div>
      ) : null}
    </div>
  );
}
