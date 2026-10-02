import { cn } from "@/lib/utils";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

export type Tone = "o" | "e" | "r" | "h" | "m" | "w";

export type LogItem =
  | { id: string; kind: "text"; tone: Tone; text: string }
  | { id: string; kind: "img"; src: string }
  | { id: string; kind: "table"; cols: string[]; rows: unknown[][]; more?: boolean };

const TONE: Record<Tone, string> = {
  o: "text-fg/90",
  e: "text-danger",
  r: "text-ok",
  h: "text-warn",
  m: "text-muted",
  w: "text-warn",
};

type Props = {
  items: LogItem[];
  empty: string;
  waiting?: boolean;
  onSubmitInput?: (value: string) => void;
  header?: ReactNode;
  className?: string;
  inputEnabled?: boolean;
  inputPlaceholder?: string;
};

export function ConsolePane({
  items,
  empty,
  waiting,
  onSubmitInput,
  header,
  className,
  inputEnabled,
  inputPlaceholder,
}: Props) {
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const showInput = Boolean(onSubmitInput) && (waiting || inputEnabled);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [items, waiting]);

  useEffect(() => {
    if (waiting || inputEnabled) input.current?.focus();
  }, [waiting, inputEnabled]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = input.current?.value ?? "";
    onSubmitInput?.(v);
    if (input.current) input.current.value = "";
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-bg", className)}>
      {header}
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
        {items.length === 0 && !waiting ? <p className="text-subtle">{empty}</p> : null}
        {items.map((it) => {
          if (it.kind === "text") {
            return (
              <span key={it.id} className={cn("whitespace-pre-wrap break-words", TONE[it.tone])}>
                {it.text}
              </span>
            );
          }
          if (it.kind === "img") {
            return (
              <img
                key={it.id}
                src={it.src}
                alt="Qrafik"
                className="my-3 max-w-full rounded-md border border-border"
              />
            );
          }
          return (
            <div key={it.id} className="my-3 overflow-auto rounded-md border border-border">
              <table className="console-table">
                <thead>
                  <tr>
                    {it.cols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {it.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td
                          key={j}
                          className={
                            v === null ? "nil" : typeof v === "number" ? "num" : undefined
                          }
                        >
                          {v === null ? "NULL" : String(v).slice(0, 400)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <caption>
                  {it.rows.length} sətir{it.more ? " (limitə çatdı)" : ""}
                </caption>
              </table>
            </div>
          );
        })}
        {showInput ? (
          <form onSubmit={submit} className="mt-1 flex items-center gap-2">
            <span className="shrink-0 text-accent">{waiting ? "›" : "$"}</span>
            <input
              ref={input}
              className="w-full max-w-xl border-0 border-b border-accent bg-transparent px-1 py-1 text-fg outline-none"
              placeholder={inputPlaceholder ?? "yazın və Enter basın"}
              autoComplete="off"
              enterKeyHint="send"
            />
          </form>
        ) : null}
        <div ref={end} />
      </div>
    </div>
  );
}
