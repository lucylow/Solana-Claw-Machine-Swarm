import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PlanReceipt } from "@shared/planReceipts";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";

interface PlanReceiptCardProps {
  plan: PlanReceipt;
  onOpenDetails?: (planId: string) => void;
}

function copyText(value: string) {
  void navigator.clipboard.writeText(value);
}

export function PlanReceiptCard({ plan, onOpenDetails }: PlanReceiptCardProps) {
  const verified = Boolean(plan.solana?.verified);
  return (
    <Card className="bg-[#08120e] border-[#3bff96]/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400">Plan receipt</p>
          <h4 className="text-base font-semibold text-[#c9ffdf]">
            {plan.title}
          </h4>
          <p className="text-xs text-gray-400 mt-1">{plan.planId}</p>
        </div>
        <Badge
          className={
            verified
              ? "bg-[#3bff96]/15 text-[#73ffb6] border-[#3bff96]/40"
              : "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
          }
        >
          {verified ? (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              verified
            </span>
          ) : (
            plan.status
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-black/30 rounded p-2">
          <p className="text-gray-500">Task type</p>
          <p className="text-gray-200">{plan.taskType}</p>
        </div>
        <div className="bg-black/30 rounded p-2">
          <p className="text-gray-500">Step count</p>
          <p className="text-gray-200">{plan.stepCount}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Summary hash</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-cyan-300"
            onClick={() => copyText(plan.summaryHash)}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
        <p className="font-mono text-[#73ffb6] break-all">{plan.summaryHash}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {plan.chosenSkills.map((skill) => (
          <Badge key={skill.id} variant="secondary" className="text-[10px]">
            {skill.name}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(plan.createdAt).toLocaleString()}</span>
        <div className="flex items-center gap-2">
          {plan.solana?.txSignature ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-cyan-300"
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${plan.solana?.txSignature}?cluster=devnet`,
                  "_blank",
                )
              }
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Explorer
            </Button>
          ) : null}
          {onOpenDetails ? (
            <Button
              variant="outline"
              size="sm"
              className="h-6 border-[#3bff96]/40 text-[#73ffb6]"
              onClick={() => onOpenDetails(plan.planId)}
            >
              View timeline
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
