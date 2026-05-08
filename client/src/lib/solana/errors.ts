import type { ErrorCode } from "@shared/errorTypes";

/** Map wallet-adapter / browser errors into shared taxonomy (client-only heuristics). */
export function mapWalletAdapterError(message: string): ErrorCode {
  const m = message.toLowerCase();
  if (m.includes("user rejected") || m.includes("rejected the request")) return "WALLET_CONNECTION_REJECTED";
  if (m.includes("not installed") || m.includes("no solana")) return "WALLET_UNSUPPORTED";
  if (m.includes("wrong network") || m.includes("network mismatch")) return "WALLET_WRONG_CLUSTER";
  if (m.includes("sign") && m.includes("fail")) return "WALLET_SESSION_SIGN_FAILED";
  return "UNKNOWN";
}
