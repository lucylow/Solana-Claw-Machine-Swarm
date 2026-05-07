import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { DemoProvider, useDemo } from "../demo/DemoProvider";
import { DemoNav } from "../demo/DemoNav";
import { parseDemoSection } from "@shared/demoNavParse";
import { DemoHub } from "../demo/views/DemoHub";
import { DemoFullStory } from "../demo/views/DemoFullStory";
import { DemoPlayground } from "../demo/views/DemoPlayground";
import {
  DemoExecutionPage,
  DemoMemoryPage,
  DemoReceiptsPage,
  DemoReflectionPage,
  DemoReputationPage,
  DemoSkillsPage,
  DemoWalletPage,
} from "../demo/views/DemoSectionPages";

function DemoLayoutBody() {
  const [loc, setLoc] = useLocation();
  const section = parseDemoSection(loc);
  const { presentationMode, setPresentationMode } = useDemo();

  const content =
    section === "hub" ? (
      <DemoHub />
    ) : section === "wallet" ? (
      <DemoWalletPage />
    ) : section === "skills" ? (
      <DemoSkillsPage />
    ) : section === "execution" ? (
      <DemoExecutionPage />
    ) : section === "reflection" ? (
      <DemoReflectionPage />
    ) : section === "memory" ? (
      <DemoMemoryPage />
    ) : section === "receipts" ? (
      <DemoReceiptsPage />
    ) : section === "reputation" ? (
      <DemoReputationPage />
    ) : section === "full-story" ? (
      <DemoFullStory />
    ) : section === "playground" ? (
      <DemoPlayground />
    ) : (
      <DemoHub />
    );

  return (
    <div className="min-h-screen bg-[#030507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(36,208,170,0.14),transparent_38%),radial-gradient(circle_at_92%_18%,rgba(20,120,160,0.12),transparent_36%)]" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/75 backdrop-blur">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => setLoc("/")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Home
            </Button>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <Sparkles className="h-5 w-5 text-[#3bff96]" />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#87f7d0]">Demo system</p>
                <p className="font-semibold tracking-tight">CLAW_MACHINE · Solana narrative</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Presentation</span>
            <Switch checked={presentationMode} onCheckedChange={setPresentationMode} />
          </div>
        </div>
        <div className="container pb-4">
          <DemoNav presentationMode={presentationMode} />
        </div>
      </header>
      <main className={cn("container relative z-10 py-8", presentationMode && "max-w-6xl")}>{content}</main>
    </div>
  );
}

export default function DemoCenterPage() {
  return (
    <DemoProvider>
      <DemoLayoutBody />
    </DemoProvider>
  );
}
