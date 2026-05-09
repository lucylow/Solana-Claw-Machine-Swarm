import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { SolanaSessionService } from "./session";

describe("SolanaSessionService", () => {
  it("issues nonce and verifies wallet signature", () => {
    const keypair = Keypair.generate();
    const service = new SolanaSessionService({
      cluster: "devnet",
      productName: "Test",
    });
    const nonce = service.issueNonce(keypair.publicKey.toBase58(), "devnet");
    expect(nonce.sessionId).toBe(nonce.nonceId);
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    const verified = service.verifySession({
      walletAddress: keypair.publicKey.toBase58(),
      nonceId: nonce.nonceId,
      signature: bs58.encode(signature),
      cluster: "devnet",
      message: nonce.message,
    });

    expect(verified.token).toBeTruthy();
    expect(verified.profile.walletAddress).toBe(keypair.publicKey.toBase58());
    expect(service.getSessionFromToken(verified.token)?.walletAddress).toBe(
      keypair.publicKey.toBase58(),
    );
  });

  it("rejects invalid signatures", () => {
    const keypair = Keypair.generate();
    const other = Keypair.generate();
    const service = new SolanaSessionService({
      cluster: "devnet",
      productName: "Test",
    });
    const nonce = service.issueNonce(keypair.publicKey.toBase58(), "devnet");
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, other.secretKey);

    expect(() =>
      service.verifySession({
        walletAddress: keypair.publicKey.toBase58(),
        nonceId: nonce.nonceId,
        signature: bs58.encode(signature),
        cluster: "devnet",
        message: nonce.message,
      }),
    ).toThrow("session_signature_invalid");
  });

  it("rejects cluster mismatch on nonce issuance", () => {
    const service = new SolanaSessionService({
      cluster: "devnet",
      productName: "Test",
    });
    expect(() =>
      service.issueNonce(
        Keypair.generate().publicKey.toBase58(),
        "mainnet-beta",
      ),
    ).toThrow("solana_cluster_mismatch");
  });

  it("rejects cluster mismatch on verify", () => {
    const keypair = Keypair.generate();
    const service = new SolanaSessionService({
      cluster: "devnet",
      productName: "Test",
    });
    const nonce = service.issueNonce(keypair.publicKey.toBase58(), "devnet");
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    expect(() =>
      service.verifySession({
        walletAddress: keypair.publicKey.toBase58(),
        nonceId: nonce.nonceId,
        signature: bs58.encode(signature),
        cluster: "mainnet-beta",
        message: nonce.message,
      }),
    ).toThrow("solana_cluster_mismatch");
  });

  it("rejects tampered message payload", () => {
    const keypair = Keypair.generate();
    const service = new SolanaSessionService({
      cluster: "devnet",
      productName: "Test",
    });
    const nonce = service.issueNonce(keypair.publicKey.toBase58(), "devnet");
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    expect(() =>
      service.verifySession({
        walletAddress: keypair.publicKey.toBase58(),
        nonceId: nonce.nonceId,
        signature: bs58.encode(signature),
        cluster: "devnet",
        message: `${nonce.message}\n`,
      }),
    ).toThrow("session_message_mismatch");
  });
});
