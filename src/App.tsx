import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import ParticipantsPage from "./pages/ParticipantsPage";
import TournamentPage from "./pages/TournamentPage";
import StandingsPage from "./pages/StandingsPage";
import TournamentPublicPage from './pages/TournamentPublicPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const BASENAME = import.meta.env.DEV ? "/" : "/poke-swiss-champions";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={BASENAME}>
          <Routes>
            <Route path="/" element={<Layout><ParticipantsPage /></Layout>} />
            <Route path="/tournament" element={<Layout><TournamentPage /></Layout>} />
            <Route path="/standings" element={<Layout><StandingsPage /></Layout>} />
            <Route path="/public" element={<Layout><TournamentPublicPage /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
