import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssessmentStep1, type AssessmentPolicy } from "@/components/policy-assessment/AssessmentStep1";
import PolicyAssessmentAuto from "@/components/policy-assessment/PolicyAssessmentAuto";

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

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题栏 */}
      <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              selectedPolicy
                ? () => (directOpenFinal || startEvaluation ? onBack() : setSelectedPolicy(null))
                : onBack
            }
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-semibold text-foreground">返回政策制定</h2>
        </div>
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

      {/* 主内容白卡片 */}
      <div className="flex-1 min-h-0 overflow-hidden bg-card rounded-xl border border-border">
        {!selectedPolicy ? (
          /* 政策选择区 */
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-8 py-8">
              <AssessmentStep1 selected={selectedPolicy} onSelect={setSelectedPolicy} />
            </div>
          </div>
        ) : (
          /* 自动评估区：左右分割布局完全在卡片内 */
          <div className="h-full flex overflow-hidden">
            <PolicyAssessmentAuto
              policy={selectedPolicy}
              onBack={() => (directOpenFinal || startEvaluation ? onBack() : setSelectedPolicy(null))}
              directOpenFinal={directOpenFinal}
            />
          </div>
        )}
      </div>
    </div>
  );
}
