import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { BANNED_VAGUE_PHRASES } from "../client/src/lib/copy/bannedPhrases";

const root = path.resolve(import.meta.dirname, "..");

/** Primary marketing / command-center copy — must stay evidence-first. */
const COPY_SURFACES = [
  "shared/copy.ts",
  "shared/clawMachineMock.ts",
  "client/src/components/swarm/SwarmLanding.tsx",
  "client/src/components/swarm/CommandCenterPanels.tsx",
  "client/src/components/command-center/CommandCenterShell.tsx",
  "client/src/pages/HowItWorks.tsx",
  "client/src/pages/Dashboard.tsx",
];

describe("product copy policy (no vague AI marketing)", () => {
  for (const rel of COPY_SURFACES) {
    it(`${rel} avoids banned phrases`, () => {
      const text = readFileSync(path.join(root, rel), "utf8");
      for (const phrase of BANNED_VAGUE_PHRASES) {
        expect(
          text.toLowerCase().includes(phrase.toLowerCase()),
          `"${phrase}" leaked into ${rel}`,
        ).toBe(false);
      }
    });
  }
});
