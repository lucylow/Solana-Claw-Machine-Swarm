import type { ZeroGHealthStatus } from "@shared/zerog";
import { getZeroGConfig } from "./config";
import type { ZeroGBridgeAdapter, ZeroGComputeAdapter, ZeroGDataAvailabilityAdapter, ZeroGStorageAdapter } from "./types";

async function probeUrl(url: string, timeoutMs: number): Promise<{ ok: boolean; latencyMs: number }> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    return { ok: res.ok || (res.status >= 200 && res.status < 500), latencyMs: Date.now() - started };
  } catch {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
      clearTimeout(timer);
      return { ok: res.ok || (res.status >= 200 && res.status < 500), latencyMs: Date.now() - started };
    } catch {
      return { ok: false, latencyMs: Date.now() - started };
    }
  }
}

function mergeProbe(base: ZeroGHealthStatus, probe: { ok: boolean; latencyMs: number }): ZeroGHealthStatus {
  return {
    ...base,
    latencyMs: probe.latencyMs,
    remoteReachable: probe.ok,
    ok: base.ok && probe.ok,
    reason: !base.ok ? base.reason : !probe.ok ? "zerog_remote_unreachable" : undefined,
  };
}

export async function getZeroGHealth(input: {
  storage: ZeroGStorageAdapter;
  compute: ZeroGComputeAdapter;
  da: ZeroGDataAvailabilityAdapter;
  bridge: ZeroGBridgeAdapter;
}) {
  const config = getZeroGConfig();
  const skipRemote =
    process.env.ZEROG_SKIP_REMOTE_PROBE === "true" ||
    !config.enabled ||
    (config.mode !== "live" && process.env.ZEROG_REMOTE_PROBE !== "true");

  const [storageBase, computeBase, daBase, bridge] = await Promise.all([
    input.storage.getHealth(),
    input.compute.getHealth(),
    input.da.getHealth(),
    input.bridge.getHealth(),
  ]);

  let storage = storageBase;
  let compute = computeBase;
  let da = daBase;

  if (!skipRemote) {
    const t = Math.min(config.timeoutMs, 4_000);
    const [ps, pc, pd] = await Promise.all([
      probeUrl(config.storageUrl, t),
      probeUrl(config.computeUrl, t),
      probeUrl(config.dataAvailabilityUrl, t),
    ]);
    storage = mergeProbe(storageBase, ps);
    compute = mergeProbe(computeBase, pc);
    da = mergeProbe(daBase, pd);
  }

  const ok = storage.ok && compute.ok && da.ok && bridge.ok;

  return {
    ok,
    config,
    mode: config.mode,
    storage,
    compute,
    da,
    bridge,
    remoteProbesSkipped: skipRemote,
    statusLabel: !config.enabled
      ? "0G unavailable"
      : config.mode === "demo"
        ? "0G demo mode"
        : ok
          ? "0G live"
          : "0G degraded",
  };
}
