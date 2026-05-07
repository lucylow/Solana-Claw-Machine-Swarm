import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SolanaProvider from "@/solana/SolanaProvider";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import ReceiptsPage from "./pages/ReceiptsPage";
import SkillDetailPage from "./pages/SkillDetailPage";
import SkillsRegistry from "./pages/SkillsRegistry";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/skills" component={SkillsRegistry} />
      <Route path="/skills/:id" component={SkillDetailPage} />
      <Route path="/receipts" component={ReceiptsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SolanaProvider>
            <Toaster />
            <Router />
          </SolanaProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
