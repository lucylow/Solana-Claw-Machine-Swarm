import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, Copy } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AUTONOMY_LEVEL_LABELS, autonomyLevelClass } from "@/lib/autonomy";
import type { AutonomyLevel } from "@shared/autonomy";

interface Receipt {
  id: number;
  receiptType: string | null;
  content: string | null;
  transactionHash: string | null;
  onchainAddress: string | null;
  autonomyLevel?: AutonomyLevel | null;
  policyStatus?: string | null;
  proofType?: string | null;
  proofHash?: string | null;
  referenceId?: string | null;
  createdAt: Date;
}

interface ReceiptViewerProps {
  receipts: Receipt[];
  isLoading?: boolean;
}

export function ReceiptViewer({ receipts, isLoading }: ReceiptViewerProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getReceiptColor = (type: string | null) => {
    if (!type) return "border-cyan-500/30";
    switch (type.toLowerCase()) {
      case "plan":
        return "border-blue-500/30";
      case "execution":
        return "border-cyan-500/30";
      case "reflection":
        return "border-purple-500/30";
      case "memory":
        return "border-green-500/30";
      case "decision":
        return "border-emerald-500/30";
      default:
        return "border-cyan-500/30";
    }
  };

  const getReceiptBadgeColor = (type: string | null) => {
    if (!type) return "bg-cyan-500/20 text-cyan-400";
    switch (type.toLowerCase()) {
      case "plan":
        return "bg-blue-500/20 text-blue-400";
      case "execution":
        return "bg-cyan-500/20 text-cyan-400";
      case "reflection":
        return "bg-purple-500/20 text-purple-400";
      case "memory":
        return "bg-green-500/20 text-green-400";
      case "decision":
        return "bg-emerald-500/20 text-emerald-400";
      default:
        return "bg-cyan-500/20 text-cyan-400";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/50 border-cyan-500/30 p-6">
        <div className="text-center text-gray-400">Loading receipts...</div>
      </Card>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <Card className="bg-black/50 border-cyan-500/30 p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Shield className="w-5 h-5" />
          <span>No on-chain receipts yet</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {receipts.map((receipt) => (
        <Card
          key={receipt.id}
          className={`bg-black/50 border-2 ${getReceiptColor(receipt.receiptType)} p-4 cursor-pointer hover:border-opacity-100 transition`}
          onClick={() =>
            setExpandedId(expandedId === receipt.id ? null : receipt.id)
          }
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-bold ${getReceiptBadgeColor(receipt.receiptType)}`}
                >
                  {receipt.receiptType?.toUpperCase() || "UNKNOWN"}
                </span>
                <span className="text-xs text-gray-500">
                  {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : "Unknown date"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {receipt.autonomyLevel ? (
                  <Badge className={`border ${autonomyLevelClass(receipt.autonomyLevel)}`}>
                    {AUTONOMY_LEVEL_LABELS[receipt.autonomyLevel]}
                  </Badge>
                ) : null}
                {receipt.policyStatus ? <Badge variant="outline">{receipt.policyStatus}</Badge> : null}
                {receipt.proofType ? <Badge variant="secondary">proof:{receipt.proofType}</Badge> : null}
              </div>
              {expandedId === receipt.id && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-400 break-words">
                    {receipt.content || "No content"}
                  </p>
                  {receipt.transactionHash && (
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">
                        Transaction Hash:
                      </p>
                      <p className="text-xs text-cyan-400 font-mono break-all">
                        {receipt.transactionHash}
                      </p>
                    </div>
                  )}
                  {receipt.onchainAddress && (
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">
                        On-Chain Address:
                      </p>
                      <p className="text-xs text-cyan-400 font-mono break-all">
                        {receipt.onchainAddress}
                      </p>
                    </div>
                  )}
                  {receipt.proofHash ? (
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Proof Hash:</p>
                      <p className="text-xs text-emerald-300 font-mono break-all">
                        {receipt.proofHash}
                      </p>
                    </div>
                  ) : null}
                  {receipt.referenceId ? (
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Reference ID:</p>
                      <p className="text-xs text-cyan-300 font-mono break-all">
                        {receipt.referenceId}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              {receipt.transactionHash && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:bg-cyan-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://explorer.solana.com/tx/${receipt.transactionHash}?cluster=devnet`,
                      "_blank"
                    );
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
