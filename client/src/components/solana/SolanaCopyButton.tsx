import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  text: string;
  label?: string;
  className?: string;
};

export function SolanaCopyButton({ text, label = "Copy", className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("border-white/15 bg-black/30 text-slate-100 hover:bg-white/5", className)}
      onClick={() => void copy()}
    >
      {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
