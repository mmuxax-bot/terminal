import { createFileRoute } from "@tanstack/react-router";
import { HtmlLab } from "@/components/labs/html-lab";

export const Route = createFileRoute("/html")({
  component: HtmlLab,
  head: () => ({ meta: [{ title: "HTML / CSS · NibrasCode Studio" }] }),
});
