import { createFileRoute, notFound } from "@tanstack/react-router";
import { WandboxLab } from "@/components/labs/wandbox-lab";
import { findMoreLang, type MoreId } from "@/lib/more-langs";

// /cpp, /java, /php, /go, /rust, /node, /ts, /ruby, /perl, /lua, /bash, /julia, /r, /haskell
export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!findMoreLang(params.lang)) throw notFound();
  },
  component: LangPage,
  head: ({ params }) => ({
    meta: [{ title: `${findMoreLang(params.lang)?.label ?? "Kod"} · NibrasCode Studio` }],
  }),
});

function LangPage() {
  const { lang } = Route.useParams();
  return <WandboxLab key={lang} id={lang as MoreId} />;
}
