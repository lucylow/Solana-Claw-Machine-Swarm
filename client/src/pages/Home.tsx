import { useAuth } from "@/_core/hooks/useAuth";
import SwarmLanding from "@/components/swarm/SwarmLanding";

/**
 * Landing is Solana-first: wallet session is primary identity.
 * OAuth (`useAuth`) loads in the background for optional account binding only.
 */
export default function Home() {
  const { isAuthenticated } = useAuth();
  return <SwarmLanding isAuthenticated={isAuthenticated} />;
}
