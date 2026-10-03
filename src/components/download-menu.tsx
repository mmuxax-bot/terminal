import * as Menu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  canShareFiles,
  fileBlob,
  saveFile,
  saveZip,
  shareFiles,
  type ProjectFile,
  type SaveResult,
} from "@/lib/files";
import { allLanguageFiles } from "@/lib/project-files";
import type { LangId } from "@/lib/studio";
import { cn } from "@/lib/utils";
import { Archive, ChevronDown, Download, FileDown, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function report(r: SaveResult, what: string) {
  if (r === "download") toast(`${what} yüklənir — «Yükləmələr» / Fayllar qovluğuna baxın`);
  else if (r === "share") toast(`${what} paylaşıldı`);
  else if (r === "tab") toast(`${what} yeni səhifədə açıldı — «Saxla» ilə yadda saxlayın`);
  else if (r === "failed") toast.error(`${what} yüklənmədi. Brauzer yükləməyə icazə vermir.`);
}

const itemCls =
  "flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-elevated";

type Props = {
  lang: LangId;
  /** Files of the current language (shown first, and zipped together). */
  files: ProjectFile[];
  /** What goes into the language ZIP when it differs from `files` (e.g. linked HTML project). */
  zipFiles?: ProjectFile[];
  /** Name for the ZIP of the current language, without extension. */
  zipName: string;
  /** Extra entries (e.g. a binary .sqlite export). */
  extra?: { label: string; onSelect: () => void; disabled?: boolean }[];
  className?: string;
};

export function DownloadMenu({ lang, files, zipFiles, zipName, extra, className }: Props) {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(canShareFiles()), []);
  const shown = files.filter((f) => f.content !== "" || files.length === 1);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button size="sm" className={cn("max-md:h-11", className)} aria-label="Yüklə">
          <Download className="size-3.5" />
          Yüklə
          <ChevronDown className="size-3 opacity-70" />
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-h-[70dvh] w-[min(92vw,320px)] overflow-auto rounded-lg border border-border bg-surface p-1.5 shadow-2xl"
        >
          <Menu.Label className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-subtle">
            Telefona / kompüterə yüklə
          </Menu.Label>
          {shown.map((f) => (
            <Menu.Item
              key={f.name}
              className={itemCls}
              onSelect={() => void saveFile(f).then((r) => report(r, f.name))}
            >
              <FileDown className="size-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
            </Menu.Item>
          ))}
          {extra?.map((x) => (
            <Menu.Item
              key={x.label}
              className={itemCls}
              disabled={x.disabled}
              onSelect={x.onSelect}
            >
              <FileDown className="size-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate">{x.label}</span>
            </Menu.Item>
          ))}
          <Menu.Separator className="my-1 h-px bg-border" />
          <Menu.Item
            className={itemCls}
            onSelect={() =>
              void saveZip(zipName, zipFiles ?? files).then((r) => report(r, `${zipName}.zip`))
            }
          >
            <Archive className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">Bütün fayllar (.zip)</span>
          </Menu.Item>
          <Menu.Item
            className={itemCls}
            onSelect={() => {
              const all = allLanguageFiles({ lang, files: zipFiles ?? files });
              void saveZip("nibrascode-layihe", all).then((r) =>
                report(r, "nibrascode-layihe.zip"),
              );
            }}
          >
            <Archive className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">Bütün dillər (.zip)</span>
          </Menu.Item>
          {canShare ? (
            <>
              <Menu.Separator className="my-1 h-px bg-border" />
              <Menu.Item
                className={cn(itemCls)}
                onSelect={() =>
                  void shareFiles(
                    shown.map((f) => ({ name: f.name.split("/").pop()!, blob: fileBlob(f) })),
                  ).then((r) => report(r, "Fayllar"))
                }
              >
                <Share2 className="size-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1">Paylaş… (Fayllara / Drive-a saxla)</span>
              </Menu.Item>
            </>
          ) : null}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
