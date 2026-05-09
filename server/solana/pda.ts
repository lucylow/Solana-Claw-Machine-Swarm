import { PublicKey } from "@solana/web3.js";

const CONFIG_SEED = "config";
const PROFILE_SEED = "profile";
const SKILL_SEED = "skill";
const SKILL_VERSION_SEED = "skill_version";

const MAX_SLUG_LEN = 64;
const MAX_VERSION_LEN = 24;
const DEFAULT_PROGRAM_ID = "11111111111111111111111111111111";

function toProgramId(programId?: string) {
  const value = (
    programId ||
    process.env.SOLANA_PROGRAM_ID ||
    DEFAULT_PROGRAM_ID
  ).trim();
  try {
    return new PublicKey(value);
  } catch {
    throw new Error("Invalid Solana program id");
  }
}

export function normalizeWalletAddress(input: string) {
  const value = String(input || "").trim();
  if (!value) throw new Error("walletAddress required");
  try {
    return new PublicKey(value).toBase58();
  } catch {
    throw new Error("Invalid wallet address");
  }
}

export function validateSkillSlug(slug: string) {
  const value = String(slug || "")
    .trim()
    .toLowerCase();
  if (!value) throw new Error("skill slug required");
  if (value.length > MAX_SLUG_LEN) throw new Error("skill slug too long");
  if (!/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/.test(value)) {
    throw new Error("skill slug must be lowercase alphanumeric with - or _");
  }
  return value;
}

export function validateSkillVersion(version: string) {
  const value = String(version || "").trim();
  if (!value) throw new Error("version required");
  if (value.length > MAX_VERSION_LEN) throw new Error("version too long");
  if (!/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error("version must use semver format");
  }
  return value;
}

export function deriveConfigPda(programId?: string) {
  const pid = toProgramId(programId);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    pid,
  );
  return address.toBase58();
}

export function deriveProfilePda(walletAddress: string, programId?: string) {
  const pid = toProgramId(programId);
  const owner = new PublicKey(normalizeWalletAddress(walletAddress));
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PROFILE_SEED), owner.toBuffer()],
    pid,
  );
  return address.toBase58();
}

export function deriveSkillPda(
  walletAddress: string,
  slug: string,
  programId?: string,
) {
  const pid = toProgramId(programId);
  const owner = new PublicKey(normalizeWalletAddress(walletAddress));
  const normalizedSlug = validateSkillSlug(slug);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(SKILL_SEED), owner.toBuffer(), Buffer.from(normalizedSlug)],
    pid,
  );
  return address.toBase58();
}

export function deriveSkillVersionPda(
  walletAddress: string,
  slug: string,
  version: string,
  programId?: string,
) {
  const pid = toProgramId(programId);
  const skillPda = new PublicKey(
    deriveSkillPda(walletAddress, slug, programId),
  );
  const normalizedVersion = validateSkillVersion(version);
  const [address] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SKILL_VERSION_SEED),
      skillPda.toBuffer(),
      Buffer.from(normalizedVersion),
    ],
    pid,
  );
  return address.toBase58();
}

export function deriveIdentityPdas(input: {
  walletAddress: string;
  skillSlug?: string;
  version?: string;
  programId?: string;
}) {
  const normalizedWallet = normalizeWalletAddress(input.walletAddress);
  const config = deriveConfigPda(input.programId);
  const profile = deriveProfilePda(normalizedWallet, input.programId);

  const skill =
    input.skillSlug != null
      ? deriveSkillPda(normalizedWallet, input.skillSlug, input.programId)
      : undefined;

  const skillVersion =
    input.skillSlug != null && input.version != null
      ? deriveSkillVersionPda(
          normalizedWallet,
          input.skillSlug,
          input.version,
          input.programId,
        )
      : undefined;

  return {
    config,
    profile,
    skill,
    skillVersion,
  };
}
