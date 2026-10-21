import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getPolicyPreAssessmentTaskById, loadPolicyPreAssessmentTasks, savePolicyPreAssessmentTasks, formatPolicyPreAssessmentUpdatedAt } from "@/lib/policyPreAssessmentTasks";
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
  const [params] = useSearchParams();
  const [savedTask] = useState(() => {
    if (params.get("taskId")) return getPolicyPreAssessmentTaskById(params.get("taskId")!);
    if (params.has("new") || startEvaluation || initialPolicyTitle || directOpenFinal) return undefined;
    const latest = [...loadPolicyPreAssessmentTasks()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return latest?.status === "已归档" ? undefined : latest;
  });
  const [taskId] = useState(() => savedTask?.id || `pre-${crypto.randomUUID()}`);
  const [archived, setArchived] = useState(savedTask?.status === "已归档");
  const [scrollRequest, setScrollRequest] = useState({ step: 1, revision: 0 });
  const openFinal = directOpenFinal || savedTask?.status === "已归档" || savedTask?.status === "已完成";
  const [selectedPolicy, setSelectedPolicy] = useState<AssessmentPolicy | null>(() => {
    if (startEvaluation && initialPolicyTitle?.trim()) {
      return {
        id: `draft-policy-${Date.now()}`,
        title: initialPolicyTitle.trim(),
        source: "upload",
        content: initialPolicyContent?.trim() || undefined,
      };
    }
    if (openFinal || savedTask) {
      return {
        id: "direct-pre-eval-doc",
        title: initialPolicyTitle || savedTask?.title || "政策前评估报告",
        source: savedTask?.source === "上传文件" ? "upload" : "library",
        content: savedTask?.policyContent,
      };
    }
    const t = initialPolicyTitle?.trim();
    if (t) {
      return { id: "preset-guided-policy", title: t, source: "library" };
    }
    return null;
  });
  const [assessmentStage, setAssessmentStage] = useState(0);
  const [assessmentFinished, setAssessmentFinished] = useState(openFinal);
  const [assessmentStarted, setAssessmentStarted] = useState(openFinal || startEvaluation || Boolean(savedTask));
  const [selectionVisible, setSelectionVisible] = useState(false);
  const persistAssessment = useCallback((reportText: string, editableSections: string[], stage: number, finished: boolean) => {
    if (!selectedPolicy || archived) return;
    try {
      const tasks = loadPolicyPreAssessmentTasks();
      const previous = tasks.find(task => task.id === taskId);
      if (previous?.status === "已归档") return;
      const now = formatPolicyPreAssessmentUpdatedAt();
      savePolicyPreAssessmentTasks([{ id: taskId, title: selectedPolicy.title, source: selectedPolicy.source === "upload" ? "上传文件" : "起草库", status: finished ? "已完成" : "进行中", currentStep: assessmentStageToFlowStep(stage, finished), riskLevel: previous?.riskLevel || "中", createdAt: previous?.createdAt || now, updatedAt: now, reportText, editableSections, policyContent: selectedPolicy.content }, ...tasks.filter(task => task.id !== taskId)]);
    } catch { toast.error("评估报告保存失败，请检查浏览器存储空间"); }
  }, [selectedPolicy, archived, taskId]);
  const archiveAssessment = (reportText: string, editableSections: string[]) => {
    if (!assessmentFinished || !selectedPolicy || archived) return;
    try {
      const tasks = loadPolicyPreAssessmentTasks();
      const now = formatPolicyPreAssessmentUpdatedAt();
      const previous = tasks.find(task => task.id === taskId);
      savePolicyPreAssessmentTasks([{ id: taskId, title: selectedPolicy.title, source: selectedPolicy.source === "upload" ? "上传文件" : "起草库", status: "已归档", currentStep: 8, riskLevel: previous?.riskLevel || "中", createdAt: previous?.createdAt || now, updatedAt: now, reportText, editableSections, policyContent: selectedPolicy.content }, ...tasks.filter(task => task.id !== taskId)]);
      setArchived(true);
      toast.success("前评估任务已归档");
    } catch { toast.error("归档失败，请检查浏览器存储空间后重试"); }
  };

  const progressFlowStep = !selectedPolicy || !assessmentStarted
    ? 1
    : assessmentStageToFlowStep(assessmentStage, assessmentFinished);
  const currentFlowStep = selectionVisible ? 1 : progressFlowStep;

  const handlePolicySelect = (policy: AssessmentPolicy | null) => {
    setSelectedPolicy(policy);
    setAssessmentStarted(false);
    setAssessmentStage(0);
    setAssessmentFinished(false);
  };

  const handleStartAssessment = () => {
    if (!selectedPolicy) return;
    setSelectionVisible(false);
    if (assessmentStarted) return;
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

      <PreAssessmentFlowStepper currentStep={currentFlowStep} progressStep={progressFlowStep} archived={archived} onSelect={step => {
        if (step === 1) {
          setSelectionVisible(true);
          return;
        }
        setSelectionVisible(false);
        setScrollRequest(previous => ({ step, revision: previous.revision + 1 }));
      }} />

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {(!selectedPolicy || !assessmentStarted || selectionVisible) && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
              <AssessmentStep1
                selected={selectedPolicy}
                onSelect={handlePolicySelect}
                onStartAssessment={handleStartAssessment}
              />
            </div>
          </div>
        )}
        {selectedPolicy && assessmentStarted && (
          <div className={selectionVisible ? "hidden" : "flex h-full overflow-hidden"}>
            <PolicyAssessmentAuto
              policy={selectedPolicy}
              onBack={() => (directOpenFinal || startEvaluation ? onBack() : handlePolicySelect(null))}
              directOpenFinal={openFinal}
              archived={archived}
              initialSections={savedTask?.editableSections}
              onArchive={archiveAssessment}
              onProgressSave={persistAssessment}
              scrollRequest={scrollRequest}
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
