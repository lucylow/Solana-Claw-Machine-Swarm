use anchor_lang::prelude::*;

use crate::{
    errors::ClawError,
    events::*,
    state::{
        AgentProfileAccount, ConfigAccount, DeploymentReceiptAccount, DeploymentStatus, DiscoveryRowAccount, MemoryAnchorAccount, MemoryAnchorKind,
        MemoryAnchorResult, PlannerOutcome, PlannerRunAccount, ProfileStatus, ReputationAccount, SkillAccount, SkillStatus, SkillVersionAccount,
        VersionStatus, APP_NAME_MAX, APP_URI_MAX, AVATAR_URL_MAX, CATEGORY_MAX, COMPATIBILITY_MAX, DISPLAY_NAME_MAX, HASH_MAX, KIND_MAX, LANG_MAX,
        PROFILE_HASH_MAX, SUMMARY_MAX, TAGS_CSV_MAX, TITLE_MAX, URL_MAX, VERSION_MAX,
    },
};

fn assert_not_paused(paused: bool) -> Result<()> {
    require!(!paused, ClawError::ProgramPaused);
    Ok(())
}

fn assert_authority(expected: Pubkey, signer: Pubkey) -> Result<()> {
    require!(expected == signer, ClawError::Unauthorized);
    Ok(())
}

fn ensure_len(value: &str, max: usize) -> Result<()> {
    require!(value.len() <= max, ClawError::StringTooLong);
    Ok(())
}

fn ensure_bps(value: u16) -> Result<()> {
    require!(value <= 10_000, ClawError::InvalidRange);
    Ok(())
}

fn csv_join(values: &[String]) -> String {
    values.join(",")
}

fn now_ts() -> Result<i64> {
    Ok(Clock::get()?.unix_timestamp)
}

fn bps_from_ratio(numerator: u64, denominator: u64) -> u16 {
    if denominator == 0 {
        return 0;
    }
    let scaled = numerator.saturating_mul(10_000) / denominator;
    scaled.min(10_000) as u16
}

fn trust_score(success_count: u64, failure_count: u64, verified_authorship_count: u64, deployment_count: u64) -> u16 {
    let total = success_count.saturating_add(failure_count);
    let success_bps = bps_from_ratio(success_count, total.max(1));
    let auth_component = (verified_authorship_count.min(25) as u16).saturating_mul(120);
    let deploy_component = (deployment_count.min(25) as u16).saturating_mul(80);
    (success_bps / 2 + auth_component + deploy_component).min(10_000)
}

fn discovery_score(
    trust_bps: u16,
    usage_count: u64,
    success_count: u64,
    version_count: u32,
    published_skill_count: u64,
    verified_authorship_count: u64,
    avg_reflection_quality_bps: u16,
) -> u16 {
    let usage_component = (usage_count.min(1000) as u16).saturating_mul(3);
    let success_ratio = bps_from_ratio(success_count, usage_count.max(1));
    let version_component = (version_count.min(20) as u16).saturating_mul(40);
    let publish_component = (published_skill_count.min(50) as u16).saturating_mul(50);
    let auth_component = (verified_authorship_count.min(50) as u16).saturating_mul(30);
    let reflection_component = avg_reflection_quality_bps / 2;
    (trust_bps / 2 + usage_component + success_ratio / 2 + version_component + publish_component + auth_component + reflection_component).min(10_000)
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(init, payer = authority, space = ConfigAccount::space(), seeds = [b"config"], bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_config_handler(
    ctx: Context<InitializeConfig>,
    app_name: String,
    app_uri: String,
    chain_id: u64,
    min_profile_reputation: u64,
    max_skills_per_owner: u16,
) -> Result<()> {
    ensure_len(&app_name, APP_NAME_MAX)?;
    ensure_len(&app_uri, APP_URI_MAX)?;
    let now = now_ts()?;

    let cfg = &mut ctx.accounts.config;
    cfg.authority = ctx.accounts.authority.key();
    cfg.treasury = ctx.accounts.treasury.key();
    cfg.app_name = app_name.clone();
    cfg.app_uri = app_uri;
    cfg.chain_id = chain_id;
    cfg.paused = false;
    cfg.min_profile_reputation = min_profile_reputation;
    cfg.max_skills_per_owner = max_skills_per_owner;
    cfg.total_profiles = 0;
    cfg.total_skills = 0;
    cfg.total_versions = 0;
    cfg.total_memory_anchors = 0;
    cfg.total_planner_runs = 0;
    cfg.total_deployments = 0;
    cfg.total_reputation_events = 0;
    cfg.total_discovery_rows = 0;
    cfg.bump = ctx.bumps.config;
    cfg.created_at = now;
    cfg.updated_at = now;

    emit!(ConfigInitialized {
        config: cfg.key(),
        authority: ctx.accounts.authority.key(),
        app_name,
        chain_id,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = authority)]
    pub config: Account<'info, ConfigAccount>,
    pub authority: Signer<'info>,
}

pub fn update_config_handler(
    ctx: Context<UpdateConfig>,
    app_name: Option<String>,
    app_uri: Option<String>,
    paused: Option<bool>,
    min_profile_reputation: Option<u64>,
    max_skills_per_owner: Option<u16>,
) -> Result<()> {
    assert_authority(ctx.accounts.config.authority, ctx.accounts.authority.key())?;
    let config = &mut ctx.accounts.config;

    if let Some(name) = app_name {
        ensure_len(&name, APP_NAME_MAX)?;
        config.app_name = name;
    }
    if let Some(uri) = app_uri {
        ensure_len(&uri, APP_URI_MAX)?;
        config.app_uri = uri;
    }
    if let Some(v) = paused {
        config.paused = v;
    }
    if let Some(v) = min_profile_reputation {
        config.min_profile_reputation = v;
    }
    if let Some(v) = max_skills_per_owner {
        config.max_skills_per_owner = v;
    }
    config.updated_at = now_ts()?;

    emit!(ConfigUpdated {
        config: config.key(),
        authority: ctx.accounts.authority.key(),
        app_name: config.app_name.clone(),
        paused: config.paused,
        timestamp: config.updated_at,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(init, payer = payer, space = AgentProfileAccount::space(), seeds = [b"profile", payer.key().as_ref()], bump)]
    pub profile: Account<'info, AgentProfileAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_profile_handler(ctx: Context<CreateProfile>, display_name: String, avatar_url: String, profile_hash: String) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    ensure_len(&display_name, DISPLAY_NAME_MAX)?;
    ensure_len(&avatar_url, AVATAR_URL_MAX)?;
    ensure_len(&profile_hash, PROFILE_HASH_MAX)?;

    let now = now_ts()?;
    let profile = &mut ctx.accounts.profile;
    profile.wallet = ctx.accounts.payer.key();
    profile.authority = ctx.accounts.payer.key();
    profile.display_name = display_name.clone();
    profile.avatar_url = avatar_url;
    profile.profile_hash = profile_hash;
    profile.reputation = 0;
    profile.verified = false;
    profile.status = ProfileStatus::Unverified;
    profile.skill_count = 0;
    profile.memory_count = 0;
    profile.planner_count = 0;
    profile.receipt_count = 0;
    profile.active_skill_count = 0;
    profile.trust_score_bps = 0;
    profile.discovery_score_bps = 0;
    profile.last_rank = 0;
    profile.created_at = now;
    profile.updated_at = now;
    profile.last_seen_at = now;
    profile.bump = ctx.bumps.profile;

    let cfg = &mut ctx.accounts.config;
    cfg.total_profiles = cfg.total_profiles.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(ProfileCreated {
        profile: profile.key(),
        wallet: ctx.accounts.payer.key(),
        display_name,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"profile", authority.key().as_ref()], bump = profile.bump, has_one = authority)]
    pub profile: Account<'info, AgentProfileAccount>,
    pub authority: Signer<'info>,
}

pub fn update_profile_handler(
    ctx: Context<UpdateProfile>,
    display_name: Option<String>,
    avatar_url: Option<String>,
    profile_hash: Option<String>,
    reputation: Option<u64>,
    verified: Option<bool>,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    let now = now_ts()?;
    let profile = &mut ctx.accounts.profile;
    assert_authority(profile.authority, ctx.accounts.authority.key())?;

    if let Some(name) = display_name {
        ensure_len(&name, DISPLAY_NAME_MAX)?;
        profile.display_name = name;
    }
    if let Some(url) = avatar_url {
        ensure_len(&url, AVATAR_URL_MAX)?;
        profile.avatar_url = url;
    }
    if let Some(hash) = profile_hash {
        ensure_len(&hash, PROFILE_HASH_MAX)?;
        profile.profile_hash = hash;
    }
    if let Some(rep) = reputation {
        profile.reputation = rep;
    }
    if let Some(v) = verified {
        profile.verified = v;
        profile.status = if v { ProfileStatus::Verified } else { ProfileStatus::Unverified };
    }

    profile.updated_at = now;
    profile.last_seen_at = now;

    emit!(ProfileUpdated {
        profile: profile.key(),
        wallet: ctx.accounts.authority.key(),
        reputation: profile.reputation,
        trust_score_bps: profile.trust_score_bps,
        discovery_score_bps: profile.discovery_score_bps,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct PublishSkill<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(
        mut,
        seeds = [b"profile", payer.key().as_ref()],
        bump = profile.bump,
        has_one = wallet @ ClawError::Unauthorized,
        constraint = wallet.key() == payer.key() @ ClawError::Unauthorized
    )]
    pub profile: Account<'info, AgentProfileAccount>,
    /// CHECK: constrained via has_one + key equality to payer.
    pub wallet: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = SkillAccount::space(), seeds = [b"skill", payer.key().as_ref(), slug.as_bytes()], bump)]
    pub skill: Account<'info, SkillAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn publish_skill_handler(
    ctx: Context<PublishSkill>,
    slug: String,
    name: String,
    description: String,
    category: String,
    language: String,
    tags: Vec<String>,
    content_hash: String,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    ensure_len(&slug, TITLE_MAX)?;
    ensure_len(&name, TITLE_MAX)?;
    ensure_len(&description, SUMMARY_MAX)?;
    ensure_len(&category, CATEGORY_MAX)?;
    ensure_len(&language, LANG_MAX)?;
    ensure_len(&content_hash, HASH_MAX)?;

    let tags_csv = csv_join(&tags);
    ensure_len(&tags_csv, TAGS_CSV_MAX)?;
    let now = now_ts()?;

    let profile = &mut ctx.accounts.profile;
    let config = &ctx.accounts.config;
    require!(
        profile.skill_count < config.max_skills_per_owner as u64,
        ClawError::InvalidRange
    );

    let skill = &mut ctx.accounts.skill;
    skill.owner = ctx.accounts.payer.key();
    skill.profile = profile.key();
    skill.slug = slug.clone();
    skill.name = name.clone();
    skill.description = description;
    skill.category = category;
    skill.language = language;
    skill.tags_csv = tags_csv;
    skill.content_hash = content_hash.clone();
    skill.version_count = 0;
    skill.latest_version_index = 0;
    skill.usage_count = 0;
    skill.success_count = 0;
    skill.failure_count = 0;
    skill.reflection_quality_sum_bps = 0;
    skill.avg_reflection_quality_bps = 0;
    skill.trust_score_bps = 0;
    skill.discovery_score_bps = 0;
    skill.endorsement_count = 0;
    skill.status = SkillStatus::Draft;
    skill.created_at = now;
    skill.updated_at = now;
    skill.bump = ctx.bumps.skill;

    profile.skill_count = profile.skill_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    profile.updated_at = now;
    profile.last_seen_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_skills = cfg.total_skills.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(SkillPublished {
        skill: skill.key(),
        owner: ctx.accounts.payer.key(),
        slug,
        name,
        content_hash,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(version: String)]
pub struct CreateSkillVersion<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"skill", owner.key().as_ref(), skill.slug.as_bytes()], bump = skill.bump, has_one = owner)]
    pub skill: Account<'info, SkillAccount>,
    #[account(init, payer = owner, space = SkillVersionAccount::space(), seeds = [b"skill_version", skill.key().as_ref(), version.as_bytes()], bump)]
    pub skill_version: Account<'info, SkillVersionAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_skill_version_handler(
    ctx: Context<CreateSkillVersion>,
    version: String,
    changelog: String,
    code_hash: String,
    content_hash: String,
    artifact_uri: String,
    compatibility: String,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.skill.owner, ctx.accounts.owner.key())?;
    ensure_len(&version, VERSION_MAX)?;
    ensure_len(&changelog, SUMMARY_MAX)?;
    ensure_len(&code_hash, HASH_MAX)?;
    ensure_len(&content_hash, HASH_MAX)?;
    ensure_len(&artifact_uri, URL_MAX)?;
    ensure_len(&compatibility, COMPATIBILITY_MAX)?;

    let now = now_ts()?;
    let version_account = &mut ctx.accounts.skill_version;
    version_account.skill = ctx.accounts.skill.key();
    version_account.owner = ctx.accounts.owner.key();
    version_account.version = version.clone();
    version_account.changelog = changelog;
    version_account.code_hash = code_hash.clone();
    version_account.content_hash = content_hash.clone();
    version_account.artifact_uri = artifact_uri;
    version_account.compatibility = compatibility;
    version_account.usage_count = 0;
    version_account.success_count = 0;
    version_account.failure_count = 0;
    version_account.reflection_quality_sum_bps = 0;
    version_account.avg_reflection_quality_bps = 0;
    version_account.trust_score_bps = 0;
    version_account.discovery_score_bps = 0;
    version_account.endorsement_count = 0;
    version_account.status = VersionStatus::Draft;
    version_account.created_at = now;
    version_account.updated_at = now;
    version_account.activated_at = 0;
    version_account.bump = ctx.bumps.skill_version;

    let skill = &mut ctx.accounts.skill;
    skill.version_count = skill.version_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    skill.latest_version_index = skill.version_count.saturating_sub(1);
    skill.updated_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_versions = cfg.total_versions.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(SkillVersionCreated {
        skill_version: version_account.key(),
        skill: skill.key(),
        owner: ctx.accounts.owner.key(),
        version,
        code_hash,
        content_hash,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct ActivateSkillVersion<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"skill", owner.key().as_ref(), skill.slug.as_bytes()], bump = skill.bump, has_one = owner)]
    pub skill: Account<'info, SkillAccount>,
    #[account(mut, seeds = [b"skill_version", skill.key().as_ref(), skill_version.version.as_bytes()], bump = skill_version.bump, has_one = owner)]
    pub skill_version: Account<'info, SkillVersionAccount>,
    pub owner: Signer<'info>,
}

pub fn activate_skill_version_handler(ctx: Context<ActivateSkillVersion>) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.skill.owner, ctx.accounts.owner.key())?;
    let now = now_ts()?;

    let version_account = &mut ctx.accounts.skill_version;
    require!(version_account.status != VersionStatus::Active, ClawError::VersionAlreadyActive);
    version_account.status = VersionStatus::Active;
    version_account.activated_at = now;
    version_account.updated_at = now;

    let skill = &mut ctx.accounts.skill;
    skill.status = SkillStatus::Active;
    skill.latest_version_index = skill.version_count.saturating_sub(1);
    skill.updated_at = now;

    emit!(SkillVersionActivated {
        skill_version: version_account.key(),
        skill: skill.key(),
        owner: ctx.accounts.owner.key(),
        version: version_account.version.clone(),
        activated_at: now,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(source_turn_id: String)]
pub struct AnchorMemory<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"profile", wallet.key().as_ref()], bump = profile.bump, has_one = wallet)]
    pub profile: Account<'info, AgentProfileAccount>,
    #[account(init, payer = wallet, space = MemoryAnchorAccount::space(), seeds = [b"memory", profile.key().as_ref(), source_turn_id.as_bytes()], bump)]
    pub memory_anchor: Account<'info, MemoryAnchorAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn anchor_memory_handler(
    ctx: Context<AnchorMemory>,
    source_turn_id: String,
    task_type: String,
    kind: MemoryAnchorKind,
    result: MemoryAnchorResult,
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
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.profile.authority, ctx.accounts.wallet.key())?;
    ensure_bps(confidence_bps)?;
    ensure_bps(severity_bps)?;
    ensure_len(&source_turn_id, TITLE_MAX)?;
    ensure_len(&task_type, KIND_MAX)?;
    ensure_len(&source_hash, HASH_MAX)?;
    ensure_len(&reflection_hash, HASH_MAX)?;
    ensure_len(&lesson_hash, HASH_MAX)?;
    ensure_len(&summary, SUMMARY_MAX)?;
    ensure_len(&root_cause, SUMMARY_MAX)?;
    ensure_len(&corrective_advice, SUMMARY_MAX)?;
    ensure_len(&next_best_action, SUMMARY_MAX)?;

    let tags_csv = csv_join(&tags);
    let related_csv = csv_join(&related_memory_ids);
    ensure_len(&tags_csv, TAGS_CSV_MAX)?;
    ensure_len(&related_csv, TAGS_CSV_MAX)?;
    let now = now_ts()?;

    let anchor = &mut ctx.accounts.memory_anchor;
    anchor.profile = ctx.accounts.profile.key();
    anchor.wallet = ctx.accounts.wallet.key();
    anchor.source_turn_id = source_turn_id.clone();
    anchor.task_type = task_type.clone();
    anchor.kind = kind;
    anchor.result = result.clone();
    anchor.source_hash = source_hash.clone();
    anchor.reflection_hash = reflection_hash.clone();
    anchor.lesson_hash = lesson_hash.clone();
    anchor.summary = summary;
    anchor.root_cause = root_cause;
    anchor.corrective_advice = corrective_advice;
    anchor.next_best_action = next_best_action;
    anchor.confidence_bps = confidence_bps;
    anchor.severity_bps = severity_bps;
    anchor.tags_csv = tags_csv;
    anchor.related_memory_ids_csv = related_csv;
    anchor.pinned = pinned;
    anchor.created_at = now;
    anchor.updated_at = now;
    anchor.bump = ctx.bumps.memory_anchor;

    let profile = &mut ctx.accounts.profile;
    profile.memory_count = profile.memory_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    profile.updated_at = now;
    profile.last_seen_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_memory_anchors = cfg.total_memory_anchors.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(MemoryAnchored {
        memory_anchor: anchor.key(),
        profile: profile.key(),
        wallet: ctx.accounts.wallet.key(),
        source_turn_id,
        task_type,
        result: result as u8,
        source_hash,
        reflection_hash,
        lesson_hash,
        pinned,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(run_id: String)]
pub struct RecordPlannerRun<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"profile", wallet.key().as_ref()], bump = profile.bump, has_one = wallet)]
    pub profile: Account<'info, AgentProfileAccount>,
    #[account(init, payer = wallet, space = PlannerRunAccount::space(), seeds = [b"planner", profile.key().as_ref(), run_id.as_bytes()], bump)]
    pub planner_run: Account<'info, PlannerRunAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn record_planner_run_handler(
    ctx: Context<RecordPlannerRun>,
    run_id: String,
    task_type: String,
    goal: String,
    plan_hash: String,
    step_hash: String,
    outcome: PlannerOutcome,
    selected_skill: String,
    step_count: u16,
    completed_steps: u16,
    failed_steps: u16,
    root_cause: String,
    corrective_advice: String,
    next_best_action: String,
    confidence_bps: u16,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.profile.authority, ctx.accounts.wallet.key())?;
    ensure_bps(confidence_bps)?;
    require!(completed_steps <= step_count && failed_steps <= step_count && completed_steps.saturating_add(failed_steps) <= step_count, ClawError::InvalidStepCounts);

    ensure_len(&run_id, TITLE_MAX)?;
    ensure_len(&task_type, KIND_MAX)?;
    ensure_len(&goal, SUMMARY_MAX)?;
    ensure_len(&plan_hash, HASH_MAX)?;
    ensure_len(&step_hash, HASH_MAX)?;
    ensure_len(&selected_skill, TITLE_MAX)?;
    ensure_len(&root_cause, SUMMARY_MAX)?;
    ensure_len(&corrective_advice, SUMMARY_MAX)?;
    ensure_len(&next_best_action, SUMMARY_MAX)?;

    let now = now_ts()?;
    let run = &mut ctx.accounts.planner_run;
    run.profile = ctx.accounts.profile.key();
    run.wallet = ctx.accounts.wallet.key();
    run.run_id = run_id.clone();
    run.task_type = task_type;
    run.goal = goal;
    run.plan_hash = plan_hash.clone();
    run.step_hash = step_hash.clone();
    run.outcome = outcome.clone();
    run.selected_skill = selected_skill;
    run.step_count = step_count;
    run.completed_steps = completed_steps;
    run.failed_steps = failed_steps;
    run.root_cause = root_cause;
    run.corrective_advice = corrective_advice;
    run.next_best_action = next_best_action;
    run.confidence_bps = confidence_bps;
    run.created_at = now;
    run.updated_at = now;
    run.completed_at = if matches!(outcome, PlannerOutcome::Succeeded | PlannerOutcome::Failed | PlannerOutcome::Aborted) { now } else { 0 };
    run.bump = ctx.bumps.planner_run;

    let profile = &mut ctx.accounts.profile;
    profile.planner_count = profile.planner_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    profile.updated_at = now;
    profile.last_seen_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_planner_runs = cfg.total_planner_runs.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(PlannerRunRecorded {
        planner_run: run.key(),
        profile: profile.key(),
        wallet: ctx.accounts.wallet.key(),
        run_id,
        outcome: outcome as u8,
        plan_hash,
        step_hash,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(deploy_id: String)]
pub struct RecordDeployment<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"profile", wallet.key().as_ref()], bump = profile.bump, has_one = wallet)]
    pub profile: Account<'info, AgentProfileAccount>,
    #[account(init, payer = wallet, space = DeploymentReceiptAccount::space(), seeds = [b"deployment", profile.key().as_ref(), deploy_id.as_bytes()], bump)]
    pub deployment: Account<'info, DeploymentReceiptAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[allow(clippy::too_many_arguments)]
pub fn record_deployment_handler(
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
    status: DeploymentStatus,
    artifact_count: u16,
    bytes: u64,
    chain_id: u64,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.profile.authority, ctx.accounts.wallet.key())?;
    ensure_len(&deploy_id, TITLE_MAX)?;
    ensure_len(&name, TITLE_MAX)?;
    ensure_len(&version, VERSION_MAX)?;
    ensure_len(&target, KIND_MAX)?;
    ensure_len(&bundle_hash, HASH_MAX)?;
    ensure_len(&source_hash, HASH_MAX)?;
    ensure_len(&storage_key, URL_MAX)?;
    ensure_len(&receipt_hash, HASH_MAX)?;
    ensure_len(&tx_hash, HASH_MAX)?;
    ensure_len(&explorer_url, URL_MAX)?;

    let now = now_ts()?;
    let deployment = &mut ctx.accounts.deployment;
    deployment.profile = ctx.accounts.profile.key();
    deployment.wallet = ctx.accounts.wallet.key();
    deployment.deploy_id = deploy_id.clone();
    deployment.name = name.clone();
    deployment.version = version.clone();
    deployment.target = target;
    deployment.bundle_hash = bundle_hash.clone();
    deployment.source_hash = source_hash;
    deployment.storage_key = storage_key;
    deployment.receipt_hash = receipt_hash.clone();
    deployment.tx_hash = tx_hash;
    deployment.explorer_url = explorer_url;
    deployment.status = status.clone();
    deployment.artifact_count = artifact_count;
    deployment.bytes = bytes;
    deployment.chain_id = chain_id;
    deployment.created_at = now;
    deployment.updated_at = now;
    deployment.confirmed_at = if matches!(status, DeploymentStatus::Confirmed | DeploymentStatus::Anchored) { now } else { 0 };
    deployment.bump = ctx.bumps.deployment;

    let profile = &mut ctx.accounts.profile;
    profile.receipt_count = profile.receipt_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    profile.updated_at = now;
    profile.last_seen_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_deployments = cfg.total_deployments.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(DeploymentRecorded {
        deployment: deployment.key(),
        profile: profile.key(),
        wallet: ctx.accounts.wallet.key(),
        deploy_id,
        name,
        version,
        bundle_hash,
        receipt_hash,
        status: status as u8,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"profile", wallet.key().as_ref()], bump = profile.bump, has_one = wallet)]
    pub profile: Account<'info, AgentProfileAccount>,
    #[account(init_if_needed, payer = wallet, space = ReputationAccount::space(), seeds = [b"reputation", profile.key().as_ref()], bump)]
    pub reputation: Account<'info, ReputationAccount>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn update_reputation_handler(
    ctx: Context<UpdateReputation>,
    event_kind: String,
    event_ref: String,
    success: bool,
    reward_points: u64,
    reflection_quality_bps: u16,
) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    assert_authority(ctx.accounts.profile.authority, ctx.accounts.wallet.key())?;
    ensure_len(&event_kind, KIND_MAX)?;
    ensure_len(&event_ref, HASH_MAX)?;
    ensure_bps(reflection_quality_bps)?;

    let now = now_ts()?;
    let rep = &mut ctx.accounts.reputation;
    if rep.created_at == 0 {
        rep.profile = ctx.accounts.profile.key();
        rep.wallet = ctx.accounts.wallet.key();
        rep.usage_count = 0;
        rep.success_count = 0;
        rep.failure_count = 0;
        rep.memory_anchor_count = 0;
        rep.planner_run_count = 0;
        rep.deployment_count = 0;
        rep.published_skill_count = 0;
        rep.published_version_count = 0;
        rep.verified_authorship_count = 0;
        rep.trust_score_bps = 0;
        rep.discovery_score_bps = 0;
        rep.total_reward_points = 0;
        rep.last_event_kind = event_kind.clone();
        rep.last_event_ref = event_ref.clone();
        rep.last_event_at = now;
        rep.created_at = now;
        rep.bump = ctx.bumps.reputation;
    }

    rep.usage_count = rep.usage_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    if success {
        rep.success_count = rep.success_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    } else {
        rep.failure_count = rep.failure_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    }

    match event_kind.as_str() {
        "memory_anchor" => rep.memory_anchor_count = rep.memory_anchor_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        "planner_run" => rep.planner_run_count = rep.planner_run_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        "deployment" => rep.deployment_count = rep.deployment_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        "skill_publish" => rep.published_skill_count = rep.published_skill_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        "skill_version" => rep.published_version_count = rep.published_version_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        "verified_authorship" => rep.verified_authorship_count = rep.verified_authorship_count.checked_add(1).ok_or(error!(ClawError::MathOverflow))?,
        _ => {}
    }

    rep.total_reward_points = rep.total_reward_points.checked_add(reward_points).ok_or(error!(ClawError::MathOverflow))?;
    rep.trust_score_bps = trust_score(rep.success_count, rep.failure_count, rep.verified_authorship_count, rep.deployment_count);
    rep.discovery_score_bps = discovery_score(
        rep.trust_score_bps,
        rep.usage_count,
        rep.success_count,
        0,
        rep.published_skill_count,
        rep.verified_authorship_count,
        reflection_quality_bps,
    );
    rep.last_event_kind = event_kind.clone();
    rep.last_event_ref = event_ref.clone();
    rep.last_event_at = now;
    rep.updated_at = now;

    let profile = &mut ctx.accounts.profile;
    profile.reputation = rep.trust_score_bps as u64;
    profile.trust_score_bps = rep.trust_score_bps;
    profile.discovery_score_bps = rep.discovery_score_bps;
    profile.updated_at = now;
    profile.last_seen_at = now;

    let cfg = &mut ctx.accounts.config;
    cfg.total_reputation_events = cfg.total_reputation_events.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    cfg.updated_at = now;

    emit!(ReputationUpdated {
        reputation: rep.key(),
        profile: profile.key(),
        wallet: ctx.accounts.wallet.key(),
        event_kind,
        event_ref,
        usage_count: rep.usage_count,
        success_count: rep.success_count,
        failure_count: rep.failure_count,
        trust_score_bps: rep.trust_score_bps,
        discovery_score_bps: rep.discovery_score_bps,
        timestamp: now,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct RefreshDiscovery<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ConfigAccount>,
    #[account(mut, seeds = [b"skill", owner.key().as_ref(), skill.slug.as_bytes()], bump = skill.bump, has_one = owner)]
    pub skill: Account<'info, SkillAccount>,
    #[account(init_if_needed, payer = owner, space = DiscoveryRowAccount::space(), seeds = [b"discovery", skill.key().as_ref()], bump)]
    pub discovery_row: Account<'info, DiscoveryRowAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn refresh_discovery_handler(ctx: Context<RefreshDiscovery>) -> Result<()> {
    assert_not_paused(ctx.accounts.config.paused)?;
    let now = now_ts()?;

    let skill = &ctx.accounts.skill;
    let discovery_score_bps = discovery_score(
        skill.trust_score_bps,
        skill.usage_count,
        skill.success_count,
        skill.version_count,
        1,
        skill.endorsement_count,
        skill.avg_reflection_quality_bps,
    );

    let row = &mut ctx.accounts.discovery_row;
    let is_new = row.updated_at == 0;
    row.skill = skill.key();
    row.owner = skill.owner;
    row.profile = skill.profile;
    row.slug = skill.slug.clone();
    row.name = skill.name.clone();
    row.category = skill.category.clone();
    row.language = skill.language.clone();
    row.tags_csv = skill.tags_csv.clone();
    row.content_hash = skill.content_hash.clone();
    row.version_count = skill.version_count;
    row.latest_version_index = skill.latest_version_index;
    row.usage_count = skill.usage_count;
    row.success_count = skill.success_count;
    row.failure_count = skill.failure_count;
    row.avg_reflection_quality_bps = skill.avg_reflection_quality_bps;
    row.trust_score_bps = skill.trust_score_bps;
    row.discovery_score_bps = discovery_score_bps;
    row.signal_count = skill.usage_count + skill.endorsement_count + skill.version_count as u64;
    row.last_rank = 0;
    row.last_snapshot_at = now;
    row.updated_at = now;
    row.bump = ctx.bumps.discovery_row;

    let cfg = &mut ctx.accounts.config;
    if is_new {
        cfg.total_discovery_rows = cfg.total_discovery_rows.checked_add(1).ok_or(error!(ClawError::MathOverflow))?;
    }
    cfg.updated_at = now;

    emit!(DiscoveryRowUpdated {
        discovery_row: row.key(),
        skill: skill.key(),
        owner: skill.owner,
        slug: skill.slug.clone(),
        discovery_score_bps,
        trust_score_bps: skill.trust_score_bps,
        last_rank: 0,
        timestamp: now,
    });
    Ok(())
}
