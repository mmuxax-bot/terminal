import { Link, useRouterState } from "@tanstack/react-router";
import { isExtraPath, LANGUAGES, type LangId } from "@/lib/studio";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function StatusDot({ state, label }: { state: "load" | "ok" | "run" | "err"; label: string }) {
  const color =
    state === "ok"
      ? "bg-ok"
      : state === "run"
        ? "bg-accent"
        : state === "err"
          ? "bg-danger"
          : "bg-warn";
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
      <span
        className={cn(
          "size-1.5 rounded-full",
          color,
          state === "load" || state === "run" ? "animate-pulse" : "",
        )}
      />
      <span className="max-w-[140px] truncate sm:max-w-none">{label}</span>
    </div>
  );
}

export function AppShell({
  lang,
  status,
  statusLabel,
  actions,
  children,
  footer,
}: {
  lang: LangId;
  status: "load" | "ok" | "run" | "err";
  statusLabel: string;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
        <Link to="/" className="shrink-0 text-[17px] font-semibold tracking-tight text-fg">
          Nibras<span className="text-accent">Code</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
          {LANGUAGES.map((l) => {
            const on = l.id === "more" ? isExtraPath(pathname) : pathname === l.path;
            return (
              <Link
                key={l.id}
                to={l.path}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
                  on ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <StatusDot state={status} label={statusLabel} />
          <div className="hidden items-center gap-1.5 md:flex">{actions}</div>
        </div>
      </header>
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
        {LANGUAGES.map((l) => {
          const on = l.id === "more" ? isExtraPath(pathname) : pathname === l.path;
          return (
            <Link
              key={l.id}
              to={l.path}
              className={cn(
                "shrink-0 rounded-md px-3 py-2 text-sm",
                on ? "bg-elevated text-fg" : "text-muted",
              )}
            >
              {l.short}
            </Link>
          );
        })}
      </nav>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <div className="flex shrink-0 items-center gap-2 border-t border-border p-2 md:hidden">
        {actions}
      </div>
      {footer}
      <span className="sr-only">{lang}</span>
    </div>
  );
}

export function ToolRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
      {children}
    </div>
  );
}

export function NativeSelect({
  value,
  onChange,
  children,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 min-w-0 max-w-full rounded-md border border-border bg-elevated px-2.5 text-sm text-fg",
        className,
      )}
    >
      {children}
    </select>
  );
}
