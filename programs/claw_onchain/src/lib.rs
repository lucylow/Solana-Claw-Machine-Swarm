use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("ClAwOnChAin11111111111111111111111111111111");

#[program]
pub mod claw_onchain {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        app_name: String,
        app_uri: String,
        chain_id: u64,
        min_profile_reputation: u64,
        max_skills_per_owner: u16,
    ) -> Result<()> {
        initialize_config_handler(ctx, app_name, app_uri, chain_id, min_profile_reputation, max_skills_per_owner)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        app_name: Option<String>,
        app_uri: Option<String>,
        paused: Option<bool>,
        min_profile_reputation: Option<u64>,
        max_skills_per_owner: Option<u16>,
    ) -> Result<()> {
        update_config_handler(ctx, app_name, app_uri, paused, min_profile_reputation, max_skills_per_owner)
    }

    pub fn create_profile(ctx: Context<CreateProfile>, display_name: String, avatar_url: String, profile_hash: String) -> Result<()> {
        create_profile_handler(ctx, display_name, avatar_url, profile_hash)
    }

    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        display_name: Option<String>,
        avatar_url: Option<String>,
        profile_hash: Option<String>,
        reputation: Option<u64>,
        verified: Option<bool>,
    ) -> Result<()> {
        update_profile_handler(ctx, display_name, avatar_url, profile_hash, reputation, verified)
    }

    pub fn publish_skill(
        ctx: Context<PublishSkill>,
        slug: String,
        name: String,
        description: String,
        category: String,
        language: String,
        tags: Vec<String>,
        content_hash: String,
    ) -> Result<()> {
        publish_skill_handler(ctx, slug, name, description, category, language, tags, content_hash)
    }

    pub fn create_skill_version(
        ctx: Context<CreateSkillVersion>,
        version: String,
        changelog: String,
        code_hash: String,
        content_hash: String,
        artifact_uri: String,
        compatibility: String,
    ) -> Result<()> {
        create_skill_version_handler(ctx, version, changelog, code_hash, content_hash, artifact_uri, compatibility)
    }

    pub fn activate_skill_version(ctx: Context<ActivateSkillVersion>) -> Result<()> {
        activate_skill_version_handler(ctx)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn anchor_memory(
        ctx: Context<AnchorMemory>,
        source_turn_id: String,
        task_type: String,
        kind: state::MemoryAnchorKind,
        result: state::MemoryAnchorResult,
        source_hash: String,
        reflection_hash: String,
        lesson_hash: String,
        summary: String,
        root_cause: String,
        corrective_advice: String,
        next_best_action: String,
        confidence_bps: u16,
        severity_bps: u16,
        tags: Vec<String>,
        related_memory_ids: Vec<String>,
        pinned: bool,
    ) -> Result<()> {
        anchor_memory_handler(
            ctx,
            source_turn_id,
            task_type,
            kind,
            result,
            source_hash,
            reflection_hash,
            lesson_hash,
            summary,
            root_cause,
            corrective_advice,
            next_best_action,
            confidence_bps,
            severity_bps,
            tags,
            related_memory_ids,
            pinned,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn record_planner_run(
        ctx: Context<RecordPlannerRun>,
        run_id: String,
        task_type: String,
        goal: String,
        plan_hash: String,
        step_hash: String,
        outcome: state::PlannerOutcome,
        selected_skill: String,
        step_count: u16,
        completed_steps: u16,
        failed_steps: u16,
        root_cause: String,
        corrective_advice: String,
        next_best_action: String,
        confidence_bps: u16,
    ) -> Result<()> {
        record_planner_run_handler(
            ctx,
            run_id,
            task_type,
            goal,
            plan_hash,
            step_hash,
            outcome,
            selected_skill,
            step_count,
            completed_steps,
            failed_steps,
            root_cause,
            corrective_advice,
            next_best_action,
            confidence_bps,
        )
    }

    #[allow(clippy::too_many_arguments)]
    pub fn record_deployment(
        ctx: Context<RecordDeployment>,
        deploy_id: String,
        name: String,
        version: String,
        target: String,
        bundle_hash: String,
        source_hash: String,
        storage_key: String,
        receipt_hash: String,
        tx_hash: String,
        explorer_url: String,
        status: state::DeploymentStatus,
        artifact_count: u16,
        bytes: u64,
        chain_id: u64,
    ) -> Result<()> {
        record_deployment_handler(
            ctx,
            deploy_id,
            name,
            version,
            target,
            bundle_hash,
            source_hash,
            storage_key,
            receipt_hash,
            tx_hash,
            explorer_url,
            status,
            artifact_count,
            bytes,
            chain_id,
        )
    }

    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        event_kind: String,
        event_ref: String,
        success: bool,
        reward_points: u64,
        reflection_quality_bps: u16,
    ) -> Result<()> {
        update_reputation_handler(ctx, event_kind, event_ref, success, reward_points, reflection_quality_bps)
    }

    pub fn refresh_discovery(ctx: Context<RefreshDiscovery>) -> Result<()> {
        refresh_discovery_handler(ctx)
    }
}
