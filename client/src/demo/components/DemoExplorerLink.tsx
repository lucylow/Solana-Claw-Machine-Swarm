import { ExplorerLinkButton } from "@/components/command-center/CommandCenterComponents";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function DemoExplorerLink({
  signature,
  label = "Solana Explorer",
}: {
  signature: string;
  label?: string;
}) {
  const url = txExplorerUrl(signature);
  return (
    <div className="flex flex-wrap gap-2">
      <ExplorerLinkButton payload={{ label, url }} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-slate-600 text-slate-200"
        onClick={() => navigator.clipboard.writeText(signature)}
      >
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        Copy signature
      </Button>
    </div>
  );
}
