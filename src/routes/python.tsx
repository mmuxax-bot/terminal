import { createFileRoute } from "@tanstack/react-router";
import { PythonLab } from "@/components/labs/python-lab";

export const Route = createFileRoute("/python")({
  component: PythonLab,
  head: () => ({ meta: [{ title: "Python · NibrasCode Studio" }] }),
});
