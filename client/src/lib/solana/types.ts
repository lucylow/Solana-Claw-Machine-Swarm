/**
 * Client-side re-exports of canonical Solana types + narrow UI aliases.
 */
export type {
  SessionNonceResponse,
  SessionVerifyRequest,
  SessionVerifyResponse,
  ReceiptArtifact,
  MemoryArtifact,
  ReflectionArtifact,
  SolanaCluster,
  SolanaConnectionStatus,
  SolanaReceiptRecord,
  SolanaSessionPermissions,
  SolanaSessionProfile,
  SolanaTxRecord,
  SolanaWalletState,
  WalletConnectionStatus,
} from "@shared/solana/types";

export type { MemoryRecord, ReflectionRecord } from "@shared/domainModel";

/** Legacy alias — matches WalletConnectionStatus */
export type SolanaWalletMachineState = import("@shared/solana/types").SolanaConnectionStatus;

export interface SolanaSessionNonce {
  nonceId: string;
  sessionId: string;
  nonce: string;
  message: string;
  expiresAt: number;
  cluster: import("@shared/solana/types").SolanaCluster;
}

export interface SolanaSessionStatus {
  token: string | null;
  profile: import("@shared/solana/types").SolanaSessionProfile | null;
}
