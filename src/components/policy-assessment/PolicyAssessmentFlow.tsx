import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentStep1, type AssessmentPolicy } from "@/components/policy-assessment/AssessmentStep1";
import PolicyAssessmentAuto from "@/components/policy-assessment/PolicyAssessmentAuto";
import { PreAssessmentFlowStepper } from "@/components/policy-assessment/PreAssessmentFlowStepper";
import { assessmentStageToFlowStep } from "@/components/policy-assessment/preAssessmentFlowSteps";

interface Props {
  onBack: () => void;
  directOpenFinal?: boolean;
  initialPolicyTitle?: string;
  initialPolicyContent?: string;
  /** 从政策起草正文页带入，直接进入评估生成流程 */
  startEvaluation?: boolean;
}

export function PolicyAssessmentFlow({
  onBack,
  directOpenFinal = false,
  initialPolicyTitle,
  initialPolicyContent,
  startEvaluation = false,
}: Props) {
  const navigate = useNavigate();
  const [selectedPolicy, setSelectedPolicy] = useState<AssessmentPolicy | null>(() => {
    if (startEvaluation && initialPolicyTitle?.trim()) {
      return {
        id: `draft-policy-${Date.now()}`,
        title: initialPolicyTitle.trim(),
        source: "upload",
        content: initialPolicyContent?.trim() || undefined,
      };
    }
    if (directOpenFinal) {
      return {
        id: "direct-pre-eval-doc",
        title: initialPolicyTitle || "政策前评估报告",
        source: "library",
      };
    }
    const t = initialPolicyTitle?.trim();
    if (t) {
      return { id: "preset-guided-policy", title: t, source: "library" };
    }
    return null;
  });
  const [assessmentStage, setAssessmentStage] = useState(0);
  const [assessmentFinished, setAssessmentFinished] = useState(directOpenFinal);
  const [assessmentStarted, setAssessmentStarted] = useState(directOpenFinal || startEvaluation);

  const currentFlowStep = !selectedPolicy || !assessmentStarted
    ? 1
    : assessmentStageToFlowStep(assessmentStage, assessmentFinished);

  const handlePolicySelect = (policy: AssessmentPolicy | null) => {
    setSelectedPolicy(policy);
    setAssessmentStarted(false);
    if (!policy) {
      setAssessmentStage(0);
      setAssessmentFinished(false);
    }
  };

  const handleStartAssessment = () => {
    if (!selectedPolicy) return;
    setAssessmentStage(0);
    setAssessmentFinished(false);
    setAssessmentStarted(true);
  };

  return (
    <div className="flex h-full flex-col space-y-5">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <button
          type="button"
          onClick={
            selectedPolicy
              ? () => (directOpenFinal || startEvaluation ? onBack() : handlePolicySelect(null))
              : onBack
          }
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回政策制定
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/policy-writing/pre-evaluation/tasks")}
        >
          <List className="h-4 w-4" />
          历史任务列表
        </Button>
      </div>

      <PreAssessmentFlowStepper currentStep={currentFlowStep} />

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {!selectedPolicy || !assessmentStarted ? (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
              <AssessmentStep1
                selected={selectedPolicy}
                onSelect={handlePolicySelect}
                onStartAssessment={handleStartAssessment}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full overflow-hidden">
            <PolicyAssessmentAuto
              policy={selectedPolicy}
              onBack={() => (directOpenFinal || startEvaluation ? onBack() : handlePolicySelect(null))}
              directOpenFinal={directOpenFinal}
              onStageChange={(stage, finished) => {
                setAssessmentStage(stage);
                setAssessmentFinished(finished);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
