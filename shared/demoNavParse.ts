import type { DemoSection } from "./demoTypes";

const ALLOWED: readonly DemoSection[] = [
  "hub",
  "wallet",
  "skills",
  "execution",
  "reflection",
  "memory",
  "receipts",
  "reputation",
  "full-story",
  "playground",
];

const ALLOWED_SET = new Set<string>(ALLOWED);

/** Parse `/demo`, `/demo/hub`, `/demo/wallet`, … into a demo section id. */
export function parseDemoSection(location: string): DemoSection {
  const m = location.match(/^\/demo(?:\/([^/?#]+))?/);
  const raw = (m?.[1] ?? "").trim();
  if (!raw || raw === "hub") return "hub";
  if (ALLOWED_SET.has(raw)) return raw as DemoSection;
  return "hub";
}
