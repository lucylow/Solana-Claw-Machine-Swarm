import crypto from "crypto";
import { nanoid } from "nanoid";
import bs58 from "bs58";
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getSolanaSessionByWallet } from "../db";
import { buildCompactSolanaBridgeMemo } from "./compactMemo";
import {
  deriveConfigPda,
  deriveProfilePda,
  deriveSkillPda,
  normalizeWalletAddress,
} from "./pda";
import type { MirrorAccountKind, MirrorHistoryRecord } from "./indexerStore";
import { SolanaIndexerStore } from "./indexerStore";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);
const DEFAULT_PROGRAM_ID = "11111111111111111111111111111111";

export type BridgeAction =
  | "initialize_registry"
  | "create_skill"
  | "update_skill_version"
  | "create_plan_receipt"
  | "complete_plan_receipt"
  | "create_memory_receipt"
  | "create_reflection_receipt"
  | "create_proof_receipt"
  | "anchor_receipt"
  | "verify_receipt"
  | "record_queue_event"
  | "record_deployment_receipt";

export interface BuildBridgeInstructionInput {
  walletAddress: string;
  action: BridgeAction;
  subjectId: string;
  payloadHash: string;
  receiptId?: string;
  metadata?: Record<string, unknown>;
}

export interface BuildBridgeInstructionResult {
  requestId: string;
  cluster: string;
  programId: string;
  walletAddress: string;
  action: BridgeAction;
  subjectId: string;
  payloadHash: string;
  accountAddress: string;
  accountKind: MirrorAccountKind;
  explorerAccountUrl: string;
  explorerProgramUrl: string;
  status: "building" | "submitted" | "failed";
}

export interface SendBridgeInstructionResult
  extends BuildBridgeInstructionResult {
  txSignature?: string;
  explorerTxUrl?: string;
  status: "submitted" | "failed";
  error?: string;
}

function loadRelayerSigner() {
  const secret =
    process.env.SOLANA_BACKEND_SIGNER || process.env.SOLANA_RELAYER_SECRET_KEY;
  if (!secret) return undefined;
  const trimmed = secret.trim();
  if (!trimmed) return undefined;

  try {
    if (trimmed.startsWith("[")) {
      const values = JSON.parse(trimmed) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(values));
    }
    return Keypair.fromSecretKey(bs58.decode(trimmed));
  } catch (error) {
    throw new Error(
      `invalid_backend_signer: ${
        error instanceof Error
          ? error.message
          : "unable to decode SOLANA_BACKEND_SIGNER"
      }`,
    );
  }
}

function isValidHash(hash: string) {
  return /^[0-9a-f]{32,128}$/i.test(hash);
}

function shortHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function seedFromSubject(subjectId: string) {
  return Buffer.from(shortHash(subjectId), "hex");
}

export class SolanaBridgeService {
  private readonly connection: Connection;
  private readonly relayer?: Keypair;
  private readonly programId: PublicKey;
  private readonly explorerBase: string;
  private readonly cluster: string;
  private readonly commitment: Commitment;

  constructor(private readonly store: SolanaIndexerStore) {
    const endpoint =
      process.env.SOLANA_RPC_URL ||
      process.env.SOLANA_RPC_ENDPOINT ||
      "https://api.devnet.solana.com";
    this.connection = new Connection(endpoint, "confirmed");
    this.relayer = loadRelayerSigner();
    this.programId = new PublicKey(
      (
        process.env.SOLANA_PROGRAM_ID ||
        process.env.CLAW_IDENTITY_PROGRAM_ID ||
        DEFAULT_PROGRAM_ID
      ).trim(),
    );
    this.cluster = process.env.SOLANA_CLUSTER || "devnet";
    this.explorerBase =
      process.env.SOLANA_EXPLORER_BASE || "https://explorer.solana.com";
    this.commitment =
      (process.env.SOLANA_COMMITMENT as Commitment) || "confirmed";
  }

  getProgramId() {
    return this.programId.toBase58();
  }

  getCluster() {
    return this.cluster;
  }

  buildExplorerUrl(kind: "tx" | "address", value: string) {
    const path = kind === "tx" ? `tx/${value}` : `address/${value}`;
    return `${this.explorerBase}/${path}?cluster=${this.cluster}`;
  }

  async getNetwork() {
    const [latestBlockhash, epochInfo, slot] = await Promise.all([
      this.connection.getLatestBlockhash(this.commitment),
      this.connection.getEpochInfo(this.commitment),
      this.connection.getSlot(this.commitment),
    ]);
    return {
      cluster: this.cluster,
      rpcUrl: this.connection.rpcEndpoint,
      programId: this.programId.toBase58(),
      relayerWallet: this.relayer?.publicKey.toBase58(),
      latestBlockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      epoch: epochInfo.epoch,
      slot,
      commitment: this.commitment,
    };
  }

  async getSession(walletAddress: string) {
    const wallet = normalizeWalletAddress(walletAddress);
    const row = await getSolanaSessionByWallet(wallet);
    const now = new Date();
    const expiresAt = row?.expiresAt ? new Date(row.expiresAt) : undefined;
    const active = Boolean(
      row && row.isVerified === 1 && expiresAt && expiresAt > now,
    );
    return {
      walletAddress: wallet,
      cluster: this.cluster,
      programId: this.programId.toBase58(),
      isActive: active,
      isVerified: row?.isVerified === 1,
      hasSignature: Boolean(row?.signature),
      nonce: row?.nonce,
      expiresAt: expiresAt?.toISOString(),
      sessionId: row?.id,
      userId: row?.userId,
    };
  }

  private deriveAccount(
    action: BridgeAction,
    walletAddress: string,
    subjectId: string,
  ) {
    const wallet = new PublicKey(walletAddress);
    const subjectSeed = seedFromSubject(subjectId);
    const configPda = deriveConfigPda(this.programId.toBase58());
    const profilePda = deriveProfilePda(
      walletAddress,
      this.programId.toBase58(),
    );
    const [planReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("plan_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId,
    );
    const [memoryReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("memory_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId,
    );
    const [proofReceiptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proof_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId,
    );

    switch (action) {
      case "initialize_registry":
        return { address: configPda, kind: "registry" as const };
      case "create_skill": {
        const skillPda = deriveSkillPda(
          walletAddress,
          subjectId,
          this.programId.toBase58(),
        );
        return { address: skillPda, kind: "skill" as const };
      }
      case "update_skill_version": {
        const [skillVersionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("skill_version"), wallet.toBuffer(), subjectSeed],
          this.programId,
        );
        return {
          address: skillVersionPda.toBase58(),
          kind: "skill_version" as const,
        };
      }
      case "create_plan_receipt":
      case "complete_plan_receipt":
        return {
          address: planReceiptPda.toBase58(),
          kind: "plan_receipt" as const,
        };
      case "create_memory_receipt":
      case "create_reflection_receipt":
        return {
          address: memoryReceiptPda.toBase58(),
          kind: "memory_receipt" as const,
        };
      case "create_proof_receipt":
      case "anchor_receipt":
      case "verify_receipt":
      case "record_queue_event":
      case "record_deployment_receipt":
        return {
          address: proofReceiptPda.toBase58(),
          kind: "proof_receipt" as const,
        };
      default:
        return { address: profilePda, kind: "unknown" as const };
    }
  }

  async buildInstruction(
    input: BuildBridgeInstructionInput,
  ): Promise<BuildBridgeInstructionResult> {
    const walletAddress = normalizeWalletAddress(input.walletAddress);
    if (!input.subjectId.trim()) throw new Error("subject_id_required");
    if (!isValidHash(input.payloadHash))
      throw new Error("payload_hash_invalid");
    const derived = this.deriveAccount(
      input.action,
      walletAddress,
      input.subjectId,
    );
    const requestId = `sol_${nanoid(12)}`;

    await this.store.saveHistory({
      id: requestId,
      action: input.action,
      walletAddress,
      cluster: this.cluster,
      accountAddress: derived.address,
      accountKind: derived.kind,
      programId: this.programId.toBase58(),
      payloadHash: input.payloadHash,
      status: "building",
      receiptId: input.receiptId,
      requestId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      requestId,
      cluster: this.cluster,
      programId: this.programId.toBase58(),
      walletAddress,
      action: input.action,
      subjectId: input.subjectId,
      payloadHash: input.payloadHash,
      accountAddress: derived.address,
      accountKind: derived.kind,
      explorerAccountUrl: this.buildExplorerUrl("address", derived.address),
      explorerProgramUrl: this.buildExplorerUrl(
        "address",
        this.programId.toBase58(),
      ),
      status: "building",
    };
  }

  private buildMemoInstruction(
    build: BuildBridgeInstructionResult,
    metadata?: Record<string, unknown>,
  ) {
    const memo = buildCompactSolanaBridgeMemo(
      {
        requestId: build.requestId,
        action: build.action,
        subjectId: build.subjectId,
        payloadHash: build.payloadHash,
        accountAddress: build.accountAddress,
        walletAddress: build.walletAddress,
        cluster: build.cluster,
      },
      metadata,
    );
    return new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memo, "utf8"),
    });
  }

  async sendInstruction(
    input: BuildBridgeInstructionInput,
  ): Promise<SendBridgeInstructionResult> {
    const build = await this.buildInstruction(input);
    if (!this.relayer) {
      const failed = {
        ...build,
        status: "failed" as const,
        error: "backend_signer_missing",
      };
      await this.updateHistory(build.requestId, {
        status: "failed",
        error: failed.error,
      });
      return failed;
    }

    try {
      const blockhash = await this.connection.getLatestBlockhash(
        this.commitment,
      );
      const tx = new Transaction({
        feePayer: this.relayer.publicKey,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
      }).add(this.buildMemoInstruction(build, input.metadata));

      const signature = await this.connection.sendTransaction(
        tx,
        [this.relayer],
        {
          preflightCommitment: this.commitment,
        },
      );

      const explorerTxUrl = this.buildExplorerUrl("tx", signature);
      await this.updateHistory(build.requestId, {
        status: "submitted",
        txSignature: signature,
      });
      await this.store.saveAccount({
        address: build.accountAddress,
        kind: build.accountKind,
        ownerWallet: build.walletAddress,
        programId: this.programId.toBase58(),
        subjectId: build.subjectId,
        action: build.action,
        payloadHash: build.payloadHash,
        status: "pending",
        txSignature: signature,
        explorerUrl: explorerTxUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        ...build,
        txSignature: signature,
        explorerTxUrl,
        status: "submitted",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "tx_send_failed";
      await this.updateHistory(build.requestId, {
        status: "failed",
        error: message,
      });
      return {
        ...build,
        status: "failed",
        error: message,
      };
    }
  }

  async confirmInstruction(input: {
    requestId?: string;
    txSignature: string;
    accountAddress?: string;
  }) {
    const txSignature = String(input.txSignature || "").trim();
    if (!txSignature) throw new Error("tx_signature_required");
    const confirmation = await this.connection.confirmTransaction(
      txSignature,
      this.commitment,
    );
    const failed = Boolean(confirmation.value.err);
    const status = failed ? "failed" : "confirmed";
    if (input.requestId) {
      await this.updateHistory(input.requestId, {
        status,
        txSignature,
        error: failed ? JSON.stringify(confirmation.value.err) : undefined,
      });
    }

    if (input.accountAddress) {
      const account = await this.store.getAccount(input.accountAddress);
      if (account) {
        await this.store.saveAccount({
          ...account,
          status: failed ? "failed" : "confirmed",
          txSignature,
          explorerUrl: this.buildExplorerUrl("tx", txSignature),
          updatedAt: Date.now(),
        });
      }
    }

    return {
      txSignature,
      status,
      confirmationError: confirmation.value.err || null,
      explorerTxUrl: this.buildExplorerUrl("tx", txSignature),
    };
  }

  async listMirrorAccounts(filter?: {
    wallet?: string;
    kind?: MirrorAccountKind;
    status?: string;
  }) {
    return this.store.listAccounts(filter);
  }

  async getMirrorAccount(address: string) {
    return this.store.getAccount(address);
  }

  async listHistory(filter?: {
    wallet?: string;
    account?: string;
    status?: MirrorHistoryRecord["status"];
    limit?: number;
  }) {
    return this.store.listHistory(filter);
  }

  private async updateHistory(
    id: string,
    updates: Partial<
      Pick<MirrorHistoryRecord, "status" | "txSignature" | "error">
    >,
  ) {
    const history = await this.store.listHistory({ limit: 5000 });
    const existing = history.find((row) => row.id === id);
    if (!existing) return;
    await this.store.saveHistory({
      ...existing,
      status: updates.status || existing.status,
      txSignature: updates.txSignature || existing.txSignature,
      error: updates.error,
      updatedAt: Date.now(),
    });
  }
}
