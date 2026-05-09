import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PlanTimelineEvent } from "@shared/planReceipts";

interface PlanTimelineProps {
  events: PlanTimelineEvent[];
}

export function PlanTimeline({ events }: PlanTimelineProps) {
  if (!events.length) {
    return (
      <Card className="bg-black/40 border-cyan-500/20 p-4 text-sm text-gray-400">
        No timeline events yet.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="bg-black/40 border-cyan-500/20 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-cyan-200 font-medium">{event.title}</p>
              <p className="text-xs text-gray-400">{event.summary}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {event.stage}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-400">
            <span>{new Date(event.timestamp).toLocaleString()}</span>
            <span>status: {event.status}</span>
            {event.refs?.txSignature ? (
              <span>tx: {event.refs.txSignature.slice(0, 12)}...</span>
            ) : null}
            {event.refs?.reflectionId ? (
              <span>reflection: {event.refs.reflectionId}</span>
            ) : null}
            {event.refs?.memoryId ? (
              <span>memory: {event.refs.memoryId}</span>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
