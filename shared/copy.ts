import type { SwarmSectionId } from "./swarm";

/** Premium story spine: wallet identity → verified session → execution proof on Solana. */
export const STORY_LOOP_LABELS = [
  "Connect Solana wallet",
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
  "Connect Solana wallet",
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
    title: "Solana-native agent command center",
    heroTitle: "Solana-native agents with explorer-verifiable receipts",
    heroSubtitle:
      "Connect a Solana wallet, choose a published skill, and watch the agent plan, execute, reflect, write memory, and anchor evidence you can verify on Solana Explorer.",
    topSubtitle:
      "Solana wallet session for identity and compact receipts; full reflection and plan bodies live in 0G Storage; append-only batch roots and lineage land in 0G DA before Solana Explorer verification.",
  },
  navigation: {
    backCommandCenter: "Back to command center",
    landing: "← Landing",
  },
  wallet: {
    panelTitle: "Solana wallet",
    lifecycleTitle: "Solana wallet session",
    connect: "Connect Solana wallet",
    connectVerify: "Connect Solana wallet + sign session",
    refreshSession: "Refresh verified session",
    refreshSignedSession: "Refresh signed Solana session",
    copyAddress: "Copy wallet address",
    explorerAccount: "Open on Solana Explorer",
    explorerTx: "Open on Solana Explorer (tx)",
    sessionVerifiedChip: "Session verified",
    balanceLabel: "Solana balance",
    latestSignature: "Latest Solana tx signature",
    connectionState: "Adapter state",
    notConnected: "Solana wallet not connected",
    offlineChip: "Solana wallet offline",
    wrongCluster: "Wrong Solana cluster",
    clusterBadge: "Solana cluster",
    clusterRpcTitle: "Cluster RPC (server probe)",
    identityLayerNote: "Identity: wallet adapter pubkey · Session: backend-verified bearer",
    permissionsTitle: "Solana program permissions",
    toastAddressCopied: "Solana wallet address copied",
    refreshSolBalance: "Refresh Solana balance",
    clearCachedSession: "Clear cached Solana session",
    signSolanaSessionAgain: "Sign Solana session again",
  },
  walletLifecycle: {
    disconnected: "Disconnected",
    connecting: "Connecting Solana wallet",
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
    connectWalletFirst: "Connect a Solana wallet first.",
    connectForReceipts:
      "Connect a Solana wallet to bind session scope and anchor Solana receipts to your address.",
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
    backLabel: "Back to command center",
    capabilityHint: "Published skill assets · provenance + reputation",
  },
  explorer: {
    pageTitle: "Solana proof explorer",
    pageSubtitle: "Solana Explorer–linked agent receipts and proof objects",
  },
} as const;
