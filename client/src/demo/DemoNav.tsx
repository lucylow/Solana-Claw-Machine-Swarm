import { cn } from "@/lib/utils";
import type { DemoSection } from "@shared/demoTypes";
import { parseDemoSection } from "@shared/demoNavParse";
import {
  Award,
  Brain,
  Cpu,
  Home,
  LayoutGrid,
  MemoryStick,
  PlayCircle,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const LINKS: Array<{ path: DemoSection; label: string; icon: typeof Home }> = [
  { path: "hub", label: "Hub", icon: Home },
  { path: "wallet", label: "Solana wallet", icon: Wallet },
  { path: "skills", label: "Skill registry", icon: Cpu },
  { path: "execution", label: "Execution", icon: PlayCircle },
  { path: "reflection", label: "Reflection", icon: Brain },
  { path: "memory", label: "Memory", icon: MemoryStick },
  { path: "receipts", label: "Solana receipts", icon: ReceiptText },
  { path: "reputation", label: "Reputation", icon: Award },
  { path: "full-story", label: "Full story", icon: PlayCircle },
  { path: "playground", label: "Playground", icon: LayoutGrid },
];

export { parseDemoSection } from "@shared/demoNavParse";

export function DemoNav({ presentationMode }: { presentationMode?: boolean }) {
  const [loc] = useLocation();
  const active = parseDemoSection(loc);

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-[#05080d]/95 p-2",
        presentationMode && "gap-2 p-3"
      )}
    >
      {LINKS.map(({ path, label, icon: Icon }) => {
        const href = path === "hub" ? "/demo/hub" : `/demo/${path}`;
        const isActive = active === path;
        return (
          <Link key={path} href={href}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                isActive
                  ? "bg-[#3bff96]/15 text-[#c8ffe2] shadow-[0_0_12px_rgba(59,255,150,0.12)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                presentationMode && "px-3 py-2 text-sm"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
