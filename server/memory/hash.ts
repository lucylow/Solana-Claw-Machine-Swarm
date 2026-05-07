import crypto from "crypto";

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [k: string]: CanonicalValue };

function normalizeValue(input: unknown): CanonicalValue {
  if (input === null || typeof input === "boolean" || typeof input === "number" || typeof input === "string") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => normalizeValue(item));
  }

  if (input && typeof input === "object") {
    const sorted: { [k: string]: CanonicalValue } = {};
    for (const key of Object.keys(input).sort()) {
      const value = (input as Record<string, unknown>)[key];
      if (typeof value === "undefined") continue;
      sorted[key] = normalizeValue(value);
    }
    return sorted;
  }

  return String(input);
}

export function canonicalize(input: unknown): string {
  return JSON.stringify(normalizeValue(input));
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hashCanonical(input: unknown): string {
  return sha256Hex(canonicalize(input));
}

export function hashText(input: string): string {
  return sha256Hex(input.trim());
}
