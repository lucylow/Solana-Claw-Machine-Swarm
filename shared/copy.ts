import type { SwarmSectionId } from "./swarm";

/** Premium story spine: wallet identity → verified session → execution proof on Solana. */
export const STORY_LOOP_LABELS = [
  "Connect Phantom",
  "Verify session",
  "Choose skill",
  "Build plan",
  "Execute transaction(s)",
  "Create reflection",
  "Write memory",
  "Anchor receipt on Solana",
  "Verify on Solana Explorer",
] as const;

export type StoryLoopLabel = (typeof STORY_LOOP_LABELS)[number];

/** Long-form loop for landing and narrative sections */
export const AGENT_LOOP_STEPS_DETAILED = [
  "Connect Phantom",
  "Discover skill in Solana-native registry",
  "Choose skill and verify autonomy band",
  "Planner emits receipt-linked plan",
  "Execute with policy gates on verified session",
  "Reflect on failure or success",
  "Write durable memory (full artifact in 0G Storage)",
  "Commit lineage root to 0G DA",
  "Anchor compact Solana receipt (+ PDA refs)",
  "Verify Solana Explorer + reconcile 0G sidecar refs",
] as const;

/** Left-rail destinations (merged with icons in `CommandCenterShell`). */
export const COMMAND_SIDE_NAV_ITEMS: Array<{
  id: SwarmSectionId;
  label: string;
  short: string;
}> = [
  { id: "overview", label: "Overview", short: "Ov" },
  { id: "live-run", label: "Live Run", short: "Run" },
  { id: "skills", label: "Skills", short: "Sk" },
  { id: "memory", label: "Memory", short: "Mem" },
  { id: "reflections", label: "Reflections", short: "Rx" },
  { id: "receipts", label: "Receipts", short: "Rc" },
  { id: "proof-explorer", label: "Proof Explorer", short: "Pr" },
  { id: "agents", label: "Agent fleet", short: "Ag" },
  { id: "reputation", label: "Reputation", short: "Rep" },
  { id: "openclaw-bridge", label: "OpenClaw Bridge", short: "OC" },
  { id: "demo-mode", label: "Demo Mode", short: "Dm" },
  { id: "proof-graph", label: "Proof graph", short: "Gr" },
  { id: "zerog-sidecar", label: "0G sidecar", short: "ZG" },
  { id: "settings", label: "Settings", short: "Set" },
];

export const SOLANA_COPY = {
  dashboard: {
    title: "Solana-native agent dApp",
    heroTitle: "Build Solana agents that remember.",
    heroSubtitle:
      "A Claw Machine SWARM frontend for Solana: wallet-signed sessions, autonomous skill execution, durable 0G memory, and explorer-verifiable receipt proofs.",
    topSubtitle:
      "Video-ready Solana dApp: choose a skill, run the agent loop, store reflection in 0G, and anchor compact proof receipts on Solana Explorer.",
  },
  navigation: {
    backCommandCenter: "Back to dApp dashboard",
    landing: "Open Solana landing →",
  },
  wallet: {
    panelTitle: "Phantom wallet",
    lifecycleTitle: "Phantom session",
    connect: "Connect Phantom",
    connectVerify: "Connect Phantom + sign session",
    refreshSession: "Refresh verified session",
    refreshSignedSession: "Refresh signed Solana session",
    copyAddress: "Copy wallet address",
    explorerAccount: "Open on Solana Explorer",
    explorerTx: "Open on Solana Explorer (tx)",
    sessionVerifiedChip: "Session verified",
    balanceLabel: "Solana balance",
    latestSignature: "Latest Solana tx signature",
    connectionState: "Adapter state",
    notConnected: "Phantom not connected",
    offlineChip: "Phantom offline",
    wrongCluster: "Wrong Solana cluster",
    clusterBadge: "Solana cluster",
    clusterRpcTitle: "Cluster RPC (server probe)",
    identityLayerNote:
      "Identity: wallet adapter pubkey · Session: backend-verified bearer",
    permissionsTitle: "Solana program permissions",
    toastAddressCopied: "Phantom address copied",
    refreshSolBalance: "Refresh Solana balance",
    clearCachedSession: "Clear cached Solana session",
    signSolanaSessionAgain: "Sign Solana session again",
  },
  walletLifecycle: {
    disconnected: "Disconnected",
    connecting: "Connecting Phantom",
    connected: "Connected",
    signing: "Signing Solana session",
    sessionVerifying: "Verifying Solana session",
    sessionVerified: "Session verified",
    wrongCluster: "Wrong Solana cluster",
    balanceLoading: "Loading Solana balance",
    ready: "Ready",
    error: "Error",
  },
  story: {
    connectWalletFirst: "Connect Phantom first.",
    connectForReceipts:
      "Connect Phantom to bind session scope and anchor Solana receipts to your address.",
  },
  receipts: {
    panelTitle: "Recent Solana receipts",
    empty:
      "Solana-anchored receipts appear here after skills run, execution settles, and proofs land on your cluster.",
    explorerVerifiable: "Explorer-verifiable on Solana",
  },
  proof: {
    anchored: "Solana proof anchored",
    pending: "Solana proof pending",
  },
  session: {
    sessionStatus: "Session status",
    verifiedSession: "verified session",
    sessionOpen: "session pending verification",
  },
  skillRegistry: {
    publishConsoleTitle: "Solana-native skill registry",
    backLabel: "Back to dApp dashboard",
    capabilityHint: "Published skill assets · provenance + reputation",
  },
  explorer: {
    pageTitle: "Solana proof explorer",
    pageSubtitle: "Solana Explorer–linked agent receipts and proof objects",
  },
} as const;
