import { cn } from "@/lib/utils";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import type { PreviewState } from "@/lib/preview-channel";

/**
 * Slim status line shown instead of an inline result pane. The result lives in the
 * /preview tab only. The button is a real link, so it still works if a pop-up was blocked.
 */
export function PreviewStatus({
  href,
  target,
  state,
  opened,
  blocked,
  onPrime,
}: {
  href: string;
  target: string;
  state: PreviewState;
  opened: boolean;
  blocked: boolean;
  onPrime: () => void;
}) {
  const running = state === "running" || state === "waiting";
  const text = blocked
    ? "Brauzer yeni səhifəni blokladı — «Önizləməni aç» düyməsinə basın"
    : state === "waiting"
      ? "Giriş gözlənilir — cavabı aşağıda yazın"
      : running
        ? "İcra olunur… nəticə yeni səhifədədir"
        : opened
          ? state === "error"
            ? "Xəta var — təfsilat yeni səhifədədir"
            : "Önizləmə yeni səhifədə açıldı"
          : "Başlat basın — nəticə yeni səhifədə açılacaq";
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-1.5 text-xs",
        blocked ? "border-warn/40 bg-warn/10 text-warn" : "border-border bg-bg text-muted",
      )}
    >
      {blocked ? (
        <AlertTriangle className="size-3.5 shrink-0" />
      ) : running ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />
      ) : (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            state === "error" ? "bg-danger" : opened ? "bg-ok" : "bg-subtle",
          )}
        />
      )}
      <span className="min-w-0 flex-1 basis-48" data-testid="preview-status">
        {text}
      </span>
      <a
        href={href}
        target={target}
        onClick={onPrime}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium max-md:h-11",
          blocked
            ? "border-warn bg-warn text-bg"
            : "border-border bg-elevated text-fg hover:border-muted",
        )}
      >
        <ExternalLink className="size-3.5" />
        Önizləməni aç
      </a>
    </div>
  );
}
