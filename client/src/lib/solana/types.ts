export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

export type SolanaWalletMachineState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "signing"
  | "session_verifying"
  | "session_verified"
  | "wrong_cluster"
  | "balance_loading"
  | "ready"
  | "error";

export interface SolanaSessionPermissions {
  canPublishSkills: boolean;
  canRunTasks: boolean;
  canWriteMemory: boolean;
  canAnchorProofs: boolean;
  canBridgeOpenClaw: boolean;
}

export interface SolanaSessionProfile {
  walletAddress: string;
  cluster: SolanaCluster;
  displayName: string;
  verifiedAt: number;
  expiresAt: number;
  nonceId: string;
  sessionId: string;
  permissions: SolanaSessionPermissions;
}

export interface SolanaSessionNonce {
  nonceId: string;
  nonce: string;
  message: string;
  expiresAt: number;
  cluster: SolanaCluster;
}

export interface SolanaSessionStatus {
  token: string | null;
  profile: SolanaSessionProfile | null;
}
