import { useLocation, useNavigate } from "react-router-dom";
import { PolicyAssessmentFlow } from "@/components/policy-assessment/PolicyAssessmentFlow";
import { useTaskVersionView } from "@/lib/taskVersionView";

export default function PolicyPreEvaluationPage() {
  const versionView = useTaskVersionView();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | {
        directOpenFinal?: boolean;
        policyTitle?: string;
        policyContent?: string;
        startEvaluation?: boolean;
      }
    | undefined;

  return (
    <div className="h-full overflow-hidden p-6 md:p-8">
      <div className="h-full min-h-0">
        <PolicyAssessmentFlow
          key={location.key}
          onBack={() => navigate("/policy-writing")}
          directOpenFinal={versionView.version ? ["已完成", "已归档"].includes(versionView.version.task.status ?? "") : !!state?.directOpenFinal}
          initialPolicyTitle={versionView.version?.task.title ?? state?.policyTitle}
          initialPolicyContent={versionView.version ? undefined : state?.policyContent}
          startEvaluation={versionView.version ? false : !!state?.startEvaluation}
        />
      </div>
    </div>
  );
}
