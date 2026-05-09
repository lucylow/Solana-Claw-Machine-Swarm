import DaoDashboard from "@/components/dao/DaoDashboard";
import { Button } from "@/components/ui/button";
import "@/dao/dao.css";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function DaoPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(36,208,170,0.12),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(120,80,200,0.1),transparent_40%)]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#b8ffe0]"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Home
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">
                CLAW MACHINE
              </p>
              <h1 className="text-lg font-semibold">
                Governance command center
              </h1>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <main className="container relative z-10 pb-12">
        <DaoDashboard />
      </main>
    </div>
  );
}
