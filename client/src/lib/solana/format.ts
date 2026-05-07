export function shortenAddress(address?: string | null, left = 4, right = 4) {
  if (!address) return "n/a";
  if (address.length <= left + right + 3) return address;
  return `${address.slice(0, left)}...${address.slice(-right)}`;
}

export function formatSolBalance(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "-- SOL";
  return `${value.toFixed(4)} SOL`;
}

export function formatSessionExpiry(ts?: number | null) {
  if (!ts) return "Unknown";
  const diffSec = Math.floor((ts - Date.now()) / 1000);
  if (diffSec <= 0) return "Expired";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m remaining`;
  const hours = Math.floor(mins / 60);
  return `${hours}h remaining`;
}
