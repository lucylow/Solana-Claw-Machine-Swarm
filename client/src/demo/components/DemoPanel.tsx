import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function DemoPanel({
  className,
  children,
  glow = false,
  presentationMode = false,
}: {
  className?: string;
  children: ReactNode;
  glow?: boolean;
  presentationMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#060a10]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        glow && "shadow-[0_0_0_1px_rgba(59,255,150,0.25),0_0_28px_rgba(56,215,208,0.12)]",
        presentationMode && "p-5 md:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
