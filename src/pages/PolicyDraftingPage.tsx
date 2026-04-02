import { useLocation, useNavigate } from "react-router-dom";
import { PolicyDraftingFlow } from "@/components/policy-drafting/PolicyDraftingFlow";

export default function PolicyDraftingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    initialTitle?: string;
    directContent?: string;
    policyTitle?: string;
  } | undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden p-6 md:p-8">
      <div className="flex flex-col flex-1 min-h-0">
        <PolicyDraftingFlow
          onBack={() => navigate("/policy-writing")}
          initialTitle={state?.policyTitle ?? state?.initialTitle}
          directContent={state?.directContent}
        />
      </div>
    </div>
  );
}
