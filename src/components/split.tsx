import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export { Panel };

export function Split({
  orientation,
  className,
  children,
}: {
  orientation: "horizontal" | "vertical";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Group orientation={orientation} className={cn("h-full min-h-0 w-full", className)}>
      {children}
    </Group>
  );
}

export function Handle({ className }: { className?: string }) {
  return <Separator className={cn("bg-border hover:bg-accent/40", className)} />;
}
