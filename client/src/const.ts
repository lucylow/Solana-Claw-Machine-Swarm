export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID ?? "local-solana-preview";
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const redirectUri = `${origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Video-demo builds often run without the Manus OAuth portal env var.
  // Never throw during render; fall back to a local callback URL so routes such
  // as /dashboard remain usable for SWARM judging and screen recording.
  if (!oauthPortalUrl) {
    const fallback = new URL("/api/oauth/callback", origin);
    fallback.searchParams.set("appId", appId);
    fallback.searchParams.set("redirectUri", redirectUri);
    fallback.searchParams.set("state", state);
    fallback.searchParams.set("type", "signIn");
    return fallback.toString();
  }

  const url = new URL("/app-auth", oauthPortalUrl);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
