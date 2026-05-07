import fs from "fs/promises";
import path from "path";
import type {
  IdentityBundleRecord,
  IdentityChallengeRecord,
  IdentityMemoryRecord,
  IdentityProfileRecord,
  IdentityReceiptRecord,
  DeploymentRecord,
  IdentitySkillRecord,
  PlannerRunRecord,
  ReputationAccountRecord,
} from "./identityTypes";

type State = {
  challenges: Record<string, IdentityChallengeRecord>;
  profiles: Record<string, IdentityProfileRecord>;
  receipts: Record<string, IdentityReceiptRecord[]>;
  skills: Record<string, IdentitySkillRecord[]>;
  memories: Record<string, IdentityMemoryRecord[]>;
  plannerRuns: Record<string, PlannerRunRecord[]>;
  deployments: Record<string, DeploymentRecord[]>;
  reputations: Record<string, ReputationAccountRecord>;
};

const EMPTY_STATE: State = {
  challenges: {},
  profiles: {},
  receipts: {},
  skills: {},
  memories: {},
  plannerRuns: {},
  deployments: {},
  reputations: {},
};

export class IdentityStore {
  private state: State = structuredClone(EMPTY_STATE);

  constructor(private readonly filePath?: string) {}

  private async ensureLoaded() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<State>;
      this.state = {
        challenges: parsed.challenges || {},
        profiles: parsed.profiles || {},
        receipts: parsed.receipts || {},
        skills: parsed.skills || {},
        memories: parsed.memories || {},
        plannerRuns: parsed.plannerRuns || {},
        deployments: parsed.deployments || {},
        reputations: parsed.reputations || {},
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE);
    }
  }

  private async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  async init() {
    await this.ensureLoaded();
  }

  async saveChallenge(record: IdentityChallengeRecord) {
    this.state.challenges[record.id] = record;
    await this.persist();
    return record;
  }

  async getChallenge(id: string) {
    return this.state.challenges[id];
  }

  async latestChallenge(walletAddress: string) {
    return Object.values(this.state.challenges)
      .filter(challenge => challenge.walletAddress === walletAddress)
      .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt))[0];
  }

  async saveProfile(record: IdentityProfileRecord) {
    this.state.profiles[record.walletAddress] = record;
    await this.persist();
    return record;
  }

  async getProfile(walletAddress: string) {
    return this.state.profiles[walletAddress];
  }

  async saveReceipt(record: IdentityReceiptRecord) {
    const list = this.state.receipts[record.walletAddress] || [];
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    this.state.receipts[record.walletAddress] = list;
    await this.persist();
    return record;
  }

  async listReceipts(walletAddress: string) {
    return this.state.receipts[walletAddress] || [];
  }

  async saveSkills(walletAddress: string, skills: IdentitySkillRecord[]) {
    this.state.skills[walletAddress] = skills;
    await this.persist();
    return skills;
  }

  async listSkills(walletAddress: string) {
    return this.state.skills[walletAddress] || [];
  }

  async saveMemories(walletAddress: string, memories: IdentityMemoryRecord[]) {
    this.state.memories[walletAddress] = memories;
    await this.persist();
    return memories;
  }

  async listMemories(walletAddress: string) {
    return this.state.memories[walletAddress] || [];
  }

  async bundle(walletAddress: string, challengeId?: string): Promise<IdentityBundleRecord | undefined> {
    const profile = this.state.profiles[walletAddress];
    if (!profile) return undefined;
    const challenge =
      (challengeId && this.state.challenges[challengeId]) ||
      (await this.latestChallenge(walletAddress));

    if (!challenge) return undefined;

    return {
      challenge,
      profile,
      receipts: this.state.receipts[walletAddress] || [],
      skills: this.state.skills[walletAddress] || [],
      memories: this.state.memories[walletAddress] || [],
      plannerRuns: this.state.plannerRuns[walletAddress] || [],
      deployments: this.state.deployments[walletAddress] || [],
      reputation: this.state.reputations[walletAddress],
    };
  }

  async bumpUsage(walletAddress: string, skillRef: string) {
    const skills = this.state.skills[walletAddress] || [];
    const normalizedRef = skillRef.trim().toLowerCase();
    const idx = skills.findIndex(
      skill =>
        skill.name.toLowerCase() === normalizedRef ||
        skill.slug.toLowerCase() === normalizedRef ||
        skill.id.toLowerCase() === normalizedRef
    );
    if (idx >= 0) {
      const activeVersion = skills[idx].versions?.find(version => version.version === skills[idx].version);
      skills[idx] = {
        ...skills[idx],
        usageCount: skills[idx].usageCount + 1,
        score: Math.min(1, skills[idx].score + 0.03),
        versions:
          skills[idx].versions?.map(version =>
            version.id === activeVersion?.id
              ? {
                  ...version,
                  usageCount: version.usageCount + 1,
                  score: Math.min(1, version.score + 0.03),
                  updatedAt: Date.now(),
                }
              : version
          ) || skills[idx].versions,
        updatedAt: Date.now(),
      };
      this.state.skills[walletAddress] = skills;
      await this.persist();
    }
  }

  async addMemory(walletAddress: string, memory: IdentityMemoryRecord) {
    const memories = this.state.memories[walletAddress] || [];
    memories.unshift(memory);
    this.state.memories[walletAddress] = memories.slice(0, 100);
    await this.persist();
    return memory;
  }

  async savePlannerRun(walletAddress: string, run: PlannerRunRecord) {
    const runs = this.state.plannerRuns[walletAddress] || [];
    runs.unshift(run);
    this.state.plannerRuns[walletAddress] = runs.slice(0, 200);
    await this.persist();
    return run;
  }

  async listPlannerRuns(walletAddress: string) {
    return this.state.plannerRuns[walletAddress] || [];
  }

  async saveDeployment(walletAddress: string, deployment: DeploymentRecord) {
    const deployments = this.state.deployments[walletAddress] || [];
    deployments.unshift(deployment);
    this.state.deployments[walletAddress] = deployments.slice(0, 200);
    await this.persist();
    return deployment;
  }

  async listDeployments(walletAddress: string) {
    return this.state.deployments[walletAddress] || [];
  }

  async getReputation(walletAddress: string) {
    return this.state.reputations[walletAddress];
  }

  async saveReputation(walletAddress: string, reputation: ReputationAccountRecord) {
    this.state.reputations[walletAddress] = reputation;
    await this.persist();
    return reputation;
  }
}
