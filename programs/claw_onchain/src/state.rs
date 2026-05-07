use anchor_lang::prelude::*;

pub const APP_NAME_MAX: usize = 64;
pub const APP_URI_MAX: usize = 128;
pub const DISPLAY_NAME_MAX: usize = 64;
pub const AVATAR_URL_MAX: usize = 200;
pub const PROFILE_HASH_MAX: usize = 128;
pub const TITLE_MAX: usize = 96;
pub const SUMMARY_MAX: usize = 256;
pub const TAGS_CSV_MAX: usize = 256;
pub const HASH_MAX: usize = 128;
pub const URL_MAX: usize = 220;
pub const KIND_MAX: usize = 40;
pub const VERSION_MAX: usize = 32;
pub const CATEGORY_MAX: usize = 64;
pub const LANG_MAX: usize = 32;
pub const COMPATIBILITY_MAX: usize = 96;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProfileStatus {
    Unverified,
    Verified,
    Revoked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SkillStatus {
    Draft,
    Active,
    Paused,
    Archived,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VersionStatus {
    Draft,
    Active,
    Deprecated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MemoryAnchorKind {
    Reflection,
    Lesson,
    Summary,
    SkillTrace,
    ErrorTrace,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MemoryAnchorResult {
    Success,
    Failure,
    Mixed,
    Unknown,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PlannerOutcome {
    Planned,
    Running,
    Succeeded,
    Failed,
    Aborted,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DeploymentStatus {
    Pending,
    Uploaded,
    Anchored,
    Confirmed,
    Failed,
}

#[account]
pub struct ConfigAccount {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub app_name: String,
    pub app_uri: String,
    pub chain_id: u64,
    pub paused: bool,
    pub min_profile_reputation: u64,
    pub max_skills_per_owner: u16,
    pub total_profiles: u64,
    pub total_skills: u64,
    pub total_versions: u64,
    pub total_memory_anchors: u64,
    pub total_planner_runs: u64,
    pub total_deployments: u64,
    pub total_reputation_events: u64,
    pub total_discovery_rows: u64,
    pub bump: u8,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ConfigAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + APP_NAME_MAX) + (4 + APP_URI_MAX) + 8 + 1 + 8 + 2 + 8 + 8 + 8 + 8 + 8 + 8
            + 8 + 8 + 1 + 8 + 8
    }
}

#[account]
pub struct AgentProfileAccount {
    pub wallet: Pubkey,
    pub authority: Pubkey,
    pub display_name: String,
    pub avatar_url: String,
    pub profile_hash: String,
    pub reputation: u64,
    pub verified: bool,
    pub status: ProfileStatus,
    pub skill_count: u64,
    pub memory_count: u64,
    pub planner_count: u64,
    pub receipt_count: u64,
    pub active_skill_count: u64,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub last_rank: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_seen_at: i64,
    pub bump: u8,
}

impl AgentProfileAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + DISPLAY_NAME_MAX) + (4 + AVATAR_URL_MAX) + (4 + PROFILE_HASH_MAX) + 8 + 1 + 1 + 8 + 8
            + 8 + 8 + 8 + 2 + 2 + 4 + 8 + 8 + 8 + 1
    }
}

#[account]
pub struct SkillAccount {
    pub owner: Pubkey,
    pub profile: Pubkey,
    pub slug: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub language: String,
    pub tags_csv: String,
    pub content_hash: String,
    pub version_count: u32,
    pub latest_version_index: u32,
    pub usage_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub reflection_quality_sum_bps: u64,
    pub avg_reflection_quality_bps: u16,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub endorsement_count: u64,
    pub status: SkillStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl SkillAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + TITLE_MAX) + (4 + TITLE_MAX) + (4 + SUMMARY_MAX) + (4 + CATEGORY_MAX) + (4 + LANG_MAX)
            + (4 + TAGS_CSV_MAX) + (4 + HASH_MAX) + 4 + 4 + 8 + 8 + 8 + 8 + 2 + 2 + 2 + 8 + 1 + 8 + 8 + 1
    }
}

#[account]
pub struct SkillVersionAccount {
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub version: String,
    pub changelog: String,
    pub code_hash: String,
    pub content_hash: String,
    pub artifact_uri: String,
    pub compatibility: String,
    pub usage_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub reflection_quality_sum_bps: u64,
    pub avg_reflection_quality_bps: u16,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub endorsement_count: u64,
    pub status: VersionStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub activated_at: i64,
    pub bump: u8,
}

impl SkillVersionAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + VERSION_MAX) + (4 + SUMMARY_MAX) + (4 + HASH_MAX) + (4 + HASH_MAX) + (4 + URL_MAX)
            + (4 + COMPATIBILITY_MAX) + 8 + 8 + 8 + 8 + 2 + 2 + 2 + 8 + 1 + 8 + 8 + 8 + 1
    }
}

#[account]
pub struct MemoryAnchorAccount {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub source_turn_id: String,
    pub task_type: String,
    pub kind: MemoryAnchorKind,
    pub result: MemoryAnchorResult,
    pub source_hash: String,
    pub reflection_hash: String,
    pub lesson_hash: String,
    pub summary: String,
    pub root_cause: String,
    pub corrective_advice: String,
    pub next_best_action: String,
    pub confidence_bps: u16,
    pub severity_bps: u16,
    pub tags_csv: String,
    pub related_memory_ids_csv: String,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl MemoryAnchorAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + TITLE_MAX) + (4 + KIND_MAX) + 1 + 1 + (4 + HASH_MAX) + (4 + HASH_MAX) + (4 + HASH_MAX)
            + (4 + SUMMARY_MAX) + (4 + SUMMARY_MAX) + (4 + SUMMARY_MAX) + (4 + SUMMARY_MAX) + 2 + 2 + (4 + TAGS_CSV_MAX)
            + (4 + TAGS_CSV_MAX) + 1 + 8 + 8 + 1
    }
}

#[account]
pub struct PlannerRunAccount {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub run_id: String,
    pub task_type: String,
    pub goal: String,
    pub plan_hash: String,
    pub step_hash: String,
    pub outcome: PlannerOutcome,
    pub selected_skill: String,
    pub step_count: u16,
    pub completed_steps: u16,
    pub failed_steps: u16,
    pub root_cause: String,
    pub corrective_advice: String,
    pub next_best_action: String,
    pub confidence_bps: u16,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: i64,
    pub bump: u8,
}

impl PlannerRunAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + TITLE_MAX) + (4 + KIND_MAX) + (4 + SUMMARY_MAX) + (4 + HASH_MAX) + (4 + HASH_MAX) + 1
            + (4 + TITLE_MAX) + 2 + 2 + 2 + (4 + SUMMARY_MAX) + (4 + SUMMARY_MAX) + (4 + SUMMARY_MAX) + 2 + 8 + 8 + 8 + 1
    }
}

#[account]
pub struct DeploymentReceiptAccount {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub deploy_id: String,
    pub name: String,
    pub version: String,
    pub target: String,
    pub bundle_hash: String,
    pub source_hash: String,
    pub storage_key: String,
    pub receipt_hash: String,
    pub tx_hash: String,
    pub explorer_url: String,
    pub status: DeploymentStatus,
    pub artifact_count: u16,
    pub bytes: u64,
    pub chain_id: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub confirmed_at: i64,
    pub bump: u8,
}

impl DeploymentReceiptAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + (4 + TITLE_MAX) + (4 + TITLE_MAX) + (4 + VERSION_MAX) + (4 + KIND_MAX) + (4 + HASH_MAX)
            + (4 + HASH_MAX) + (4 + URL_MAX) + (4 + HASH_MAX) + (4 + HASH_MAX) + (4 + URL_MAX) + 1 + 2 + 8 + 8 + 8 + 8 + 8 + 8 + 1
    }
}

#[account]
pub struct ReputationAccount {
    pub profile: Pubkey,
    pub wallet: Pubkey,
    pub usage_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub memory_anchor_count: u64,
    pub planner_run_count: u64,
    pub deployment_count: u64,
    pub published_skill_count: u64,
    pub published_version_count: u64,
    pub verified_authorship_count: u64,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub total_reward_points: u64,
    pub last_event_kind: String,
    pub last_event_ref: String,
    pub last_event_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl ReputationAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 2 + 2 + 8 + (4 + KIND_MAX) + (4 + HASH_MAX) + 8 + 8 + 8 + 1
    }
}

#[account]
pub struct DiscoveryRowAccount {
    pub skill: Pubkey,
    pub owner: Pubkey,
    pub profile: Pubkey,
    pub slug: String,
    pub name: String,
    pub category: String,
    pub language: String,
    pub tags_csv: String,
    pub content_hash: String,
    pub version_count: u32,
    pub latest_version_index: u32,
    pub usage_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub avg_reflection_quality_bps: u16,
    pub trust_score_bps: u16,
    pub discovery_score_bps: u16,
    pub signal_count: u64,
    pub last_rank: u32,
    pub last_snapshot_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl DiscoveryRowAccount {
    pub fn space() -> usize {
        8 + 32 + 32 + 32 + (4 + TITLE_MAX) + (4 + TITLE_MAX) + (4 + CATEGORY_MAX) + (4 + LANG_MAX) + (4 + TAGS_CSV_MAX)
            + (4 + HASH_MAX) + 4 + 4 + 8 + 8 + 8 + 2 + 2 + 2 + 8 + 4 + 8 + 8 + 1
    }
}
