import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/components/WalletProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Perps from "@/pages/perps";
import Apply from "@/pages/apply";
import Admin from "@/pages/admin";
import Dev88 from "@/pages/dev88";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/perps" component={Perps} />
      <Route path="/apply" component={Apply} />
      <Route path="/admin/:tokenId" component={Admin} />
      <Route path="/dev88" component={Dev88} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
