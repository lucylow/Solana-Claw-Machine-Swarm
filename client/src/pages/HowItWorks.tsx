import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-200 font-bold">
            <Sparkles className="h-6 w-6 text-cyan-500" />
            CLAW MACHINE
          </div>
          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-200"
            onClick={() => setLocation("/")}
          >
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-6">
        <h1 className="text-4xl font-black text-cyan-100">How It Works</h1>
        <p className="text-slate-300 max-w-3xl">
          Wallet connect is the front door. CLAW issues a nonce-bound challenge, your wallet signs it, and the backend verifies ownership before loading identity state.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <ShieldCheck className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">1. Verify Wallet</h3>
            <p className="text-sm text-slate-300 mt-2">
              Connect and sign once to bind agent identity to your Solana address.
            </p>
          </Card>
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <Workflow className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">2. Load Context</h3>
            <p className="text-sm text-slate-300 mt-2">
              CLAW returns profile, saved skills, memory, and reputation right after verification.
            </p>
          </Card>
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <Sparkles className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">3. Show Proof</h3>
            <p className="text-sm text-slate-300 mt-2">
              Recent receipt hashes and tx signatures make on-chain auditability visible.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-200 font-bold">
            <Sparkles className="h-6 w-6 text-cyan-500" />
            CLAW MACHINE
          </div>
          <Button
            variant="outline"
            className="border-cyan-500/40 text-cyan-200"
            onClick={() => setLocation("/")}
          >
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-6">
        <h1 className="text-4xl font-black text-cyan-100">How It Works</h1>
        <p className="text-slate-300 max-w-3xl">
          Wallet connect is the front door. CLAW issues a nonce-bound challenge, your wallet signs it, and the backend verifies ownership before loading identity state.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <ShieldCheck className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">1. Verify Wallet</h3>
            <p className="text-sm text-slate-300 mt-2">
              Connect and sign once to bind agent identity to your Solana address.
            </p>
          </Card>
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <Workflow className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">2. Load Context</h3>
            <p className="text-sm text-slate-300 mt-2">
              CLAW returns profile, saved skills, memory, and reputation right after verification.
            </p>
          </Card>
          <Card className="bg-black/40 border-cyan-500/30 p-5">
            <Sparkles className="h-6 w-6 text-cyan-400 mb-2" />
            <h3 className="font-semibold text-cyan-200">3. Show Proof</h3>
            <p className="text-sm text-slate-300 mt-2">
              Recent receipt hashes and tx signatures make on-chain auditability visible.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Layers, Shield, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-[#3bff96]/30 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#6dffb3]" />
            <h1 className="text-2xl font-bold text-[#d2ffe8]">SWARM Architecture</h1>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-300"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-8">
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 p-8">
          <h2 className="text-3xl font-bold text-cyan-200 mb-4">Agentic Sophistication Spectrum</h2>
          <p className="text-gray-300">
            Autonomy is staged from automation to full autonomy with visible policy gates,
            human approvals, memory usage, and Solana proof receipts.
          </p>
          <div className="grid md:grid-cols-7 gap-2 mt-5 text-xs">
            {[
              "Automation only",
              "Assisted",
              "Guided",
              "Policy gated",
              "Meaningful agency",
              "Near autonomous",
              "Full autonomy",
            ].map(level => (
              <div key={level} className="bg-black/40 border border-white/10 rounded p-2 text-center">
                {level}
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-black/50 border-cyan-500/30 p-8">
          <h3 className="text-xl text-cyan-200 font-semibold mb-4">Decision Loop</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
            {[
              "connect wallet",
              "goal",
              "AI decides",
              "policy check",
              "execution",
              "reflection",
              "memory write",
              "proof anchor",
            ].map((step, idx, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-black/50 border border-white/10">{step}</span>
                {idx < arr.length - 1 ? <ArrowRight className="w-4 h-4 text-[#6dffb3]" /> : null}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <h4 className="text-lg font-semibold text-cyan-200 mb-3">
              <Layers className="w-5 h-5 inline mr-2" />
              Decision and Memory
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Decision records capture options, selected path, confidence, and policy status.</li>
              <li>Narrative records stay off-chain and explain why a choice was made.</li>
              <li>Memory usage records track what prior knowledge influenced outcomes.</li>
            </ul>
          </Card>
          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <h4 className="text-lg font-semibold text-cyan-200 mb-3">
              <Shield className="w-5 h-5 inline mr-2" />
              Solana Proof and Audit
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Decision, plan, execution, reflection, and memory receipts can be anchored.</li>
              <li>Policy gates mark approved, blocked, review-required, or signature-required states.</li>
              <li>The UI shows what was agent-decided, human-approved, and automatically executed.</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
