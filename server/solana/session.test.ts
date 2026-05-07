import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { SolanaSessionService } from "./session";

describe("SolanaSessionService", () => {
  it("issues nonce and verifies wallet signature", () => {
    const keypair = Keypair.generate();
    const service = new SolanaSessionService({ cluster: "devnet", productName: "Test" });
    const nonce = service.issueNonce(keypair.publicKey.toBase58());
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    const verified = service.verifySession({
      walletAddress: keypair.publicKey.toBase58(),
      nonceId: nonce.nonceId,
      signature: bs58.encode(signature),
    });

    expect(verified.token).toBeTruthy();
    expect(verified.profile.walletAddress).toBe(keypair.publicKey.toBase58());
    expect(service.getSessionFromToken(verified.token)?.walletAddress).toBe(keypair.publicKey.toBase58());
  });

  it("rejects invalid signatures", () => {
    const keypair = Keypair.generate();
    const other = Keypair.generate();
    const service = new SolanaSessionService({ cluster: "devnet", productName: "Test" });
    const nonce = service.issueNonce(keypair.publicKey.toBase58());
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, other.secretKey);

    expect(() =>
      service.verifySession({
        walletAddress: keypair.publicKey.toBase58(),
        nonceId: nonce.nonceId,
        signature: bs58.encode(signature),
      })
    ).toThrow("session_signature_invalid");
  });
});
