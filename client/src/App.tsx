import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletContext";
import SolanaProvider from "@/solana/SolanaProvider";
import { Route, Switch } from "wouter";
import { AppErrorBoundary } from "./errors/AppErrorBoundary";
import { ErrorSurfaceProvider } from "./errors/ErrorSurfaceContext";
import { GlobalErrorBanner } from "./errors/ErrorUiKit";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import DemoCenterPage from "./pages/DemoCenterPage";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import PlanDetailPage from "./pages/PlanDetailPage";
import ProofExplorerPage from "./pages/ProofExplorerPage";
import ReceiptsPage from "./pages/ReceiptsPage";
import SkillDetailPage from "./pages/SkillDetailPage";
import SkillsRegistry from "./pages/SkillsRegistry";
import NftPage from "./pages/NftPage";
import DaoPage from "./pages/DaoPage";
import DaoProposalPage from "./pages/DaoProposalPage";
import ZeroGPage from "./pages/ZeroGPage";
import OnchainPage from "./pages/OnchainPage";
import SubmissionPage from "./pages/SubmissionPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/submission" component={SubmissionPage} />
      <Route path="/skills" component={SkillsRegistry} />
      <Route path="/skills/:id" component={SkillDetailPage} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route path="/onchain" component={OnchainPage} />
      <Route path="/proofs" component={ProofExplorerPage} />
      <Route path="/zerog" component={ZeroGPage} />
      <Route path="/nft" component={NftPage} />
      <Route path="/dao/proposals/:id" component={DaoProposalPage} />
      <Route path="/dao" component={DaoPage} />
      <Route path="/demo/*?" component={DemoCenterPage} />
      <Route path="/plans/:id" component={PlanDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ErrorSurfaceProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <SolanaProvider>
              <SolanaWalletProvider>
                <Toaster />
                <GlobalErrorBanner />
                <Router />
              </SolanaWalletProvider>
            </SolanaProvider>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorSurfaceProvider>
    </AppErrorBoundary>
  );
}
