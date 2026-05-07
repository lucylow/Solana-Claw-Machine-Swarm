import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Zap, Plus, Link2, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SkillsRegistry() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");

  const { data: skills, isLoading: skillsLoading } = trpc.skills.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const createSkillMutation = trpc.skills.create.useMutation();

  const handleCreateSkill = async () => {
    if (!skillName) return;
    try {
      await createSkillMutation.mutateAsync({
        name: skillName,
        description: skillDesc,
      });
      setSkillName("");
      setSkillDesc("");
      setShowCreateSkill(false);
    } catch (err) {
      console.error("Failed to create skill:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Zap className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="mt-4 text-cyan-400">Loading skills registry...</p>
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
            <Link2 className="w-8 h-8 text-cyan-500" />
            <h1 className="text-2xl font-bold text-cyan-400">CLAW Skills Registry</h1>
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
            OpenClaw Interoperability Bridge
          </h2>
          <p className="text-gray-400 mb-4">
            The CLAW Skills Registry manages your agent skills and their compatibility with the OpenClaw ecosystem. Import tools as CLAW skills or export your skills as OpenClaw-compatible manifests.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Bridge Status</p>
              <p className="text-green-400 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Connected
              </p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Skills Registered</p>
              <p className="text-cyan-400 font-bold">{skills?.length || 0}</p>
            </div>
            <div className="bg-black/30 rounded p-3">
              <p className="text-gray-500">Compatibility</p>
              <p className="text-cyan-400 font-bold">98%</p>
            </div>
          </div>
        </Card>

        {/* Skills Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Your CLAW Skills</h2>
          <Button
            onClick={() => setShowCreateSkill(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Skill
          </Button>
        </div>

        {skillsLoading ? (
          <Card className="bg-black/50 border-cyan-500/30 p-8 text-center">
            <p className="text-gray-400">Loading skills...</p>
          </Card>
        ) : skills && skills.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {skills.map((skill: any) => (
              <Card
                key={skill.id}
                className="bg-black/50 border-cyan-500/30 hover:border-cyan-500/60 transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-300">{skill.name}</h3>
                  <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {skill.description || "No description"}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span>OpenClaw Compatible</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500 text-cyan-400 text-xs"
                  >
                    Export Manifest
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500 text-cyan-400 text-xs"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-black/50 border-cyan-500/30 p-8 text-center mb-8">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No skills yet. Create one to get started.</p>
          </Card>
        )}

        {/* Create Skill Form */}
        {showCreateSkill && (
          <Card className="bg-black/50 border-cyan-500/30 p-6 mb-8">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">
              Create New CLAW Skill
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., DataAnalyzer, TextProcessor"
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Describe what this skill does..."
                  rows={3}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSkill}
                  disabled={createSkillMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold"
                >
                  {createSkillMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button
                  onClick={() => setShowCreateSkill(false)}
                  variant="outline"
                  className="border-cyan-500 text-cyan-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Import OpenClaw Tools Section */}
        <Card className="bg-black/50 border-cyan-500/30 p-8">
          <h3 className="text-xl font-bold text-cyan-300 mb-4">
            Import OpenClaw Tools
          </h3>
          <p className="text-gray-400 mb-6">
            Import tools from the OpenClaw ecosystem and register them as CLAW skills in your SWARM network.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 justify-start"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Browse OpenClaw Marketplace
            </Button>
            <Button
              className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Import from URL
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
