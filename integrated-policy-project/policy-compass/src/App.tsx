import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import PolicyReport from "./pages/PolicyReport";
import PolicyReportCreate from "./pages/PolicyReportCreate";
import PolicyReportDetail from "./pages/PolicyReportDetail";
import EffectDashboard from "./pages/EffectDashboard";
import EnterpriseEvaluation from "./pages/EnterpriseEvaluation";
import EnterpriseEvaluationDetail from "./pages/EnterpriseEvaluationDetail";
import PolicyEvaluation from "./pages/PolicyEvaluation";
import PolicyAnalysis from "./pages/PolicyAnalysis";
import PolicyWriting from "./pages/PolicyWriting";
import PolicyReach from "./pages/PolicyReach";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/policy-writing" element={<PolicyWriting />} />
            <Route path="/policy-report" element={<PolicyReport />} />
            <Route path="/policy-report/create" element={<PolicyReportCreate />} />
            <Route path="/policy-report/:id" element={<PolicyReportDetail />} />
            <Route path="/effect-dashboard" element={<EffectDashboard />} />
            <Route path="/enterprise-evaluation" element={<EnterpriseEvaluation />} />
            <Route path="/enterprise-evaluation/:id" element={<EnterpriseEvaluationDetail />} />
            <Route path="/policy-evaluation" element={<PolicyEvaluation />} />
            <Route path="/policy-analysis" element={<PolicyAnalysis />} />
            <Route path="/policy-reach" element={<PolicyReach />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
