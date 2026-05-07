import { describe, expect, it } from "vitest";
import { canonicalize, hashCanonical, hashText } from "./hash";

describe("memory canonical hashing", () => {
  it("produces stable canonical payload regardless of object key order", () => {
    const first = { b: 2, a: { y: true, x: [2, 1] } };
    const second = { a: { x: [2, 1], y: true }, b: 2 };

    expect(canonicalize(first)).toBe(canonicalize(second));
    expect(hashCanonical(first)).toBe(hashCanonical(second));
  });

  it("hashes normalized text deterministically", () => {
    expect(hashText("same content")).toBe(hashText("same content"));
    expect(hashText("same content")).not.toBe(hashText("different content"));
  });
});
