
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Performances from "./pages/Performances";
import PerformanceDetail from "./pages/PerformanceDetail";
import Rehearsals from "./pages/Rehearsals";
import RehearsalDetail from "./pages/RehearsalDetail";
import Record from "./pages/Record";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/performances" element={<Performances />} />
              <Route path="/performances/:performanceId" element={<PerformanceDetail />} />
              <Route path="/rehearsals" element={<Rehearsals />} />
              <Route path="/rehearsals/:rehearsalId" element={<RehearsalDetail />} />
              <Route path="/record" element={<Record />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
