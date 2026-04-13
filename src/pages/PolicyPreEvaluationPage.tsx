import { useLocation, useNavigate } from "react-router-dom";
import { PolicyAssessmentFlow } from "@/components/policy-assessment/PolicyAssessmentFlow";

export default function PolicyPreEvaluationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | {
        directOpenFinal?: boolean;
        policyTitle?: string;
      }
    | undefined;

  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="h-full min-h-0">
        <PolicyAssessmentFlow
          onBack={() => navigate("/policy-writing")}
          directOpenFinal={!!state?.directOpenFinal}
          initialPolicyTitle={state?.policyTitle}
        />
      </div>
    </div>
  );
}
