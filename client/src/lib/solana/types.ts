/**
 * Client-side re-exports of canonical Solana types + narrow UI aliases.
 */
export type {
  AgentOrchestrationPlanReceipt,
  SessionNonceResponse,
  SessionVerifyRequest,
  SessionVerifyResponse,
  SkillAsset,
  SolanaCluster,
  SolanaSessionPermissions,
  SolanaSessionProfile,
  SolanaTxRecord,
  SolanaWalletState,
  WalletConnectionStatus,
} from "@shared/solana/types";

export type { MemoryRecord, ReflectionRecord } from "@shared/domainModel";

/** Same as WalletConnectionStatus — legacy name used by wallet context */
export type SolanaWalletMachineState = import("@shared/solana/types").WalletConnectionStatus;

export interface SolanaSessionNonce {
  nonceId: string;
  nonce: string;
  message: string;
  expiresAt: number;
  cluster: import("@shared/solana/types").SolanaCluster;
}

export interface SolanaSessionStatus {
  token: string | null;
  profile: import("@shared/solana/types").SolanaSessionProfile | null;
}
