import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Zap, Plus, Activity, Cpu, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState("");

  const { data: agents, isLoading: agentsLoading } = trpc.agents.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: activity } = trpc.activity.list.useQuery(undefined, {
    enabled: !!user,
  });
  const createAgentMutation = trpc.agents.create.useMutation();

  const handleCreateAgent = async () => {
    if (!agentName || !agentRole) return;
    try {
      await createAgentMutation.mutateAsync({
        name: agentName,
        role: agentRole,
        description: `Agent with role: ${agentRole}`,
      });
      setAgentName("");
      setAgentRole("");
      setShowCreateAgent(false);
    } catch (err) {
      console.error("Failed to create agent:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Cpu className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Loading dashboard...</p>
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
            <Zap className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">SWARM Dashboard</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="/dashboard" className="text-cyan-400">Dashboard</a>
            <a href="/receipts" className="hover:text-cyan-400 transition">Receipts</a>
            <a href="/skills" className="hover:text-cyan-400 transition">Skills</a>
            <a href="/how-it-works" className="hover:text-cyan-400 transition">Docs</a>
          </nav>
          <div className="text-sm text-gray-400">
            {user?.email || user?.name || "Connected"}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {agents?.length || 0}
                </p>
              </div>
              <Cpu className="w-12 h-12 text-cyan-500/30" />
            </div>
          </Card>

          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Recent Activity</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {activity?.length || 0}
                </p>
              </div>
              <Activity className="w-12 h-12 text-cyan-500/30" />
            </div>
          </Card>

          <Card className="bg-black/50 border-cyan-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Network Status</p>
                <p className="text-3xl font-bold text-green-400">Online</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </Card>
        </div>

        {/* Agents Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">Active Agents</h2>
              <Button
                onClick={() => setShowCreateAgent(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </div>

            {agentsLoading ? (
              <Card className="bg-black/50 border-cyan-500/30 p-8 text-center">
                <p className="text-gray-400">Loading agents...</p>
              </Card>
            ) : agents && agents.length > 0 ? (
              <div className="space-y-4">
                {agents.map((agent: any) => (
                  <Card
                    key={agent.id}
                    className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/60 transition p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-cyan-300">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Role: <span className="text-cyan-400">{agent.role}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {agent.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                            agent.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : agent.status === "paused"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border-cyan-500/30 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No agents yet. Create one to get started.</p>
              </Card>
            )}

            {/* Create Agent Form */}
            {showCreateAgent && (
              <Card className="bg-black/50 border-cyan-500/30 p-6 mt-6">
                <h3 className="text-lg font-bold text-cyan-300 mb-4">
                  Create New Agent
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g., DataAnalyzer"
                      className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={agentRole}
                      onChange={(e) => setAgentRole(e.target.value)}
                      placeholder="e.g., analyst, executor, coordinator"
                      className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateAgent}
                      disabled={createAgentMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                    >
                      {createAgentMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                    <Button
                      onClick={() => setShowCreateAgent(false)}
                      variant="outline"
                      className="border-cyan-500 text-cyan-400"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">Activity Feed</h2>
            <Card className="bg-black/50 border-cyan-500/30 p-6 max-h-96 overflow-y-auto">
              {activity && activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.slice(0, 10).map((log: any, i: number) => (
                    <div
                      key={i}
                      className="text-xs border-l-2 border-cyan-500/30 pl-3 py-1"
                    >
                      <p className="text-cyan-400 font-mono">
                        {log.eventType}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {log.description}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No activity yet</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
