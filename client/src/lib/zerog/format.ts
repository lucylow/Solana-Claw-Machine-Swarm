export function formatHash(value?: string, chars = 8) {
  if (!value) return "n/a";
  if (value.length <= chars * 2) return value;
  return `${value.slice(0, chars)}...${value.slice(-chars)}`;
}

export function formatRef(value?: string) {
  if (!value) return "unlinked";
  return value.replace(/^https?:\/\//, "");
}

export function toStatusTone(status: string) {
  if (["verified", "confirmed", "completed", "stored", "available"].includes(status)) return "ok";
  if (["degraded", "failed"].includes(status)) return "warn";
  if (["pending", "running", "queued", "idle"].includes(status)) return "muted";
  return "muted";
}
