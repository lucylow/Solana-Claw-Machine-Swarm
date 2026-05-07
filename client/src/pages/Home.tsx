import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Cpu, Shield, Rocket } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Cpu className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Initializing SWARM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">SWARM</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#features" className="hover:text-cyan-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a>
            <a href="#docs" className="hover:text-cyan-400 transition">Docs</a>
          </nav>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h2 className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            SWARM
          </h2>
          <p className="text-xl md:text-2xl text-cyan-300 mb-2">
            Multi-Agent Orchestration on Solana
          </p>
          <p className="text-gray-400">
            Deploy, coordinate, and monetize agent networks with on-chain receipts and OpenClaw interoperability
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          {isAuthenticated ? (
            <>
              <Button
                onClick={() => setLocation("/dashboard")}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Dashboard
              </Button>
              <Button
                onClick={() => setLocation("/how-it-works")}
                size="lg"
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              >
                Learn Architecture
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                <Zap className="w-5 h-5 mr-2" />
                Connect Phantom Wallet
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              >
                View Docs
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-center mb-12 text-cyan-400">
          Core Features
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Cpu className="w-8 h-8" />,
              title: "Multi-Agent Orchestration",
              desc: "Coordinate multiple AI agents with real-time task distribution",
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "On-Chain Receipts",
              desc: "Anchor plans, executions, reflections, and memory on Solana",
            },
            {
              icon: <Zap className="w-8 h-8" />,
              title: "OpenClaw Bridge",
              desc: "Import tools as CLAW skills and export compatible manifests",
            },
            {
              icon: <Rocket className="w-8 h-8" />,
              title: "Solana Native",
              desc: "Built for Solana devnet with instant finality and low fees",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/60 transition p-6"
            >
              <div className="text-cyan-400 mb-4">{feature.icon}</div>
              <h4 className="text-lg font-bold mb-2 text-cyan-300">{feature.title}</h4>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-12">
          <h3 className="text-3xl font-bold mb-4 text-cyan-300">
            Ready to build with SWARM?
          </h3>
          <p className="text-gray-400 mb-8">
            Join the agent economy. Deploy coordinated multi-agent systems on Solana today.
          </p>
          {!isAuthenticated && (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              size="lg"
              className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
            >
              Get Started
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/30 bg-black/50 backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>SWARM © 2026 | Multi-Agent Orchestration on Solana</p>
          <p className="mt-2">
            Built for Colosseum Frontier & Canteen SWARM Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
