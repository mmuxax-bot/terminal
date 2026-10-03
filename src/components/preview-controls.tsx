import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/** "Run opens the result in a new page" toggle + manual open button. */
export function PreviewControls({
  auto,
  onAuto,
  onOpen,
}: {
  auto: boolean;
  onAuto: (v: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <>
      <Button size="sm" className="max-md:h-11" onClick={onOpen}>
        <ExternalLink className="size-3.5" />
        Yeni səhifə
      </Button>
      <label className="flex min-h-11 cursor-pointer md:min-h-9 select-none items-center gap-2 rounded-md px-1 text-xs text-muted">
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => onAuto(e.target.checked)}
          className="size-4 accent-[var(--color-accent)]"
        />
        <span>Başlatda yeni səhifədə aç</span>
      </label>
    </>
  );
}
