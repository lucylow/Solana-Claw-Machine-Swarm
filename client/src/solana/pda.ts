import { PublicKey } from "@solana/web3.js";
import { CLAW_ONCHAIN_PROGRAM_ID } from "./constants";

const CONFIG_SEED = "config";
const PROFILE_SEED = "profile";
const SKILL_SEED = "skill";
const SKILL_VERSION_SEED = "skill_version";
const DEFAULT_PROGRAM_ID = "ClAwOnChAin11111111111111111111111111111111";

function programKey(programId?: string) {
  const value = (
    programId ||
    CLAW_ONCHAIN_PROGRAM_ID ||
    DEFAULT_PROGRAM_ID
  ).trim();
  try {
    return new PublicKey(value);
  } catch {
    throw new Error("Invalid Solana program id");
  }
}

export function normalizeWalletAddress(input: PublicKey | string) {
  if (input instanceof PublicKey) return input.toBase58();
  const value = String(input || "").trim();
  if (!value) throw new Error("Wallet address is required");
  try {
    return new PublicKey(value).toBase58();
  } catch {
    throw new Error("Invalid wallet address");
  }
}

export function deriveConfigPda(programId?: string) {
  const pid = programKey(programId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    pid,
  );
  return pda.toBase58();
}

export function deriveProfilePda(
  walletAddress: PublicKey | string,
  programId?: string,
) {
  const pid = programKey(programId);
  const wallet = new PublicKey(normalizeWalletAddress(walletAddress));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PROFILE_SEED), wallet.toBuffer()],
    pid,
  );
  return pda.toBase58();
}

export function deriveSkillPda(
  walletAddress: PublicKey | string,
  slug: string,
  programId?: string,
) {
  const pid = programKey(programId);
  const wallet = new PublicKey(normalizeWalletAddress(walletAddress));
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SKILL_SEED),
      wallet.toBuffer(),
      Buffer.from(String(slug).trim().toLowerCase()),
    ],
    pid,
  );
  return pda.toBase58();
}

export function deriveSkillVersionPda(
  walletAddress: PublicKey | string,
  slug: string,
  version: string,
  programId?: string,
) {
  const pid = programKey(programId);
  const skill = new PublicKey(deriveSkillPda(walletAddress, slug, programId));
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(SKILL_VERSION_SEED),
      skill.toBuffer(),
      Buffer.from(String(version).trim()),
    ],
    pid,
  );
  return pda.toBase58();
}
