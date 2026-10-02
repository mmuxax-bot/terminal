import { createFileRoute } from "@tanstack/react-router";
import { CLab } from "@/components/labs/c-lab";

export const Route = createFileRoute("/c")({
  component: CLab,
  head: () => ({ meta: [{ title: "C · NibrasCode Studio" }] }),
});
