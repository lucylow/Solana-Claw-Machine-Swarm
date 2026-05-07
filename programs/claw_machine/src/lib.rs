use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

const REGISTRY_SEED: &[u8] = b"registry";
const SKILL_SEED: &[u8] = b"skill";
const SKILL_VERSION_SEED: &[u8] = b"skill_version";
const PLAN_RECEIPT_SEED: &[u8] = b"plan_receipt";
const MEMORY_RECEIPT_SEED: &[u8] = b"memory_receipt";
const PROOF_RECEIPT_SEED: &[u8] = b"proof_receipt";

#[program]
pub mod claw_machine {
    use super::*;

    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
        version: u16,
        config_hash: [u8; 32],
    ) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.bump = ctx.bumps.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.version = version;
        registry.config_hash = config_hash;
        registry.paused = false;
        registry.skill_count = 0;
        registry.plan_count = 0;
        registry.memory_count = 0;
        registry.proof_count = 0;
        registry.created_at = Clock::get()?.unix_timestamp;
        registry.updated_at = registry.created_at;

        emit!(RegistryInitialized {
            authority: registry.authority,
            registry: ctx.accounts.registry.key(),
            version,
            config_hash,
            at: registry.created_at,
        });
        Ok(())
    }

    pub fn create_skill(
        ctx: Context<CreateSkill>,
        skill_seed: [u8; 32],
        content_hash: [u8; 32],
        summary_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let skill = &mut ctx.accounts.skill;
        skill.bump = ctx.bumps.skill;
        skill.registry = ctx.accounts.registry.key();
        skill.authority = ctx.accounts.authority.key();
        skill.skill_seed = skill_seed;
        skill.status = ReceiptStatus::Active;
        skill.current_version = 0;
        skill.content_hash = content_hash;
        skill.summary_hash = summary_hash;
        skill.created_at = now;
        skill.updated_at = now;

        let registry = &mut ctx.accounts.registry;
        registry.skill_count = registry.skill_count.saturating_add(1);
        registry.updated_at = now;

        emit!(SkillCreated {
            authority: skill.authority,
            skill: ctx.accounts.skill.key(),
            skill_seed,
            content_hash,
            at: now,
        });
        Ok(())
    }

    pub fn publish_skill_version(
        ctx: Context<PublishSkillVersion>,
        version: u32,
        version_seed: [u8; 32],
        content_hash: [u8; 32],
    ) -> Result<()> {
        require!(version > 0, ClawError::InvalidVersion);
        let now = Clock::get()?.unix_timestamp;
        let version_account = &mut ctx.accounts.skill_version;
        version_account.bump = ctx.bumps.skill_version;
        version_account.skill = ctx.accounts.skill.key();
        version_account.version = version;
        version_account.version_seed = version_seed;
        version_account.content_hash = content_hash;
        version_account.created_at = now;
        version_account.updated_at = now;
        version_account.status = ReceiptStatus::Active;

        let skill = &mut ctx.accounts.skill;
        skill.current_version = version;
        skill.updated_at = now;

        emit!(SkillVersionPublished {
            skill: ctx.accounts.skill.key(),
            skill_version: ctx.accounts.skill_version.key(),
            version,
            content_hash,
            at: now,
        });
        Ok(())
    }

    pub fn create_plan_receipt(
        ctx: Context<CreatePlanReceipt>,
        plan_seed: [u8; 32],
        plan_hash: [u8; 32],
        summary_hash: [u8; 32],
        step_count: u16,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let receipt = &mut ctx.accounts.plan_receipt;
        receipt.bump = ctx.bumps.plan_receipt;
        receipt.registry = ctx.accounts.registry.key();
        receipt.authority = ctx.accounts.authority.key();
        receipt.plan_seed = plan_seed;
        receipt.plan_hash = plan_hash;
        receipt.summary_hash = summary_hash;
        receipt.step_count = step_count;
        receipt.status = ReceiptStatus::Pending;
        receipt.created_at = now;
        receipt.updated_at = now;

        let registry = &mut ctx.accounts.registry;
        registry.plan_count = registry.plan_count.saturating_add(1);
        registry.updated_at = now;

        emit!(PlanReceiptCreated {
            authority: receipt.authority,
            receipt: ctx.accounts.plan_receipt.key(),
            plan_seed,
            plan_hash,
            at: now,
        });
        Ok(())
    }

    pub fn complete_plan_receipt(
        ctx: Context<CompletePlanReceipt>,
        result_hash: [u8; 32],
        status: ReceiptStatus,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let receipt = &mut ctx.accounts.plan_receipt;
        receipt.result_hash = result_hash;
        receipt.status = status;
        receipt.updated_at = now;

        emit!(PlanReceiptCompleted {
            authority: ctx.accounts.authority.key(),
            receipt: ctx.accounts.plan_receipt.key(),
            status,
            result_hash,
            at: now,
        });
        Ok(())
    }

    pub fn create_memory_receipt(
        ctx: Context<CreateMemoryReceipt>,
        memory_seed: [u8; 32],
        reflection_hash: [u8; 32],
        summary_hash: [u8; 32],
        next_action_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let receipt = &mut ctx.accounts.memory_receipt;
        receipt.bump = ctx.bumps.memory_receipt;
        receipt.registry = ctx.accounts.registry.key();
        receipt.authority = ctx.accounts.authority.key();
        receipt.memory_seed = memory_seed;
        receipt.reflection_hash = reflection_hash;
        receipt.summary_hash = summary_hash;
        receipt.next_action_hash = next_action_hash;
        receipt.status = ReceiptStatus::Pending;
        receipt.created_at = now;
        receipt.updated_at = now;

        let registry = &mut ctx.accounts.registry;
        registry.memory_count = registry.memory_count.saturating_add(1);
        registry.updated_at = now;

        emit!(MemoryReceiptCreated {
            authority: receipt.authority,
            receipt: ctx.accounts.memory_receipt.key(),
            memory_seed,
            reflection_hash,
            at: now,
        });
        Ok(())
    }

    pub fn link_memory_to_next_turn(
        ctx: Context<LinkMemoryToNextTurn>,
        next_turn_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let receipt = &mut ctx.accounts.memory_receipt;
        receipt.next_turn_hash = next_turn_hash;
        receipt.status = ReceiptStatus::Linked;
        receipt.updated_at = now;

        emit!(MemoryLinked {
            receipt: ctx.accounts.memory_receipt.key(),
            next_turn_hash,
            at: now,
        });
        Ok(())
    }

    pub fn create_proof_receipt(
        ctx: Context<CreateProofReceipt>,
        proof_seed: [u8; 32],
        proof_hash: [u8; 32],
        subject_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let proof = &mut ctx.accounts.proof_receipt;
        proof.bump = ctx.bumps.proof_receipt;
        proof.registry = ctx.accounts.registry.key();
        proof.authority = ctx.accounts.authority.key();
        proof.proof_seed = proof_seed;
        proof.proof_hash = proof_hash;
        proof.subject_hash = subject_hash;
        proof.status = ReceiptStatus::Pending;
        proof.created_at = now;
        proof.updated_at = now;

        let registry = &mut ctx.accounts.registry;
        registry.proof_count = registry.proof_count.saturating_add(1);
        registry.updated_at = now;

        emit!(ProofReceiptCreated {
            authority: proof.authority,
            receipt: ctx.accounts.proof_receipt.key(),
            proof_seed,
            proof_hash,
            at: now,
        });
        Ok(())
    }

    pub fn verify_proof_receipt(ctx: Context<VerifyProofReceipt>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let proof = &mut ctx.accounts.proof_receipt;
        proof.status = ReceiptStatus::Verified;
        proof.verified_at = now;
        proof.updated_at = now;
        emit!(ProofReceiptVerified {
            authority: ctx.accounts.authority.key(),
            receipt: ctx.accounts.proof_receipt.key(),
            at: now,
        });
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ReceiptStatus {
    Pending,
    Active,
    Linked,
    Completed,
    Failed,
    Verified,
}

#[account]
pub struct Registry {
    pub bump: u8,
    pub authority: Pubkey,
    pub version: u16,
    pub paused: bool,
    pub config_hash: [u8; 32],
    pub skill_count: u64,
    pub plan_count: u64,
    pub memory_count: u64,
    pub proof_count: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Registry {
    pub const SPACE: usize = 8 + 1 + 32 + 2 + 1 + 32 + 8 + 8 + 8 + 8 + 8 + 8;
}

#[account]
pub struct Skill {
    pub bump: u8,
    pub registry: Pubkey,
    pub authority: Pubkey,
    pub skill_seed: [u8; 32],
    pub current_version: u32,
    pub status: ReceiptStatus,
    pub content_hash: [u8; 32],
    pub summary_hash: [u8; 32],
    pub created_at: i64,
    pub updated_at: i64,
}

impl Skill {
    pub const SPACE: usize = 8 + 1 + 32 + 32 + 32 + 4 + 1 + 32 + 32 + 8 + 8;
}

#[account]
pub struct SkillVersion {
    pub bump: u8,
    pub skill: Pubkey,
    pub version: u32,
    pub version_seed: [u8; 32],
    pub content_hash: [u8; 32],
    pub status: ReceiptStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

impl SkillVersion {
    pub const SPACE: usize = 8 + 1 + 32 + 4 + 32 + 32 + 1 + 8 + 8;
}

#[account]
pub struct PlanReceipt {
    pub bump: u8,
    pub registry: Pubkey,
    pub authority: Pubkey,
    pub plan_seed: [u8; 32],
    pub plan_hash: [u8; 32],
    pub summary_hash: [u8; 32],
    pub result_hash: [u8; 32],
    pub step_count: u16,
    pub status: ReceiptStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

impl PlanReceipt {
    pub const SPACE: usize = 8 + 1 + 32 + 32 + 32 + 32 + 32 + 32 + 2 + 1 + 8 + 8;
}

#[account]
pub struct MemoryReceipt {
    pub bump: u8,
    pub registry: Pubkey,
    pub authority: Pubkey,
    pub memory_seed: [u8; 32],
    pub reflection_hash: [u8; 32],
    pub summary_hash: [u8; 32],
    pub next_action_hash: [u8; 32],
    pub next_turn_hash: [u8; 32],
    pub status: ReceiptStatus,
    pub created_at: i64,
    pub updated_at: i64,
}

impl MemoryReceipt {
    pub const SPACE: usize = 8 + 1 + 32 + 32 + 32 + 32 + 32 + 32 + 1 + 8 + 8;
}

#[account]
pub struct ProofReceipt {
    pub bump: u8,
    pub registry: Pubkey,
    pub authority: Pubkey,
    pub proof_seed: [u8; 32],
    pub proof_hash: [u8; 32],
    pub subject_hash: [u8; 32],
    pub status: ReceiptStatus,
    pub verified_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ProofReceipt {
    pub const SPACE: usize = 8 + 1 + 32 + 32 + 32 + 32 + 1 + 8 + 8 + 8;
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [REGISTRY_SEED],
        bump,
        space = Registry::SPACE
    )]
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(skill_seed: [u8; 32])]
pub struct CreateSkill<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [REGISTRY_SEED],
        bump = registry.bump
    )]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        seeds = [SKILL_SEED, authority.key().as_ref(), &skill_seed],
        bump,
        space = Skill::SPACE
    )]
    pub skill: Account<'info, Skill>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(version_seed: [u8; 32])]
pub struct PublishSkillVersion<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority
    )]
    pub skill: Account<'info, Skill>,
    #[account(
        init,
        payer = authority,
        seeds = [SKILL_VERSION_SEED, skill.key().as_ref(), &version_seed],
        bump,
        space = SkillVersion::SPACE
    )]
    pub skill_version: Account<'info, SkillVersion>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(plan_seed: [u8; 32])]
pub struct CreatePlanReceipt<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [REGISTRY_SEED], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        seeds = [PLAN_RECEIPT_SEED, authority.key().as_ref(), &plan_seed],
        bump,
        space = PlanReceipt::SPACE
    )]
    pub plan_receipt: Account<'info, PlanReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompletePlanReceipt<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub plan_receipt: Account<'info, PlanReceipt>,
}

#[derive(Accounts)]
#[instruction(memory_seed: [u8; 32])]
pub struct CreateMemoryReceipt<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [REGISTRY_SEED], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        seeds = [MEMORY_RECEIPT_SEED, authority.key().as_ref(), &memory_seed],
        bump,
        space = MemoryReceipt::SPACE
    )]
    pub memory_receipt: Account<'info, MemoryReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LinkMemoryToNextTurn<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub memory_receipt: Account<'info, MemoryReceipt>,
}

#[derive(Accounts)]
#[instruction(proof_seed: [u8; 32])]
pub struct CreateProofReceipt<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [REGISTRY_SEED], bump = registry.bump)]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        seeds = [PROOF_RECEIPT_SEED, authority.key().as_ref(), &proof_seed],
        bump,
        space = ProofReceipt::SPACE
    )]
    pub proof_receipt: Account<'info, ProofReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyProofReceipt<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub proof_receipt: Account<'info, ProofReceipt>,
}

#[event]
pub struct RegistryInitialized {
    pub authority: Pubkey,
    pub registry: Pubkey,
    pub version: u16,
    pub config_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct SkillCreated {
    pub authority: Pubkey,
    pub skill: Pubkey,
    pub skill_seed: [u8; 32],
    pub content_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct SkillVersionPublished {
    pub skill: Pubkey,
    pub skill_version: Pubkey,
    pub version: u32,
    pub content_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct PlanReceiptCreated {
    pub authority: Pubkey,
    pub receipt: Pubkey,
    pub plan_seed: [u8; 32],
    pub plan_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct PlanReceiptCompleted {
    pub authority: Pubkey,
    pub receipt: Pubkey,
    pub status: ReceiptStatus,
    pub result_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct MemoryReceiptCreated {
    pub authority: Pubkey,
    pub receipt: Pubkey,
    pub memory_seed: [u8; 32],
    pub reflection_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct MemoryLinked {
    pub receipt: Pubkey,
    pub next_turn_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct ProofReceiptCreated {
    pub authority: Pubkey,
    pub receipt: Pubkey,
    pub proof_seed: [u8; 32],
    pub proof_hash: [u8; 32],
    pub at: i64,
}

#[event]
pub struct ProofReceiptVerified {
    pub authority: Pubkey,
    pub receipt: Pubkey,
    pub at: i64,
}

#[error_code]
pub enum ClawError {
    #[msg("Invalid skill version")]
    InvalidVersion,
}
