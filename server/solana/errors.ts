import type { ErrorCode } from "@shared/errorTypes";

/** Map common @solana/web3.js / RPC message fragments to taxonomy codes. */
export function mapSolanaErrorMessage(message: string): ErrorCode {
  const m = message.toLowerCase();
  if (m.includes("insufficient") && (m.includes("funds") || m.includes("lamports")))
    return "INSUFFICIENT_SOL";
  if (m.includes("blockhash") || m.includes("expired")) return "TX_EXPIRED";
  if (m.includes("simulation failed")) return "TX_SIMULATION_FAILED";
  if (m.includes("429") || m.includes("rate limit")) return "RPC_RATE_LIMITED";
  if (m.includes("timed out") || m.includes("timeout")) return "RPC_TIMEOUT";
  if (m.includes("could not find account")) return "ACCOUNT_NOT_FOUND";
  if (m.includes("custom program error") || m.includes("program log")) return "PROGRAM_ERROR";
  return "UNKNOWN";
}
