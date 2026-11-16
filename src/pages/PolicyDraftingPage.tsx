import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PolicyDraftingFlow } from "@/components/policy-drafting/PolicyDraftingFlow";
import { getPolicyDraftingTaskById } from "@/lib/policyDraftingTasks";
import { useTaskVersionView } from "@/lib/taskVersionView";

export default function PolicyDraftingPage() {
  const versionView = useTaskVersionView();
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
        initialTitle={versionView.version?.task.title ?? state?.policyTitle ?? state?.initialTitle ?? resumeTask?.title}
        directContent={versionView.version ? undefined : state?.directContent}
        resumeTask={resumeTask}
      />
    </div>
  );
}
