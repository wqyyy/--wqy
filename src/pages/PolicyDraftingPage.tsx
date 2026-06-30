import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PolicyDraftingFlow } from "@/components/policy-drafting/PolicyDraftingFlow";
import { getPolicyDraftingTaskById } from "@/lib/policyDraftingTasks";

export default function PolicyDraftingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId");
  const resumeTask = taskId ? getPolicyDraftingTaskById(taskId) : undefined;
  const state = location.state as {
    initialTitle?: string;
    directContent?: string;
    policyTitle?: string;
    fromTaskList?: boolean;
  } | undefined;

  const handleBack = () => {
    if (state?.fromTaskList || resumeTask) {
      navigate("/policy-writing/drafting/tasks");
      return;
    }
    navigate("/policy-writing");
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-5 md:p-6">
      <PolicyDraftingFlow
        onBack={handleBack}
        initialTitle={state?.policyTitle ?? state?.initialTitle ?? resumeTask?.title}
        directContent={state?.directContent}
        resumeTask={resumeTask}
      />
    </div>
  );
}
