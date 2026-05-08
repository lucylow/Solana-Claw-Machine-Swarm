import { StoryLoopStrip } from "@/components/command-center";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SOLANA_COPY, STORY_LOOP_LABELS } from "@shared/copy";
import { ArrowRight, Layers, Shield, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      <header className="border-b border-[#3bff96]/30 bg-black/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#6dffb3]" />
            <h1 className="text-2xl font-bold text-[#d2ffe8]">How It Works on Solana</h1>
          </div>
          <Button
            onClick={() => setLocation("/dashboard?section=overview")}
            variant="outline"
            className="border-cyan-500 text-cyan-300"
          >
            {SOLANA_COPY.navigation.backCommandCenter}
          </Button>
        </div>
      </header>

      <main className="container space-y-8 py-10">
        <StoryLoopStrip activeStep={5} />

        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 p-8">
          <h2 className="text-3xl font-bold text-cyan-200 mb-4">Solana Command Loop</h2>
          <p className="text-gray-300">
            Connect your Solana wallet, choose a published skill, execute with a visible timeline, create a reflection,
            write memory offchain, and anchor a compact receipt on Solana for Solana Explorer verification.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-5 text-sm text-gray-300">
            {STORY_LOOP_LABELS.map((step, idx, arr) => (
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
              Reflection and Memory
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Every failed step can produce a structured reflection.</li>
              <li>Corrective advice is written as memory for the next turn.</li>
              <li>The next run can inject the lesson and improve outcomes.</li>
            </ul>
          </Card>
          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <h4 className="text-lg font-semibold text-cyan-200 mb-3">
              <Shield className="w-5 h-5 inline mr-2" />
              On-Solana verification
            </h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Receipts carry hashes, authoring wallet, and Solana tx signatures.</li>
              <li>Solana Explorer links are one click away.</li>
              <li>The proof trail links plans, reflections, memory, and receipts.</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
