import type { ProofStatus } from "@shared/structuredReceipt";

export function proofStatusBadgeLabel(status: ProofStatus): string {
  switch (status) {
    case "verified":
      return "Verified on Solana";
    case "pending":
      return "Pending verification";
    case "degraded":
      return "Proof degraded";
    case "cached_only":
      return "Fixture cache — not verified live";
    case "demo_only":
      return "Demo fixture only";
    default:
      return "Unverified";
  }
}

export function proofStatusHint(status: ProofStatus): string {
  switch (status) {
    case "verified":
      return "Explorer-verifiable tx + linked fields.";
    case "pending":
      return "Submitted or confirmed — wait for verifier / finality.";
    case "degraded":
      return "Missing signature, explorer link, or anchor failed.";
    case "cached_only":
      return "Fixture or browser preview — not live chain truth.";
    case "demo_only":
      return "Synthetic row for demos — check for real tx before claiming proof.";
    default:
      return "No proof bundle attached to this row yet.";
  }
}
