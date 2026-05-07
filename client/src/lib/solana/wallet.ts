import type { Connection, PublicKey } from "@solana/web3.js";

export function toWalletAddress(value?: PublicKey | null) {
  return value?.toBase58() || null;
}

export async function loadWalletBalance(connection: Connection, walletAddress?: PublicKey | null) {
  if (!walletAddress) return null;
  const lamports = await connection.getBalance(walletAddress);
  return lamports / 1_000_000_000;
}

export async function loadWalletBalanceLamports(connection: Connection, walletAddress?: PublicKey | null) {
  if (!walletAddress) return 0n;
  const lamports = await connection.getBalance(walletAddress);
  return BigInt(lamports);
}
