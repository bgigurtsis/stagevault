
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { RecordingContextProvider } from "./hooks/useRecordingContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Performances from "./pages/Performances";
import PerformanceDetail from "./pages/PerformanceDetail";
import PerformanceNew from "./pages/PerformanceNew";
import PerformanceEdit from "./pages/PerformanceEdit";
import Rehearsals from "./pages/Rehearsals";
import RehearsalDetail from "./pages/RehearsalDetail";
import RehearsalNew from "./pages/RehearsalNew";
import RehearsalEdit from "./pages/RehearsalEdit";
import Record from "./pages/Record";
import NotFound from "./pages/NotFound";
import Recordings from "./pages/Recordings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RecordingContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/performances" element={<Performances />} />
                <Route path="/performances/new" element={<PerformanceNew />} />
                <Route path="/performances/:performanceId" element={<PerformanceDetail />} />
                <Route path="/performances/:performanceId/edit" element={<PerformanceEdit />} />
                <Route path="/rehearsals" element={<Rehearsals />} />
                <Route path="/rehearsals/new" element={<RehearsalNew />} />
                <Route path="/rehearsals/:rehearsalId" element={<RehearsalDetail />} />
                <Route path="/rehearsals/:rehearsalId/edit" element={<RehearsalEdit />} />
                <Route path="/recordings" element={<Recordings />} />
                <Route path="/record" element={<Record />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RecordingContextProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
