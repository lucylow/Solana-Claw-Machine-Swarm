import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { NftKind } from "@shared/nft/types";

/** PDAs use the collection config account address (see on-chain `seeds = [b"claw-collection"]`). */
export class ClawNftClient {
  readonly program: anchor.Program;
  readonly programId: PublicKey;

  constructor(programId: string, idl: Idl, provider: anchor.AnchorProvider) {
    this.programId = new PublicKey(programId);
    const idlWithAddress = { ...idl, address: programId } as Idl;
    this.program = new anchor.Program(idlWithAddress, provider);
  }

  deriveCollectionConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("claw-collection")],
      this.programId,
    );
  }

  deriveMintAuthorityPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("claw-mint-authority")],
      this.programId,
    );
  }

  /** `collectionConfig` is the `NftCollectionConfig` PDA, not the collection mint. */
  deriveReceiptPda(
    collectionConfig: PublicKey,
    mint: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("claw-nft-receipt"),
        collectionConfig.toBuffer(),
        mint.toBuffer(),
      ],
      this.programId,
    );
  }

  deriveMintStatePda(
    collectionConfig: PublicKey,
    mint: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("claw-nft"), collectionConfig.toBuffer(), mint.toBuffer()],
      this.programId,
    );
  }

  async initializeCollection(args: {
    payer: PublicKey;
    collectionMint: PublicKey;
    collectionMetadata: PublicKey;
    collectionMasterEdition: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    description: string;
    maxSupply: number;
  }) {
    const [collectionConfig] = this.deriveCollectionConfigPda();
    const [mintAuthority] = this.deriveMintAuthorityPda();

    return this.program.methods
      .initializeCollection(
        args.name,
        args.symbol,
        args.uri,
        args.description,
        new anchor.BN(args.maxSupply),
      )
      .accounts({
        collectionConfig,
        collectionMint: args.collectionMint,
        mintAuthority,
        collectionMetadata: args.collectionMetadata,
        collectionMasterEdition: args.collectionMasterEdition,
        authority: args.payer,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        ),
      })
      .rpc();
  }

  /**
   * Pass `nftType` in Anchor enum form, e.g. `{ badge: {} }`, matching the generated IDL
   * (strings like `"badge"` are not accepted by every Anchor version).
   */
  async mintNft(args: {
    payer: PublicKey;
    owner: PublicKey;
    mint: PublicKey;
    metadata: PublicKey;
    masterEdition: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    description: string;
    nftType: NftKind | Record<string, Record<string, never>>;
    tags: string[];
  }) {
    const [collectionConfig] = this.deriveCollectionConfigPda();
    const [mintAuthority] = this.deriveMintAuthorityPda();
    const [receipt] = this.deriveReceiptPda(collectionConfig, args.mint);
    const [mintState] = this.deriveMintStatePda(collectionConfig, args.mint);

    return this.program.methods
      .mintNft(
        args.name,
        args.symbol,
        args.uri,
        args.description,
        args.nftType as never,
        args.tags,
      )
      .accounts({
        collectionConfig,
        mintState,
        mint: args.mint,
        mintAuthority,
        ownerAta: anchor.utils.token.associatedAddress({
          mint: args.mint,
          owner: args.owner,
        }),
        owner: args.owner,
        metadata: args.metadata,
        masterEdition: args.masterEdition,
        receipt,
        payer: args.payer,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenMetadataProgram: new PublicKey(
          "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
        ),
      })
      .rpc();
  }

  async freezeCollection(authority: PublicKey) {
    const [collectionConfig] = this.deriveCollectionConfigPda();
    return this.program.methods
      .freezeCollection()
      .accounts({
        collectionConfig,
        authority,
      })
      .rpc();
  }

  async recordReceipt(args: {
    receipt: PublicKey;
    authority: PublicKey;
    txSig: string;
  }) {
    return this.program.methods
      .recordReceipt(args.txSig)
      .accounts({
        receipt: args.receipt,
        authority: args.authority,
      })
      .rpc();
  }
}
