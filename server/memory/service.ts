import crypto from "crypto";
import { nanoid } from "nanoid";
import { storagePut } from "../storage";
import { hashCanonical, hashText } from "./hash";
import { MemoryReceiptStore } from "./store";
import type {
  MemoryChainQuery,
  MemoryInjectionBundle,
  MemoryInjectionItem,
  MemoryLifecycleEvent,
  MemoryReceiptOnChain,
  MemoryReceiptStatus,
  MemoryTurnLink,
  MemoryVerificationResult,
  ReflectionKind,
  ReflectionRecordOffchain,
  StructuredReflection,
} from "@shared/memoryReceipts";

type AnchorClient = {
  createMemoryReceipt(input: {
    receiptId: string;
    wallet: string;
    reflectionHash: string;
    summaryHash: string;
    nextActionHash: string;
    storageRefHash: string;
    sourceTurnIdHash: string;
    parentReceiptIdHash?: string;
    chainId: number;
  }): Promise<{ txSig: string; receiptAccount: string }>;
};

export interface MemoryServiceOptions {
  chainId: number;
  defaultWallet: string;
  defaultVisibility?: ReflectionRecordOffchain["visibility"];
  onchain?: AnchorClient;
}

export interface CreateReflectionInput {
  agentId: string;
  conversationId?: string;
  wallet?: string;
  sourceTurnId: string;
  parentReceiptId?: string;
  kind: ReflectionKind;
  title: string;
  summary: string;
  fullText: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  tags?: string[];
  visibility?: ReflectionRecordOffchain["visibility"];
  structured?: Partial<StructuredReflection>;
}

function nowIso() {
  return new Date().toISOString();
}

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

function buildStructuredReflection(input: CreateReflectionInput): StructuredReflection {
  return {
    rootCause: input.rootCause,
    failureMode: input.kind === "failure" ? "execution_failure" : undefined,
    correctiveAdvice: input.correctiveAdvice,
    nextTurnInjection: input.nextAction,
    lessonSummary: input.summary,
    confidence: Math.max(0, Math.min(1, input.structured?.confidence ?? 0.75)),
    reusable: input.structured?.reusable ?? true,
    priority: input.structured?.priority ?? (input.kind === "failure" ? "high" : "normal"),
  };
}

function toStoragePayload(record: Omit<ReflectionRecordOffchain, "storageRef" | "storageChecksum">) {
  return {
    id: record.id,
    version: record.version,
    agentId: record.agentId,
    conversationId: record.conversationId,
    sourceTurnId: record.sourceTurnId,
    parentReceiptId: record.parentReceiptId,
    kind: record.kind,
    title: record.title,
    summary: record.summary,
    fullText: record.fullText,
    rootCause: record.rootCause,
    correctiveAdvice: record.correctiveAdvice,
    nextAction: record.nextAction,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    payloadHash: record.payloadHash,
    sourceContextHash: record.sourceContextHash,
    visibility: record.visibility,
    structured: record.structured,
  };
}

export class MemoryReceiptService {
  constructor(
    private readonly store: MemoryReceiptStore,
    private readonly options: MemoryServiceOptions
  ) {}

  async createReflection(input: CreateReflectionInput) {
    const now = nowIso();
    const id = `refl_${nanoid(14)}`;
    const structured = buildStructuredReflection(input);
    const payloadHash = hashCanonical({
      kind: input.kind,
      summary: input.summary,
      fullText: input.fullText,
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextAction: input.nextAction,
      structured,
    });
    const sourceContextHash = hashCanonical({
      sourceTurnId: input.sourceTurnId,
      agentId: input.agentId,
      conversationId: input.conversationId || null,
      parentReceiptId: input.parentReceiptId || null,
    });

    const baseRecord: Omit<ReflectionRecordOffchain, "storageRef" | "storageChecksum"> = {
      id,
      version: 1,
      agentId: input.agentId,
      conversationId: input.conversationId,
      sourceTurnId: input.sourceTurnId,
      parentReceiptId: input.parentReceiptId,
      kind: input.kind,
      title: input.title,
      summary: input.summary,
      fullText: input.fullText,
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextAction: input.nextAction,
      tags: input.tags?.slice(0, 20) || [],
      createdAt: now,
      updatedAt: now,
      payloadHash,
      sourceContextHash,
      visibility: input.visibility ?? this.options.defaultVisibility ?? "workspace",
      structured,
    };

    let storageRef = `app://memory/reflections/${id}.json`;
    let storageChecksum = hashCanonical(toStoragePayload(baseRecord));
    let degraded = false;

    try {
      const upload = await storagePut(
        `memory-reflections/${id}.json`,
        JSON.stringify(toStoragePayload(baseRecord), null, 2),
        "application/json"
      );
      storageRef = upload.url;
      storageChecksum = hashText(upload.key);
    } catch {
      degraded = true;
    }

    const reflection: ReflectionRecordOffchain = {
      ...baseRecord,
      storageRef,
      storageChecksum,
    };

    await this.store.saveReflection(reflection);
    await this.pushEvent({
      reflectionId: reflection.id,
      kind: "reflection_created",
      message: "Reflection captured off-chain.",
      data: {
        agentId: reflection.agentId,
        sourceTurnId: reflection.sourceTurnId,
      },
    });
    await this.pushEvent({
      reflectionId: reflection.id,
      kind: "reflection_stored",
      message: degraded
        ? "Reflection stored in local app storage (degraded remote storage)."
        : "Reflection stored in app storage.",
      data: {
        storageRef: reflection.storageRef,
        storageChecksum: reflection.storageChecksum,
        degraded,
      },
    });

    return {
      reflection,
      status: {
        reflectionId: reflection.id,
        status: degraded ? "degraded" : "stored",
        message: degraded
          ? "Stored locally; remote storage unavailable."
          : "Full reflection persisted off-chain.",
      } satisfies MemoryReceiptStatus,
    };
  }

  async anchorReflection(reflectionId: string, wallet?: string) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");

    const existing = await this.store.getReceiptByReflectionId(reflectionId);
    if (existing) return existing;

    const sourceTurnIdHash = hashText(reflection.sourceTurnId);
    const parentReceiptIdHash = reflection.parentReceiptId ? hashText(reflection.parentReceiptId) : undefined;
    const summaryHash = hashText(reflection.summary);
    const nextActionHash = hashText(reflection.nextAction);
    const storageRefHash = hashText(reflection.storageRef || "");

    const receipt: MemoryReceiptOnChain = {
      id: `mr_${nanoid(14)}`,
      version: 1,
      agentId: reflection.agentId,
      wallet: wallet || this.options.defaultWallet,
      sourceTurnIdHash,
      parentReceiptIdHash,
      reflectionHash: reflection.payloadHash,
      summaryHash,
      nextActionHash,
      storageRefHash,
      createdAtUnix: unixNow(),
      status: "anchored",
      chainId: this.options.chainId,
      verified: false,
      sourceMemoryIdHash: hashText(reflection.id),
      tags: reflection.tags,
    };

    try {
      if (this.options.onchain) {
        const anchored = await this.options.onchain.createMemoryReceipt({
          receiptId: receipt.id,
          wallet: receipt.wallet,
          reflectionHash: receipt.reflectionHash,
          summaryHash: receipt.summaryHash,
          nextActionHash: receipt.nextActionHash,
          storageRefHash: receipt.storageRefHash,
          sourceTurnIdHash: receipt.sourceTurnIdHash,
          parentReceiptIdHash: receipt.parentReceiptIdHash,
          chainId: receipt.chainId,
        });
        receipt.solanaTxSig = anchored.txSig;
        receipt.solanaAccount = anchored.receiptAccount;
      } else {
        const synthetic = hashCanonical({
          receiptId: receipt.id,
          reflectionHash: receipt.reflectionHash,
          sourceTurnIdHash,
          createdAtUnix: receipt.createdAtUnix,
        }).slice(0, 44);
        receipt.solanaTxSig = `SIM_${synthetic}`;
        receipt.solanaAccount = `pda_${hashText(receipt.id).slice(0, 32)}`;
      }
    } catch (error) {
      receipt.status = "degraded";
      receipt.note = error instanceof Error ? error.message : "onchain_anchor_failed";
    }

    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId: reflection.id,
      receiptId: receipt.id,
      kind: receipt.status === "degraded" ? "receipt_degraded" : "receipt_anchored",
      message:
        receipt.status === "degraded"
          ? "Receipt degraded: on-chain anchor failed, proof kept in app ledger."
          : "Compact proof anchored on Solana.",
      data: {
        txSig: receipt.solanaTxSig,
        account: receipt.solanaAccount,
        status: receipt.status,
      },
    });

    return receipt;
  }

  async linkReceiptToNextTurn(reflectionId: string, input: { nextTurnId: string; reason?: string }) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    if (!receipt) throw new Error("receipt_not_found");

    const nextTurnIdHash = hashText(input.nextTurnId);
    const link: MemoryTurnLink = {
      id: `lnk_${nanoid(12)}`,
      receiptId: receipt.id,
      sourceTurnIdHash: receipt.sourceTurnIdHash,
      nextTurnIdHash,
      agentId: reflection.agentId,
      wallet: receipt.wallet,
      createdAt: nowIso(),
      reason: input.reason,
    };

    receipt.nextTurnIdHash = nextTurnIdHash;
    receipt.status = "linked";

    await this.store.saveLink(link);
    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId,
      receiptId: receipt.id,
      kind: "receipt_linked",
      message: "Receipt linked to the next turn.",
      data: { nextTurnIdHash, reason: input.reason },
    });

    return { receipt, link };
  }

  async verifyReflection(reflectionId: string): Promise<MemoryVerificationResult> {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    if (!receipt) throw new Error("receipt_not_found");

    const checks = {
      reflectionPresent: Boolean(reflection),
      storagePresent: Boolean(reflection.storageRef),
      reflectionHashMatch: receipt.reflectionHash === reflection.payloadHash,
      summaryHashMatch: receipt.summaryHash === hashText(reflection.summary),
      nextActionHashMatch: receipt.nextActionHash === hashText(reflection.nextAction),
      sourceTurnHashMatch: receipt.sourceTurnIdHash === hashText(reflection.sourceTurnId),
    };
    const issues: string[] = [];
    for (const [name, ok] of Object.entries(checks)) {
      if (!ok) issues.push(name);
    }

    const verified = issues.length === 0;
    const status: MemoryVerificationResult["status"] = verified
      ? "verified"
      : checks.reflectionPresent
      ? "partial"
      : "missing";

    receipt.verified = verified;
    receipt.verifiedAt = nowIso();
    receipt.status = verified ? "verified" : "degraded";

    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId,
      receiptId: receipt.id,
      kind: verified ? "receipt_verified" : "receipt_degraded",
      message: verified ? "Receipt verified against off-chain reflection." : "Receipt verification is partial.",
      data: { issues },
    });

    return {
      receiptId: receipt.id,
      reflectionId: reflection.id,
      status,
      verified,
      checks,
      issues,
      verifiedAt: receipt.verifiedAt,
    };
  }

  async getReflection(reflectionId: string) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    return reflection;
  }

  async getReceipt(reflectionId: string) {
    return this.store.getReceiptByReflectionId(reflectionId);
  }

  async listReflections(query: MemoryChainQuery = {}) {
    const reflections = await this.store.listReflections();
    const receipts = await this.store.listReceipts();
    const receiptByReflection = new Map<string, MemoryReceiptOnChain>();
    for (const reflection of reflections) {
      const receipt = await this.store.getReceiptByReflectionId(reflection.id);
      if (receipt) receiptByReflection.set(reflection.id, receipt);
    }

    let rows = reflections.filter(reflection => {
      const receipt = receiptByReflection.get(reflection.id);
      if (query.agentId && reflection.agentId !== query.agentId) return false;
      if (query.conversationId && reflection.conversationId !== query.conversationId) return false;
      if (query.sourceTurnId && reflection.sourceTurnId !== query.sourceTurnId) return false;
      if (query.storageRef && reflection.storageRef !== query.storageRef) return false;
      if (query.wallet && receipt?.wallet !== query.wallet) return false;
      if (query.status && receipt?.status !== query.status) return false;
      if (typeof query.verified === "boolean" && receipt?.verified !== query.verified) return false;
      if (query.txSig && receipt?.solanaTxSig !== query.txSig) return false;
      if (query.nextTurnId) {
        if (!receipt?.nextTurnIdHash) return false;
        if (receipt.nextTurnIdHash !== hashText(query.nextTurnId)) return false;
      }
      return true;
    });

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    rows = rows.slice(offset, offset + limit);

    return {
      items: rows.map(reflection => ({
        reflection,
        receipt: receiptByReflection.get(reflection.id) || null,
      })),
      totalReflections: reflections.length,
      totalReceipts: receipts.length,
    };
  }

  async getChain(reflectionId: string) {
    const reflection = await this.getReflection(reflectionId);
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    const links = receipt ? await this.store.listLinksByReceipt(receipt.id) : [];

    let parent = null as MemoryReceiptOnChain | null;
    if (reflection.parentReceiptId) {
      parent = (await this.store.getReceipt(reflection.parentReceiptId)) || null;
    }

    return {
      reflection,
      receipt: receipt || null,
      parentReceipt: parent,
      links,
    };
  }

  async getTimeline(reflectionId: string) {
    return this.store.listEventsForReflection(reflectionId);
  }

  async buildInjectionBundle(input: {
    agentId: string;
    conversationId?: string;
    nextTurnId: string;
    wallet?: string;
    maxItems?: number;
  }): Promise<MemoryInjectionBundle> {
    const { items } = await this.listReflections({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      limit: 200,
    });

    const candidates = items
      .filter(x => x.receipt && (x.receipt.verified || x.receipt.status === "anchored" || x.receipt.status === "linked"))
      .sort((a, b) => {
        const aScore = (a.reflection.structured.priority === "critical" ? 4 : a.reflection.structured.priority === "high" ? 3 : a.reflection.structured.priority === "normal" ? 2 : 1) + (a.receipt?.verified ? 1 : 0);
        const bScore = (b.reflection.structured.priority === "critical" ? 4 : b.reflection.structured.priority === "high" ? 3 : b.reflection.structured.priority === "normal" ? 2 : 1) + (b.receipt?.verified ? 1 : 0);
        if (aScore === bScore) return b.reflection.createdAt.localeCompare(a.reflection.createdAt);
        return bScore - aScore;
      });

    const seenAdvice = new Set<string>();
    const limit = input.maxItems ?? 3;
    const selected = candidates
      .filter(item => {
        const key = item.reflection.correctiveAdvice.toLowerCase().trim();
        if (seenAdvice.has(key)) return false;
        seenAdvice.add(key);
        return true;
      })
      .slice(0, limit);

    const injectionItems: MemoryInjectionItem[] = selected.map(({ reflection, receipt }) => ({
      receiptId: receipt!.id,
      reflectionId: reflection.id,
      summary: reflection.summary,
      rootCause: reflection.rootCause,
      correctiveAdvice: reflection.correctiveAdvice,
      nextAction: reflection.nextAction,
      confidence: reflection.structured.confidence,
      priority: reflection.structured.priority,
      createdAt: reflection.createdAt,
      verified: receipt!.verified,
      txSig: receipt!.solanaTxSig,
    }));

    const injectedPrompt = injectionItems.length
      ? [
          "Memory injection from prior verified lessons:",
          ...injectionItems.map(
            (item, index) =>
              `${index + 1}. [${item.priority}] ${item.summary} | Root cause: ${item.rootCause} | Corrective advice: ${item.correctiveAdvice} | Next action: ${item.nextAction}`
          ),
        ].join("\n")
      : "No prior verified lessons available for injection.";

    const bundle: MemoryInjectionBundle = {
      bundleId: `inj_${nanoid(12)}`,
      agentId: input.agentId,
      conversationId: input.conversationId,
      nextTurnId: input.nextTurnId,
      createdAt: nowIso(),
      items: injectionItems,
      injectedPrompt,
    };

    await this.store.saveInjection(bundle);
    await Promise.all(
      selected.map(async ({ reflection }) => {
        await this.linkReceiptToNextTurn(reflection.id, {
          nextTurnId: input.nextTurnId,
          reason: "Injected into next turn prompt context.",
        });
      })
    );
    for (const item of injectionItems) {
      const reflection = await this.store.getReflection(item.reflectionId);
      const receipt = await this.store.getReceipt(item.receiptId);
      if (!reflection || !receipt) continue;
      receipt.status = "injected";
      await this.store.saveReceipt(reflection.id, receipt);
    }

    await this.pushEvent({
      reflectionId: injectionItems[0]?.reflectionId || "none",
      receiptId: injectionItems[0]?.receiptId,
      kind: "injection_built",
      message: "Injection bundle assembled for next turn.",
      data: {
        bundleId: bundle.bundleId,
        nextTurnId: input.nextTurnId,
        itemCount: injectionItems.length,
      },
    });

    return bundle;
  }

  async runDemoFlow(input: { agentId: string; wallet?: string; conversationId?: string }) {
    const failure = await this.createReflection({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      sourceTurnId: `turn_fail_${nanoid(6)}`,
      kind: "failure",
      title: "Tool call failed due to missing schema context",
      summary: "Agent used a tool call with incomplete schema assumptions.",
      fullText:
        "The agent attempted a tool call without validating schema constraints. This caused a downstream parse failure and wasted one retry cycle.",
      rootCause: "Schema assumptions were inferred instead of checked.",
      correctiveAdvice: "Read and hash canonical tool descriptors before calling the tool.",
      nextAction: "Inject schema-first checklist into the next turn.",
      tags: ["failure", "schema", "tooling"],
      structured: {
        confidence: 0.93,
        priority: "high",
        reusable: true,
      },
    });
    await this.anchorReflection(failure.reflection.id, input.wallet);
    await this.verifyReflection(failure.reflection.id);

    const nextTurnId = `turn_recover_${nanoid(6)}`;
    const injection = await this.buildInjectionBundle({
      agentId: input.agentId,
      conversationId: input.conversationId,
      nextTurnId,
      wallet: input.wallet,
      maxItems: 2,
    });

    const success = await this.createReflection({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      sourceTurnId: nextTurnId,
      kind: "success",
      title: "Recovery succeeded after memory injection",
      summary: "Next turn reused corrective guidance and completed the task.",
      fullText:
        "The next turn loaded corrective advice from the prior receipt and validated schema before invocation. The tool call succeeded on the first attempt.",
      rootCause: "Prior failure corrected by explicit prompt injection.",
      correctiveAdvice: "Keep the schema-first checklist for similar tool families.",
      nextAction: "Continue using verified memory injection for high-risk tools.",
      parentReceiptId: (await this.store.getReceiptByReflectionId(failure.reflection.id))?.id,
      tags: ["success", "injection", "recovery"],
      structured: {
        confidence: 0.9,
        priority: "normal",
      },
    });
    await this.anchorReflection(success.reflection.id, input.wallet);
    await this.verifyReflection(success.reflection.id);

    return {
      failureReflectionId: failure.reflection.id,
      successReflectionId: success.reflection.id,
      injectionBundleId: injection.bundleId,
      nextTurnId,
    };
  }

  private async pushEvent(input: Omit<MemoryLifecycleEvent, "id" | "createdAt">) {
    return this.store.pushEvent({
      id: `evt_${nanoid(12)}`,
      createdAt: nowIso(),
      ...input,
    });
  }
}
