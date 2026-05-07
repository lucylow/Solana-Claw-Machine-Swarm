import { ExplorerLinkButton, ProofVerificationBadge } from "@/components/command-center/CommandCenterComponents";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { shortenAddress } from "@/lib/solana/format";
import { cn } from "@/lib/utils";
import { DEMO_GUIDED_STEPS, DEMO_WALLET } from "@shared/demoFixtures";
import type { DemoGuidedStep } from "@shared/demoTypes";
import { Activity, Brain, Cpu, Link2, MemoryStick, Radar, ReceiptText, Sparkles, Wallet } from "lucide-react";
import { useDemo } from "../DemoProvider";
import { DemoPanel } from "./DemoPanel";

function highlightClass(active: boolean) {
  return active
    ? "border-[#3bff96]/45 shadow-[0_0_20px_rgba(59,255,150,0.12)]"
    : "border-white/10";
}

export function DemoPreviewPanel({
  guidedStep,
  presentationMode,
}: {
  guidedStep?: DemoGuidedStep | null;
  presentationMode?: boolean;
}) {
  const {
    walletConnectedDemo,
    activeSkill,
    plan,
    agents,
    steps,
    reflection,
    memory,
    receipts,
    runOutcome,
    guidedStepIndex,
  } = useDemo();

  const hl = guidedStep?.highlight;
  const guidedActive = (region: DemoGuidedStep["highlight"]) => (guidedStep ? hl === region : false);

  const activeStep = steps.find(s => s.status === "active" || s.status === "failed") ?? steps[steps.length - 1];
  const coordinator = agents.find(a => a.role === "coordinator");
  const primaryReceipt = receipts[receipts.length - 1];

  const stepForGuided = DEMO_GUIDED_STEPS[guidedStepIndex];

  return (
    <DemoPanel
      glow={Boolean(guidedStep)}
      presentationMode={presentationMode}
      className={cn("space-y-4", presentationMode && "text-base")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ceada]">Live preview</p>
          <h2 className={cn("font-semibold text-white", presentationMode ? "text-2xl" : "text-xl")}>Solana command surface</h2>
        </div>
        <ProofVerificationBadge
          verification={{
            status: runOutcome === "failure" ? "pending" : "verified",
            label: runOutcome === "failure" ? "Awaiting Solana confirmation" : "Verified on Solana (demo)",
          }}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("wallet")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Wallet className="h-3.5 w-3.5 text-[#3bff96]" />
            Solana wallet
          </div>
          <p className="font-mono text-sm text-white">
            {walletConnectedDemo ? shortenAddress(DEMO_WALLET.address, 6, 6) : "Disconnected (demo)"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Solana devnet · session scope for receipts</p>
        </div>

        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("skills")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Radar className="h-3.5 w-3.5 text-cyan-300" />
            Selected skill
          </div>
          <p className="text-sm font-medium text-white">{activeSkill.name}</p>
          <p className="mt-1 text-xs text-slate-500">v{activeSkill.version} · rep {activeSkill.reputationScore}</p>
        </div>

        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("plan")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-teal-300" />
            Active plan
          </div>
          <p className="text-xs font-mono text-slate-300">{plan.id}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{plan.goal}</p>
        </div>

        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("execution")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-3.5 w-3.5 text-[#3bff96]" />
            Execution step
          </div>
          <p className="text-sm text-white">{activeStep?.title}</p>
          <p className="mt-1 text-xs text-slate-500">{activeStep?.detail}</p>
        </div>

        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("coordination")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-[#38d7d0]" />
            Coordinator
          </div>
          <p className="text-xs text-slate-300">{coordinator?.outputSummary}</p>
        </div>

        <div className={cn("rounded-xl border p-3 transition-colors", highlightClass(guidedActive("reputation")))}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <Link2 className="h-3.5 w-3.5 text-cyan-300" />
            Reputation signal
          </div>
          <p className="text-xs text-slate-300">
            Success {activeSkill.successRate}% · usage {activeSkill.usageCount.toLocaleString()} · last{" "}
            {new Date(activeSkill.lastUsedIso).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={cn("rounded-xl border p-3", highlightClass(guidedActive("reflection")))}>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <Brain className="h-3.5 w-3.5" />
            Reflection
          </div>
          <p className="text-xs text-slate-300">{reflection ? reflection.id : "None on pure-success path"}</p>
        </div>
        <div className={cn("rounded-xl border p-3", highlightClass(guidedActive("memory")))}>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <MemoryStick className="h-3.5 w-3.5" />
            Memory
          </div>
          <p className="text-xs text-slate-300">{memory ? memory.id : "Episodic only"}</p>
        </div>
        <div className={cn("rounded-xl border p-3", highlightClass(guidedActive("receipt")))}>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <ReceiptText className="h-3.5 w-3.5" />
            Receipt
          </div>
          <p className="text-xs font-mono text-slate-300">{primaryReceipt?.id}</p>
          <div className="mt-2">
            <ExplorerLinkButton
              payload={{
                label: "Solana Explorer",
                url: txExplorerUrl(primaryReceipt?.txSignature),
                signature: primaryReceipt?.txSignature,
              }}
            />
          </div>
        </div>
      </div>

      {stepForGuided ? (
        <p className="border-t border-white/10 pt-3 text-xs text-slate-500">
          Guided focus: <span className="text-slate-300">{stepForGuided.title}</span>
        </p>
      ) : null}
    </DemoPanel>
  );
}
