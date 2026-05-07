import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReceiptViewer } from "@/components/ReceiptViewer";
import { AUTONOMY_LEVEL_LABELS, autonomyLevelClass } from "@/lib/autonomy";
import { trpc } from "@/lib/trpc";
import { Zap, Shield, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { AutonomyLevel } from "@shared/autonomy";

export default function ReceiptsPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateReceipt, setShowCreateReceipt] = useState(false);
  const [receiptType, setReceiptType] = useState<
    "plan" | "execution" | "reflection" | "memory" | "decision"
  >("plan");
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("meaningful_agency");
  const [policyStatus, setPolicyStatus] = useState<
    "approved" | "blocked" | "overridden" | "needs_review" | "not_required"
  >("approved");
  const [receiptContent, setReceiptContent] = useState("");
  const utils = trpc.useUtils();

  const { data: receipts, isLoading: receiptsLoading } = trpc.receipts.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: profileData } = trpc.autonomy.profile.useQuery(undefined, {
    enabled: !!user,
  });
  const createReceiptMutation = trpc.receipts.create.useMutation();

  const handleCreateReceipt = async () => {
    if (!receiptContent) return;
    try {
      await createReceiptMutation.mutateAsync({
        receiptType: receiptType as "plan" | "execution" | "reflection" | "memory" | "decision",
        content: receiptContent,
        agentId: undefined,
        autonomyLevel,
        policyStatus,
        proofType:
          receiptType === "plan" ||
          receiptType === "execution" ||
          receiptType === "reflection" ||
          receiptType === "memory" ||
          receiptType === "decision"
            ? receiptType
            : "execution",
      });
      await utils.receipts.list.invalidate();
      setReceiptContent("");
      setShowCreateReceipt(false);
    } catch (err) {
      console.error("Failed to create receipt:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Zap className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">On-Chain Receipts</h1>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-400"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Section */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-8 mb-8">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4">
            Decision + Execution Receipt Ledger
          </h2>
          <p className="text-gray-400 mb-4">
            Receipts now include decision proofs, policy states, and autonomy-level metadata so
            you can inspect what was automated vs agent-decided.
          </p>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Total Receipts</p>
              <p className="text-cyan-400 font-bold text-lg">{receipts?.length || 0}</p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Network</p>
              <p className="text-cyan-400 font-bold">Solana Devnet</p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Status</p>
              <p className="text-green-400 font-bold">Online</p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Anchor Program</p>
              <p className="text-cyan-400 font-bold">Active</p>
            </div>
          </div>
          {profileData?.profile?.level ? (
            <div className="mt-4">
              <Badge
                className={`border ${autonomyLevelClass(profileData.profile.level as AutonomyLevel)}`}
              >
                Current mode:{" "}
                {AUTONOMY_LEVEL_LABELS[profileData.profile.level as AutonomyLevel]}
              </Badge>
            </div>
          ) : null}
        </Card>

        {/* Receipt Types Legend */}
        <Card className="bg-black/50 border-cyan-500/30 p-6 mb-8">
          <h3 className="text-lg font-bold text-cyan-300 mb-4">Receipt Types</h3>
          <div className="grid md:grid-cols-5 gap-4 text-sm">
            <div className="border-l-4 border-blue-500 pl-3">
              <p className="font-bold text-blue-400">Plan</p>
              <p className="text-gray-400 text-xs">Task intent and goals</p>
            </div>
            <div className="border-l-4 border-cyan-500 pl-3">
              <p className="font-bold text-cyan-400">Execution</p>
              <p className="text-gray-400 text-xs">Actions taken by agent</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <p className="font-bold text-purple-400">Reflection</p>
              <p className="text-gray-400 text-xs">Outcome analysis</p>
            </div>
            <div className="border-l-4 border-green-500 pl-3">
              <p className="font-bold text-green-400">Memory</p>
              <p className="text-gray-400 text-xs">Learned patterns</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-3">
              <p className="font-bold text-emerald-400">Decision</p>
              <p className="text-gray-400 text-xs">Agent choice and rationale proof</p>
            </div>
          </div>
        </Card>

        {/* Receipts Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Your Receipts</h2>
          <Button
            onClick={() => setShowCreateReceipt(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Receipt
          </Button>
        </div>

        {receiptsLoading ? (
          <Card className="bg-black/50 border-cyan-500/30 p-8 text-center">
            <p className="text-gray-400">Loading receipts...</p>
          </Card>
        ) : (
          <ReceiptViewer receipts={receipts || []} isLoading={receiptsLoading} />
        )}

        {/* Create Receipt Form */}
        {showCreateReceipt && (
          <Card className="bg-black/50 border-cyan-500/30 p-6 mt-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">
              Create New Receipt
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Receipt Type
                </label>
                <select
                  value={receiptType}
                  onChange={(e) =>
                    setReceiptType(
                      e.target.value as "plan" | "execution" | "reflection" | "memory" | "decision"
                    )
                  }
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="plan">Plan</option>
                  <option value="execution">Execution</option>
                  <option value="reflection">Reflection</option>
                  <option value="memory">Memory</option>
                  <option value="decision">Decision</option>
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Autonomy Level
                  </label>
                  <select
                    value={autonomyLevel}
                    onChange={(e) => setAutonomyLevel(e.target.value as AutonomyLevel)}
                    className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {(Object.keys(AUTONOMY_LEVEL_LABELS) as AutonomyLevel[]).map((level) => (
                      <option key={level} value={level}>
                        {AUTONOMY_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Policy Status
                  </label>
                  <select
                    value={policyStatus}
                    onChange={(e) =>
                      setPolicyStatus(
                        e.target.value as
                          | "approved"
                          | "blocked"
                          | "overridden"
                          | "needs_review"
                          | "not_required"
                      )
                    }
                    className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="approved">approved</option>
                    <option value="needs_review">needs_review</option>
                    <option value="blocked">blocked</option>
                    <option value="overridden">overridden</option>
                    <option value="not_required">not_required</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Content
                </label>
                <textarea
                  value={receiptContent}
                  onChange={(e) => setReceiptContent(e.target.value)}
                  placeholder="Enter receipt content..."
                  rows={4}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateReceipt}
                  disabled={createReceiptMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                >
                  {createReceiptMutation.isPending ? "Anchoring..." : "Anchor Receipt"}
                </Button>
                <Button
                  onClick={() => setShowCreateReceipt(false)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
