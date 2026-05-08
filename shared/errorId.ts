export function newErrorId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `err_${globalThis.crypto.randomUUID()}`;
  }
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
