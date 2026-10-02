import { createFileRoute } from "@tanstack/react-router";
import { JsLab } from "@/components/labs/js-lab";

export const Route = createFileRoute("/javascript")({
  component: JsLab,
  head: () => ({ meta: [{ title: "JavaScript · NibrasCode Studio" }] }),
});
