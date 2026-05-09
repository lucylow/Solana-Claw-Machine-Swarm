export type NftKind =
  | "badge"
  | "membership"
  | "achievement"
  | "receipt"
  | "collectible";

export interface NftCollectionState {
  name: string;
  symbol: string;
  uri: string;
  description: string;
  maxSupply: number;
  totalMinted: number;
  frozen: boolean;
  createdAt: number;
  updatedAt: number;
  collectionMint?: string;
}

export interface CreateNftCollectionRequest {
  name: string;
  symbol: string;
  uri: string;
  description: string;
  maxSupply: number;
}

export interface CreateNftRequest {
  owner: string;
  name: string;
  symbol: string;
  uri: string;
  description: string;
  nftType: NftKind;
  tags: string[];
}

export interface NftMintRecord {
  mint: string;
  owner: string;
  collectionMint: string;
  nftType: NftKind;
  name: string;
  symbol: string;
  uri: string;
  description: string;
  tags: string[];
  txSig?: string;
  createdAt: number;
}
