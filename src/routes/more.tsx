import { createFileRoute, Link } from "@tanstack/react-router";
import { LangCard } from "@/components/lang-card";
import { EXTRA_LANGUAGES } from "@/lib/studio";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/more")({
  component: MorePage,
  head: () => ({ meta: [{ title: "Digər dillər · NibrasCode Studio" }] }),
});

function MorePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Nibras<span className="text-accent">Code</span>
          </Link>
          <Link
            to="/"
            className="inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" />
            Ana səhifə
          </Link>
        </header>
        <section className="flex flex-1 flex-col justify-center py-8 sm:py-10">
          <p className="text-sm font-medium text-accent">Digər dillər</p>
          <h1 className="mt-2 max-w-xl text-balance text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Dilini seç.
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted sm:text-base">
            Hər dilin öz səhifəsi, öz nümunəsi var. Nəticə yeni səhifədə açılır, kodu telefona
            yükləyə bilərsən.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRA_LANGUAGES.map((l, i) => (
              <LangCard key={l.id} lang={l} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
