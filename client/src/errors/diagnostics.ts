const KEY = "claw_diagnostics";

export function isDiagnosticsMode(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(KEY) === "1" || new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
}

export function setDiagnosticsMode(on: boolean) {
  try {
    if (typeof window === "undefined") return;
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
