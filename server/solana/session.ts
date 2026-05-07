import crypto from "crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import type {
  SessionNonceResponse,
  SessionVerifyResponse,
  SolanaCluster,
  SolanaSessionPermissions,
  SolanaSessionProfile,
} from "@shared/solana/types";

type NonceRecord = {
  nonceId: string;
  nonce: string;
  walletAddress: string;
  issuedAt: number;
  expiresAt: number;
  cluster: SolanaCluster;
  message: string;
  used: boolean;
};

type SessionRecord = {
  token: string;
  profile: SolanaSessionProfile;
  createdAt: number;
  updatedAt: number;
};

function nowMs() {
  return Date.now();
}

function randomId(prefix: string, size = 12) {
  return `${prefix}_${crypto.randomBytes(size).toString("hex")}`;
}

function defaultPermissions(): SolanaSessionPermissions {
  return {
    canPublishSkills: true,
    canRunTasks: true,
    canWriteMemory: true,
    canAnchorProofs: true,
    canBridgeOpenClaw: true,
  };
}

function deriveDisplayName(walletAddress: string) {
  return `Agent ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
}

export class SolanaSessionService {
  private readonly nonceStore = new Map<string, NonceRecord>();

  private readonly sessionStore = new Map<string, SessionRecord>();

  private readonly walletSessionIndex = new Map<string, string>();

  private readonly cluster: SolanaCluster;

  private readonly productName: string;

  constructor(opts?: { cluster?: SolanaCluster; productName?: string }) {
    this.cluster = opts?.cluster || "devnet";
    this.productName = opts?.productName || "CLAW MACHINE";
  }

  issueNonce(walletAddress: string): SessionNonceResponse {
    const normalizedWallet = walletAddress.trim();
    const issuedAt = nowMs();
    const expiresAt = issuedAt + 5 * 60 * 1000;
    const nonceId = randomId("nonce");
    const nonce = crypto.randomBytes(16).toString("hex");
    const issuedAtIso = new Date(issuedAt).toISOString();
    const message = [
      `${this.productName} Solana Session`,
      `Wallet: ${normalizedWallet}`,
      `Cluster: ${this.cluster}`,
      "Purpose: Session verification for command center access",
      `Nonce: ${nonce}`,
      `Timestamp: ${issuedAtIso}`,
      `URI: /api/solana/session/verify`,
    ].join("\n");

    this.nonceStore.set(nonceId, {
      nonceId,
      nonce,
      walletAddress: normalizedWallet,
      issuedAt,
      expiresAt,
      cluster: this.cluster,
      message,
      used: false,
    });

    return {
      nonceId,
      nonce,
      message,
      expiresAt,
      cluster: this.cluster,
    };
  }

  verifySession(input: { walletAddress: string; nonceId: string; signature: string }): SessionVerifyResponse {
    const normalizedWallet = input.walletAddress.trim();
    const nonce = this.nonceStore.get(input.nonceId);
    if (!nonce) throw new Error("session_nonce_not_found");
    if (nonce.used) throw new Error("session_nonce_already_used");
    if (nonce.walletAddress !== normalizedWallet) throw new Error("session_wallet_mismatch");
    if (nonce.expiresAt < nowMs()) throw new Error("session_nonce_expired");

    const messageBytes = new TextEncoder().encode(nonce.message);
    const signatureBytes = bs58.decode(input.signature);
    const walletBytes = new PublicKey(normalizedWallet).toBytes();
    const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, walletBytes);
    if (!valid) throw new Error("session_signature_invalid");

    nonce.used = true;
    this.nonceStore.set(nonce.nonceId, nonce);

    const token = randomId("solsess", 24);
    const sessionId = randomId("session");
    const verifiedAt = nowMs();
    const expiresAt = verifiedAt + 60 * 60 * 1000;
    const profile: SolanaSessionProfile = {
      walletAddress: normalizedWallet,
      cluster: nonce.cluster,
      displayName: deriveDisplayName(normalizedWallet),
      verifiedAt,
      expiresAt,
      nonceId: nonce.nonceId,
      sessionId,
      permissions: defaultPermissions(),
    };
    const record: SessionRecord = {
      token,
      profile,
      createdAt: verifiedAt,
      updatedAt: verifiedAt,
    };

    const previousToken = this.walletSessionIndex.get(normalizedWallet);
    if (previousToken) this.sessionStore.delete(previousToken);

    this.walletSessionIndex.set(normalizedWallet, token);
    this.sessionStore.set(token, record);
    return { token, profile };
  }

  getSessionFromToken(token?: string | null): SolanaSessionProfile | null {
    if (!token) return null;
    const value = token.trim();
    if (!value) return null;
    const record = this.sessionStore.get(value);
    if (!record) return null;
    if (record.profile.expiresAt < nowMs()) {
      this.sessionStore.delete(value);
      this.walletSessionIndex.delete(record.profile.walletAddress);
      return null;
    }
    return record.profile;
  }

  refreshSession(token: string): SessionVerifyResponse {
    const record = this.sessionStore.get(token);
    if (!record) throw new Error("session_not_found");
    if (record.profile.expiresAt < nowMs()) throw new Error("session_expired");

    const refreshed: SessionRecord = {
      ...record,
      profile: {
        ...record.profile,
        expiresAt: nowMs() + 60 * 60 * 1000,
      },
      updatedAt: nowMs(),
    };
    this.sessionStore.set(token, refreshed);
    return {
      token,
      profile: refreshed.profile,
    };
  }

  logoutSession(token: string) {
    const record = this.sessionStore.get(token);
    if (!record) return { ok: true };
    this.walletSessionIndex.delete(record.profile.walletAddress);
    this.sessionStore.delete(token);
    return { ok: true };
  }

  getStatus() {
    const activeSessions = Array.from(this.sessionStore.values()).filter(
      row => row.profile.expiresAt > nowMs()
    ).length;
    return {
      cluster: this.cluster,
      product: this.productName,
      activeSessions,
      outstandingNonces: Array.from(this.nonceStore.values()).filter(
        row => !row.used && row.expiresAt > nowMs()
      ).length,
    };
  }
}

