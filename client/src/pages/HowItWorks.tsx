import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, ArrowRight, Layers, Shield, Link2 } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">SWARM</h1>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-cyan-500 text-cyan-400"
          >
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          How SWARM Works
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          A deep dive into the architecture, Solana integration, and OpenClaw interoperability
        </p>

        {/* Architecture Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">
            <Layers className="w-8 h-8 inline mr-2" />
            SWARM Architecture
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="bg-black/50 border-cyan-500/30 p-8">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">
                Agent Orchestration Layer
              </h3>
              <p className="text-gray-400 mb-4">
                SWARM coordinates multiple AI agents with different roles and capabilities. Each agent operates independently but receives tasks from a central orchestrator.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Real-time task distribution</li>
                <li>✓ Role-based agent assignment</li>
                <li>✓ Multi-agent collaboration</li>
                <li>✓ Automatic failover and retry logic</li>
              </ul>
            </Card>

            <Card className="bg-black/50 border-cyan-500/30 p-8">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">
                On-Chain Receipt System
              </h3>
              <p className="text-gray-400 mb-4">
                Every agent action is recorded as a receipt on Solana devnet, creating an immutable audit trail and enabling on-chain verification.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Plan receipts (task intent)</li>
                <li>✓ Execution receipts (action taken)</li>
                <li>✓ Reflection receipts (outcome analysis)</li>
                <li>✓ Memory receipts (learned patterns)</li>
              </ul>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-8">
            <h3 className="text-xl font-bold text-cyan-300 mb-4">Receipt Flow</h3>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="text-center">
                <div className="bg-cyan-500/20 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2 text-cyan-400 font-bold">
                  1
                </div>
                <p>Plan</p>
              </div>
              <ArrowRight className="w-6 h-6 text-cyan-500" />
              <div className="text-center">
                <div className="bg-cyan-500/20 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2 text-cyan-400 font-bold">
                  2
                </div>
                <p>Execute</p>
              </div>
              <ArrowRight className="w-6 h-6 text-cyan-500" />
              <div className="text-center">
                <div className="bg-cyan-500/20 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2 text-cyan-400 font-bold">
                  3
                </div>
                <p>Reflect</p>
              </div>
              <ArrowRight className="w-6 h-6 text-cyan-500" />
              <div className="text-center">
                <div className="bg-cyan-500/20 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-2 text-cyan-400 font-bold">
                  4
                </div>
                <p>Memory</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Each receipt is anchored on Solana devnet, creating a verifiable chain of agent decisions and outcomes.
            </p>
          </Card>
        </section>

        {/* Solana Integration */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">
            <Shield className="w-8 h-8 inline mr-2" />
            Solana Integration
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-black/50 border-cyan-500/30 p-8">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">
                Anchor Program
              </h3>
              <p className="text-gray-400 mb-4">
                SWARM uses Anchor framework to manage on-chain state. The program stores receipt data and enforces validation rules.
              </p>
              <code className="block bg-black/50 border border-cyan-500/20 rounded p-4 text-xs text-cyan-400 overflow-x-auto">
                {`pub struct Receipt {
  pub agent: Pubkey,
  pub receipt_type: u8,
  pub content_hash: [u8; 32],
  pub timestamp: i64,
}`}
              </code>
            </Card>

            <Card className="bg-black/50 border-cyan-500/30 p-8">
              <h3 className="text-xl font-bold text-cyan-300 mb-4">
                Session Management
              </h3>
              <p className="text-gray-400 mb-4">
                Nonce-based signing ensures secure wallet sessions. Each session is verified server-side before accepting agent actions.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Phantom & Solflare wallet support</li>
                <li>✓ Nonce-based challenge-response</li>
                <li>✓ Server-side signature verification</li>
                <li>✓ Session expiration & renewal</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* OpenClaw Bridge */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">
            <Link2 className="w-8 h-8 inline mr-2" />
            OpenClaw Interoperability Bridge
          </h2>

          <Card className="bg-black/50 border-cyan-500/30 p-8 mb-8">
            <h3 className="text-xl font-bold text-cyan-300 mb-4">
              Bidirectional Bridge
            </h3>
            <p className="text-gray-400 mb-6">
              SWARM bridges with the OpenClaw ecosystem, enabling seamless tool integration and skill sharing.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-cyan-300 mb-3">Import OpenClaw Tools</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Import external tools from the OpenClaw ecosystem as CLAW skills. These skills can be:
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Registered in the SWARM skill registry</li>
                  <li>• Assigned to agents for task execution</li>
                  <li>• Tracked with on-chain metadata</li>
                  <li>• Monitored for compatibility</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-cyan-300 mb-3">Export CLAW Skills</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Export SWARM skills as OpenClaw-compatible manifests. This enables:
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Cross-platform skill sharing</li>
                  <li>• Standardized skill definitions</li>
                  <li>• Community-driven skill marketplace</li>
                  <li>• Interoperability with other systems</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">
              Bridge Status & Monitoring
            </h3>
            <p className="text-gray-400 mb-4">
              Real-time monitoring of the OpenClaw bridge connection, skill compatibility, and manifest validation.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-black/30 rounded p-3">
                <p className="text-gray-500">Bridge Status</p>
                <p className="text-green-400 font-bold">Connected</p>
              </div>
              <div className="bg-black/30 rounded p-3">
                <p className="text-gray-500">Skills Synced</p>
                <p className="text-cyan-400 font-bold">42 / 42</p>
              </div>
              <div className="bg-black/30 rounded p-3">
                <p className="text-gray-500">Compatibility</p>
                <p className="text-cyan-400 font-bold">98%</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Key Concepts */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">Key Concepts</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Multi-Agent Swarm",
                desc: "A coordinated network of AI agents working together to accomplish complex tasks through real-time communication and task distribution.",
              },
              {
                title: "CLAW Skills",
                desc: "Reusable, composable tools imported from OpenClaw or created within SWARM. Skills are assigned to agents and tracked on-chain.",
              },
              {
                title: "On-Chain Receipts",
                desc: "Immutable records of agent actions anchored on Solana. Receipts create verifiable audit trails and enable on-chain verification.",
              },
              {
                title: "Nonce-Based Sessions",
                desc: "Secure wallet sessions using challenge-response signing. Each session is verified server-side to prevent unauthorized access.",
              },
              {
                title: "OpenClaw Bridge",
                desc: "Bidirectional interoperability layer enabling skill sharing, tool integration, and ecosystem collaboration.",
              },
              {
                title: "Agent Reputation",
                desc: "On-chain tracking of agent performance, success rates, and reliability. Reputation enables trust in multi-agent networks.",
              },
            ].map((concept, i) => (
              <Card
                key={i}
                className="bg-black/50 border-cyan-500/30 p-6"
              >
                <h3 className="font-bold text-cyan-300 mb-2">{concept.title}</h3>
                <p className="text-sm text-gray-400">{concept.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-bold text-cyan-300 mb-4">
            Ready to build with SWARM?
          </h2>
          <p className="text-gray-400 mb-8">
            Deploy coordinated multi-agent systems on Solana today
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
            size="lg"
          >
            Launch Dashboard
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-500/30 bg-black/50 backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>SWARM © 2026 | Multi-Agent Orchestration on Solana</p>
        </div>
      </footer>
    </div>
  );
}
