/**
 * Product truth: primary UI copy must not ship vague “AI” marketing without proof context.
 * Scan surfaces with `productCopySurfaces.test.ts`.
 */

export const BANNED_VAGUE_PHRASES = [
  "AI-powered",
  "smart automation",
  "next-gen AI",
  "intelligent dashboard",
  "powered by AI",
  "magical",
  "seamless agentic",
  "autonomous intelligence",
] as const;

export function isVagueCopy(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_VAGUE_PHRASES.some((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );
}
