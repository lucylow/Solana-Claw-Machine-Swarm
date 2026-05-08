import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Home as HomeIcon,
  LayoutGrid,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
};

export const DAPP_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", Icon: HomeIcon, match: (p) => p === "/" },
  {
    href: "/skills",
    label: "Actions",
    Icon: LayoutGrid,
    match: (p) => p.startsWith("/skills"),
  },
  {
    href: "/receipts",
    label: "Receipts",
    Icon: ReceiptText,
    match: (p) => p.startsWith("/receipts"),
  },
  {
    href: "/proofs",
    label: "Proofs",
    Icon: ShieldCheck,
    match: (p) => p.startsWith("/proof") || p.startsWith("/onchain"),
  },
  {
    href: "/how-it-works",
    label: "Docs",
    Icon: BookOpen,
    match: (p) => p.startsWith("/how-it-works"),
  },
];

/**
 * Bottom nav rendered only on small screens.
 * Keeps wallet status visible (delegated to top bar) while still letting
 * the user reach the primary dApp surfaces.
 */
export function DappMobileNav({ className }: { className?: string }) {
  const [path] = useLocation();
  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-white/[0.06] bg-[#040508]/95 px-1 py-1 backdrop-blur-xl sm:hidden",
        className
      )}
    >
      {DAPP_NAV_ITEMS.map((item) => {
        const active = item.match ? item.match(path) : path === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-[60px] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition",
              active
                ? "bg-[#14f195]/10 text-[#d6ffe9]"
                : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
