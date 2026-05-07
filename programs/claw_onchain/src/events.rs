use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub config: Pubkey,
    pub authority: Pubkey,
    pub app_name: String,
    pub chain_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct ConfigUpdated {
    pub config: Pubkey,
    pub authority: Pubkey,
    pub app_name: String,
    pub paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct ProfileCreated {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub display_name: String,
    pub timestamp: i64,
}

#[event]
pub struct ProfileUpdated {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub reputation: u64,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct SkillPublished {
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub slug: String,
    pub name: String,
    pub content_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct SkillVersionCreated {
    pub skill_version: Pubkey,
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub version: String,
    pub code_hash: String,
    pub content_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct SkillVersionActivated {
    pub skill_version: Pubkey,
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub version: String,
    pub activated_at: i64,
}

#[event]
pub struct MemoryAnchored {
    pub memory_anchor: Pubkey,
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub source_turn_id: String,
    pub task_type: String,
    pub result: u8,
    pub source_hash: String,
    pub reflection_hash: String,
    pub lesson_hash: String,
    pub pinned: bool,
    pub timestamp: i64,
}

#[event]
pub struct PlannerRunRecorded {
    pub planner_run: Pubkey,
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub run_id: String,
    pub outcome: u8,
    pub plan_hash: String,
    pub step_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct DeploymentRecorded {
    pub deployment: Pubkey,
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub deploy_id: String,
    pub name: String,
    pub version: String,
    pub bundle_hash: String,
    pub receipt_hash: String,
    pub status: u8,
    pub timestamp: i64,
}

#[event]
pub struct ReputationUpdated {
    pub reputation: Pubkey,
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub event_kind: String,
    pub event_ref: String,
    pub usage_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct DiscoveryRowUpdated {
    pub discovery_row: Pubkey,
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub slug: String,
    pub discovery_score_bps: u16,
    pub trust_score_bps: u16,
    pub last_rank: u32,
    pub timestamp: i64,
}
