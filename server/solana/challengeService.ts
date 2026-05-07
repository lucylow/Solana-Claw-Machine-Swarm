import crypto from "crypto";
import type { IdentityChallengeRecord } from "./identityTypes";

export function buildNonce() {
  return `claw_${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;
}

export function buildChallengeMessage(input: {
  domain: string;
  uri: string;
  walletAddress: string;
  chainId: number;
  statement: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  requestId: string;
}) {
  return [
    `${input.domain} wants you to sign in with your Solana account:`,
    input.walletAddress,
    "",
    input.statement,
    "",
    `URI: ${input.uri}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
    `Expiration Time: ${input.expirationTime}`,
    `Request ID: ${input.requestId}`,
  ].join("\n");
}

export function createChallengeRecord(input: {
  walletAddress: string;
  domain: string;
  uri: string;
  statement: string;
  chainId: number;
  requestId: string;
  ttlMs?: number;
}) {
  const now = Date.now();
  const ttl = input.ttlMs ?? 1000 * 60 * 10;
  const nonce = buildNonce();
  const issuedAt = new Date(now).toISOString();
  const expirationTime = new Date(now + ttl).toISOString();

  const record: IdentityChallengeRecord = {
    id: `chal_${crypto.randomUUID().replace(/-/g, "")}`,
    walletAddress: input.walletAddress,
    domain: input.domain,
    uri: input.uri,
    statement: input.statement,
    nonce,
    issuedAt,
    expirationTime,
    chainId: input.chainId,
    requestId: input.requestId,
    message: buildChallengeMessage({
      domain: input.domain,
      uri: input.uri,
      walletAddress: input.walletAddress,
      chainId: input.chainId,
      statement: input.statement,
      nonce,
      issuedAt,
      expirationTime,
      requestId: input.requestId,
    }),
    status: "challenge_issued",
  };

  return record;
}

export function isChallengeExpired(challenge: IdentityChallengeRecord) {
  return Date.parse(challenge.expirationTime) < Date.now();
}
