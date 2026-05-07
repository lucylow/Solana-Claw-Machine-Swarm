import { Card } from "@/components/ui/card";
import { Zap, CheckCircle, AlertCircle, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

interface ActivityItem {
  id: number;
  eventType: string;
  description: string;
  createdAt: Date;
  agentId?: number;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "agent_created":
      case "agent_activated":
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case "task_completed":
      case "receipt_anchored":
      case "decision_recorded":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "policy_blocked":
      case "policy_review_required":
        return <AlertCircle className="w-4 h-4 text-yellow-300" />;
      case "error":
      case "task_failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "task_completed":
      case "receipt_anchored":
      case "decision_recorded":
        return "border-green-500/30";
      case "policy_blocked":
      case "policy_review_required":
        return "border-yellow-500/30";
      case "error":
      case "task_failed":
        return "border-red-500/30";
      default:
        return "border-cyan-500/30";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/50 border-cyan-500/30 p-6">
        <div className="text-center text-gray-400">Loading activity...</div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-black/50 border-cyan-500/30 p-6">
        <div className="text-center text-gray-400">No activity yet</div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-cyan-500/30 p-6">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`border-l-2 ${getEventColor(activity.eventType)} pl-4 py-2 text-xs`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getEventIcon(activity.eventType)}
              <span className="text-cyan-400 font-mono font-bold">
                {activity.eventType}
              </span>
            </div>
            <p className="text-gray-400">{activity.description}</p>
            <p className="text-gray-600 text-xs mt-1">
              {new Date(activity.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
