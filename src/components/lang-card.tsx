import { Link } from "@tanstack/react-router";
import type { LangMeta } from "@/lib/studio";
import {
  ArrowUpRight,
  BarChart3,
  Binary,
  Braces,
  Code2,
  Coffee,
  Cpu,
  Database,
  FileCode,
  Gem,
  Globe,
  Layers,
  Moon,
  Sigma,
  SquareTerminal,
  Terminal,
  Zap,
} from "lucide-react";
import type { CSSProperties, ComponentType } from "react";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  python: Terminal,
  html: FileCode,
  javascript: Braces,
  sql: Database,
  c: Code2,
  cpp: Cpu,
  java: Coffee,
  php: Globe,
  go: Zap,
  rust: Layers,
  node: Braces,
  ts: FileCode,
  ruby: Gem,
  perl: Binary,
  lua: Moon,
  bash: SquareTerminal,
  julia: Sigma,
  r: BarChart3,
  haskell: Code2,
  more: Layers,
};

/** Language card used on the home page and on /more. */
export function LangCard({ lang, index }: { lang: LangMeta; index: number }) {
  const Icon = ICONS[lang.id] ?? Code2;
  return (
    <Link
      to={lang.path}
      className="glow-card group block"
      style={{ "--glow-delay": `${index * -1.15}s` } as CSSProperties}
    >
      <div className="flex h-full items-center gap-3 rounded-[15px] bg-surface px-3.5 py-3.5 transition-colors duration-200 group-hover:bg-elevated lg:flex-col lg:items-start lg:gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-elevated text-accent">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{lang.label}</h2>
            <ArrowUpRight className="size-3.5 shrink-0 text-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <p className="mt-0.5 truncate text-xs leading-relaxed text-muted">{lang.blurb}</p>
        </div>
      </div>
    </Link>
  );
}
