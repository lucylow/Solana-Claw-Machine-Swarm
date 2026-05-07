import { describe, expect, it } from "vitest";
import { parseDemoSection } from "../shared/demoNavParse";

describe("parseDemoSection", () => {
  it("maps /demo and /demo/hub to hub", () => {
    expect(parseDemoSection("/demo")).toBe("hub");
    expect(parseDemoSection("/demo/")).toBe("hub");
    expect(parseDemoSection("/demo/hub")).toBe("hub");
  });

  it("maps known paths", () => {
    expect(parseDemoSection("/demo/wallet")).toBe("wallet");
    expect(parseDemoSection("/demo/full-story")).toBe("full-story");
    expect(parseDemoSection("/demo/playground")).toBe("playground");
  });

  it("falls back to hub for unknown segments", () => {
    expect(parseDemoSection("/demo/unknown-route")).toBe("hub");
  });
});
