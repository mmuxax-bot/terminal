import { useEffect, useRef, type FormEvent } from "react";

/** Answer box for input() / await input(); only rendered while the program waits for input. */
export function InputBar({
  prompt,
  onSubmit,
}: {
  prompt?: string;
  onSubmit: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(ref.current?.value ?? "");
    if (ref.current) ref.current.value = "";
  }
  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 items-center gap-2 border-t border-accent/40 bg-surface px-3 py-2"
    >
      <span className="max-w-[40%] shrink-0 truncate font-mono text-xs text-accent">
        {prompt?.trim() ? prompt.trim().slice(-40) : "›"}
      </span>
      <input
        ref={ref}
        aria-label="Giriş"
        placeholder="Cavabı yazın və Enter basın"
        autoComplete="off"
        enterKeyHint="send"
        className="h-11 min-w-0 flex-1 rounded-md border border-border bg-elevated px-3 font-mono text-sm text-fg outline-none"
      />
    </form>
  );
}
