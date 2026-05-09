export type CircuitServiceKey =
  | "solana_rpc"
  | "zerog_storage"
  | "zerog_da"
  | "openclaw"
  | "database"
  | "indexer";

interface CircuitState {
  failures: number;
  openUntil: number;
  halfOpen: boolean;
}

const DEFAULT_THRESHOLD = 4;
const DEFAULT_COOLDOWN_MS = 30_000;

const circuits = new Map<CircuitServiceKey, CircuitState>();

function getState(key: CircuitServiceKey): CircuitState {
  let s = circuits.get(key);
  if (!s) {
    s = { failures: 0, openUntil: 0, halfOpen: false };
    circuits.set(key, s);
  }
  return s;
}

export function isCircuitOpen(
  key: CircuitServiceKey,
  now = Date.now(),
): boolean {
  const s = getState(key);
  if (s.openUntil > now) return true;
  if (s.openUntil > 0 && s.openUntil <= now) {
    s.halfOpen = true;
    s.openUntil = 0;
  }
  return false;
}

export function recordCircuitSuccess(key: CircuitServiceKey) {
  const s = getState(key);
  s.failures = 0;
  s.halfOpen = false;
  s.openUntil = 0;
}

export function recordCircuitFailure(
  key: CircuitServiceKey,
  threshold = DEFAULT_THRESHOLD,
) {
  const s = getState(key);
  s.failures += 1;
  if (s.failures >= threshold) {
    s.openUntil = Date.now() + DEFAULT_COOLDOWN_MS;
    s.halfOpen = false;
  }
}

export function circuitBreakerAllowOrThrow(key: CircuitServiceKey): void {
  if (isCircuitOpen(key)) {
    throw new Error(`${key}_circuit_open`);
  }
}
