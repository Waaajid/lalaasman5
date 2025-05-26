
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuizProvider } from "./context/QuizContext";
import Index from "./pages/Index";
import Quiz from "./pages/Quiz";
import TeamSelection from "./pages/TeamSelection";
import TeamView from "./pages/TeamView";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import DiceRollPage from "./pages/DiceRollPage";
import HostDashboard from "./pages/HostDashboard";
import ScratchCard from "./pages/ScratchCard";
import Instructions from "./pages/Instructions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <QuizProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/team-selection" element={<TeamSelection />} />
            <Route path="/team-view" element={<TeamView />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/dice-roll" element={<DiceRollPage />} />
            <Route path="/host-dashboard" element={<HostDashboard />} />
            <Route path="/scratch-card" element={<ScratchCard />} />
            <Route path="/instructions" element={<Instructions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QuizProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
