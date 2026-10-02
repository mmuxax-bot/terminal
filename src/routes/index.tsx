import { createFileRoute, Link } from "@tanstack/react-router";
import { LANGUAGES } from "@/lib/studio";
import { pythonRuntime } from "@/lib/python-runtime";
import { sqlRuntime } from "@/lib/sql-runtime";
import { ArrowUpRight, Braces, Code2, Database, FileCode, Terminal } from "lucide-react";
import { useEffect, type CSSProperties, type ComponentType } from "react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [{ title: "NibrasCode Studio" }],
  }),
});

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  python: Terminal,
  html: FileCode,
  javascript: Braces,
  sql: Database,
  c: Code2,
};

function Home() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      pythonRuntime.ensure();
      sqlRuntime.ensure();
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <p className="text-lg font-semibold tracking-tight">
            Nibras<span className="text-accent">Code</span>
          </p>
          <p className="text-xs tracking-[0.18em] text-subtle">Studio</p>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8 sm:py-10">
          <p className="text-sm font-medium text-accent">Limitsiz brauzer IDE</p>
          <h1 className="mt-2 max-w-xl text-balance text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Beş dil. Bir studio.
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted sm:text-base">
            Python, HTML/CSS, JavaScript, SQL və C — kodu yazın, dərhal işə salın.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LANGUAGES.map((l, i) => {
              const Icon = ICONS[l.id];
              return (
                <Link
                  key={l.id}
                  to={l.path}
                  className="glow-card group block"
                  style={{ "--glow-delay": `${i * -1.15}s` } as CSSProperties}
                >
                  <div className="flex h-full items-center gap-3 rounded-[15px] bg-surface px-3.5 py-3.5 transition-colors duration-200 group-hover:bg-elevated lg:flex-col lg:items-start lg:gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-elevated text-accent">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-medium">{l.label}</h2>
                        <ArrowUpRight className="size-3.5 shrink-0 text-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-relaxed text-muted">{l.blurb}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-subtle">
            <li>Ctrl+Enter — işə sal</li>
            <li>HTML terminalı yeni səhifədə açır</li>
            <li>Avtomatik yaddaş</li>
            <li>numpy / pandas / matplotlib</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
