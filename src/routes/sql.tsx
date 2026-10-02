import { createFileRoute } from "@tanstack/react-router";
import { SqlLab } from "@/components/labs/sql-lab";

export const Route = createFileRoute("/sql")({
  component: SqlLab,
  head: () => ({ meta: [{ title: "SQL · NibrasCode Studio" }] }),
});
