import { createFileRoute } from "@tanstack/react-router";
import { MoreLab } from "@/components/labs/more-lab";

export const Route = createFileRoute("/more")({
  component: MoreLab,
  head: () => ({ meta: [{ title: "Digər dillər · NibrasCode Studio" }] }),
});
