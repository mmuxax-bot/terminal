import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Last piece of program output (the prompt text), shown next to the answer box. */
export function lastPrompt(items: { kind: string; text?: string }[]): string {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.kind === "text" && it.text) return it.text.split("\n").filter(Boolean).pop() ?? "";
  }
  return "";
}
