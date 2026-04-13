import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import HomePage from "./pages/HomePage";
import BrainChatPage from "./pages/BrainChatPage";
import Index from "./pages/Index";
import PolicyReport from "./pages/PolicyReport";
import PolicyReportCreate from "./pages/PolicyReportCreate";
import PolicyReportDetail from "./pages/PolicyReportDetail";
import EffectDashboard from "./pages/EffectDashboard";
import EnterpriseEvaluation from "./pages/EnterpriseEvaluation";
import EnterpriseEvaluationDetail from "./pages/EnterpriseEvaluationDetail";
import PolicyEvaluation from "./pages/PolicyEvaluation";
import PolicyAnalysis from "./pages/PolicyAnalysis";
import PolicyAnalysisHub from "./pages/PolicyAnalysisHub";
import PolicyReach from "./pages/PolicyReach";
import PolicySearch from "./pages/PolicySearch";
import PolicyDraftingPage from "./pages/PolicyDraftingPage";
import PolicyPreEvaluationPage from "./pages/PolicyPreEvaluationPage";
import PolicyWriting from "./pages/PolicyWriting";
import MyDocuments from "./pages/MyDocuments";
import MyDocumentDetail from "./pages/MyDocumentDetail";
import ReserveLibrary from "./pages/ReserveLibrary";
import PolicyProjectReview from "./pages/PolicyProjectReview";
import SupportResultPage from "./pages/SupportResultPage";
import ProjectPublicNoticePage from "./pages/ProjectPublicNoticePage";
import FundDisbursementPage from "./pages/FundDisbursementPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* 带侧栏的所有页面 */}
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/brain-chat" element={<BrainChatPage />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/policy-writing" element={<PolicyWriting />} />
            <Route path="/policy-writing/drafting" element={<PolicyDraftingPage />} />
            <Route path="/policy-writing/pre-evaluation" element={<PolicyPreEvaluationPage />} />
            <Route path="/policy-writing/analysis" element={<PolicyAnalysisHub />} />
            <Route path="/policy-writing/search" element={<PolicySearch />} />
            <Route path="/policy-report" element={<PolicyReport />} />
            <Route path="/policy-report/create" element={<PolicyReportCreate />} />
            <Route path="/policy-report/:id" element={<PolicyReportDetail />} />
            <Route path="/effect-dashboard" element={<EffectDashboard />} />
            <Route path="/enterprise-evaluation" element={<EnterpriseEvaluation />} />
            <Route path="/enterprise-evaluation/:id" element={<EnterpriseEvaluationDetail />} />
            <Route path="/policy-evaluation" element={<PolicyEvaluation />} />
            <Route path="/policy-analysis" element={<PolicyAnalysis />} />
            <Route path="/policy-reach" element={<PolicyReach />} />
            <Route path="/policy-project-review" element={<PolicyProjectReview />} />
            <Route path="/support-result" element={<SupportResultPage />} />
            <Route path="/project-public-notice" element={<ProjectPublicNoticePage />} />
            <Route path="/fund-disbursement" element={<FundDisbursementPage />} />
            <Route path="/my-documents" element={<MyDocuments />} />
            <Route path="/my-documents/:id" element={<MyDocumentDetail />} />
            <Route path="/reserve-library" element={<ReserveLibrary />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
