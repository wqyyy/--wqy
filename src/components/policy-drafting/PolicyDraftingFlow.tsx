import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  List,
  ListChecks,
  ClipboardList,
  Search,
  Sparkles,
  ListOrdered,
  ScrollText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PolicySearchStep, type PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";
import { PolicyAnalysisStep, type ClauseComparison } from "@/components/policy-drafting/drafting/PolicyAnalysisStep";
import { OutlineGenerationStep, type OutlineSection } from "@/components/policy-drafting/drafting/OutlineGenerationStep";
import { PolicyOutputPage } from "@/components/policy-drafting/drafting/PolicyOutputPage";
import { QuickDraftProgress } from "@/components/policy-drafting/drafting/QuickDraftProgress";
import { expandPolicyTitleFromDirection, isFullPolicyTitle } from "@/lib/policyDraftApi";
import { DATA_INDUSTRY_POLICY_TITLE } from "@/lib/samplePolicyDocuments";
import {
  resolveDraftingEntryFromTask,
  type PolicyDraftingTask,
} from "@/lib/policyDraftingTasks";

/** 「确定政策方向」输入框默认内容 */
const DEFAULT_POLICY_DIRECTION = "推进数据产业高质量发展";

const flowSteps = [
  { id: 1, label: "确定政策方向", icon: ClipboardList },
  { id: 2, label: "检索相似政策", icon: Search },
  { id: 3, label: "生成核心要素", icon: Sparkles },
  { id: 4, label: "生成政策大纲", icon: ListOrdered },
  { id: 5, label: "生成政策正文", icon: ScrollText },
];

const policyTypeOptions = [
  "实施方案",
  "实施细则",
  "实施意见",
  "若干措施",
  "管理办法",
  "奖励办法",
  "工作方案",
  "其他",
] as const;

type PolicyTypeOption = (typeof policyTypeOptions)[number];

type PolicyScope = "中观政策" | "微观政策";

const POLICY_TYPE_META: Record<
  PolicyTypeOption,
  { scope: PolicyScope; description: string }
> = {
  若干措施: {
    scope: "微观政策",
    description: "聚焦重点领域提出具体举措，突出支持方向、任务抓手和保障措施。",
  },
  实施方案: {
    scope: "中观政策",
    description: "面向重点工作制定的总体安排，明确目标、任务与推进机制。",
  },
  实施细则: {
    scope: "微观政策",
    description: "对上位政策进行细化落地，明确条件、标准、流程与材料要求。",
  },
  实施意见: {
    scope: "中观政策",
    description: "围绕特定方向提出指导要求，明确工作思路、目标与职责分工。",
  },
  工作方案: {
    scope: "中观政策",
    description: "面向专项任务制定执行安排，明确任务分工、时间节点和保障措施。",
  },
  管理办法: {
    scope: "微观政策",
    description: "对事项管理作出制度规定，明确认定、申报、审核与监督要求。",
  },
  奖励办法: {
    scope: "微观政策",
    description: "明确奖励对象、支持标准、兑现方式及申报审核流程。",
  },
  其他: {
    scope: "微观政策",
    description: "适用于无法归入既有类型的政策文件，可按实际内容灵活分类。",
  },
};

function inferPolicyTypeFromTitle(title: string): PolicyTypeOption {
  const text = title.trim();
  if (!text) return "若干措施";
  const matched = policyTypeOptions.find((option) => text.includes(option));
  return matched ?? "若干措施";
}

interface PolicyDraftingFlowProps {
  onBack: () => void;
  initialTitle?: string;
  /** 从助手流式起草直接传入的完整政策内容，有值时跳过所有步骤直接进入编辑器 */
  directContent?: string;
  /** 从历史任务列表打开时恢复进度或进入正文详情页 */
  resumeTask?: PolicyDraftingTask;
}

function resolveInitialDraftState(resumeTask?: PolicyDraftingTask) {
  if (!resumeTask) {
    return { step: 1, maxStep: 1, draftCompleted: false };
  }
  const { step, openOutputPage } = resolveDraftingEntryFromTask(resumeTask);
  return {
    step,
    maxStep: resumeTask.currentStep,
    draftCompleted: openOutputPage,
  };
}

function resolveInitialPolicyType(resumeTask?: PolicyDraftingTask, title?: string): PolicyTypeOption {
  if (
    resumeTask?.policyType &&
    policyTypeOptions.includes(resumeTask.policyType as PolicyTypeOption)
  ) {
    return resumeTask.policyType as PolicyTypeOption;
  }
  return inferPolicyTypeFromTitle(title ?? resumeTask?.title ?? "");
}

export function PolicyDraftingFlow({
  onBack,
  initialTitle,
  directContent,
  resumeTask,
}: PolicyDraftingFlowProps) {
  const initialDraft = resolveInitialDraftState(resumeTask);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(initialDraft.step);
  /** 已完成（訪問過）的最大步驟，用於控制步驟條可點擊範圍 */
  const [maxReachedStep, setMaxReachedStep] = useState(initialDraft.maxStep);
  const [direction, setDirection] = useState(
    () => initialTitle?.trim() || resumeTask?.title || DEFAULT_POLICY_DIRECTION,
  );
  const [title, setTitle] = useState(() => {
    const t = (initialTitle?.trim() || resumeTask?.title || "").trim();
    return t && isFullPolicyTitle(t) ? t : "";
  });
  const [titleGenerating, setTitleGenerating] = useState(false);
  const [policyType, setPolicyType] = useState<PolicyTypeOption>(() =>
    resolveInitialPolicyType(resumeTask, initialTitle ?? resumeTask?.title),
  );
  const [coreElements, setCoreElements] = useState("");
  const [coreItems, setCoreItems] = useState<{ id: string; text: string; refs: { id: string; title: string; url?: string; clause?: string }[] }[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyItem[]>([]);
  const [analysisResult, setAnalysisResult] = useState<ClauseComparison[]>([]);
  const [outlineResult, setOutlineResult] = useState<OutlineSection[]>([]);
  /** 起草是否已完成（进入正文生成页面即算完成） */
  const [draftCompleted, setDraftCompleted] = useState(initialDraft.draftCompleted);
  /** 快速起草模式：显示进度页，完成后直接进入编辑器（打字机模式） */
  const [quickMode, setQuickMode] = useState(false);
  /** 快速起草完成后切到编辑器并开启打字机输出 */
  const [quickDraftReady, setQuickDraftReady] = useState(false);
  const [quickDraftResult, setQuickDraftResult] = useState<{
    policies: PolicyItem[];
    outline: OutlineSection[];
    coreElements?: string;
  }>({ policies: [], outline: [] });

  useEffect(() => {
    if (initialDraft.draftCompleted) {
      localStorage.setItem("policy-draft-completed", "1");
    }
  }, [initialDraft.draftCompleted]);

  useEffect(() => {
    const t = initialTitle?.trim();
    if (t) {
      setDirection(t);
      if (isFullPolicyTitle(t)) setTitle(t);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (resumeTask) return;
    const inferredType = inferPolicyTypeFromTitle(direction);
    setPolicyType(inferredType);
  }, [direction, resumeTask]);

  const expandTitleFromDirection = async () => {
    if (title.trim() && isFullPolicyTitle(title)) return title;
    setTitleGenerating(true);
    try {
      const { title: expanded } = await expandPolicyTitleFromDirection(direction, policyType);
      setTitle(expanded);
      return expanded;
    } finally {
      setTitleGenerating(false);
    }
  };

  const goNext = async () => {
    if (currentStep === 1) {
      await expandTitleFromDirection();
    }
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxReachedStep(prev => Math.max(prev, next));
    }
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  /** 點擊步驟條跳轉：只允許跳到已訪問過的前序步驟 */
  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep && stepId <= maxReachedStep) {
      setCurrentStep(stepId);
    }
  };

  /** 快速起草：后台各步骤完成后直接跳到编辑器（打字机模式） */
  const handleQuickDraftComplete = (result: { policies: PolicyItem[]; outline: OutlineSection[]; coreElements: string }) => {
    setCoreElements(result.coreElements);
    setQuickDraftResult(result);
    setQuickDraftReady(true);
  };

  // 从助手直接传入内容：跳过所有步骤，直接进入编辑器
  if (directContent) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <PolicyOutputPage
          policyTitle={initialTitle?.trim() || DATA_INDUSTRY_POLICY_TITLE}
          coreElements={coreElements}
          selectedPolicies={[]}
          outline={[]}
          onBack={onBack}
          directContent={directContent}
        />
      </div>
    );
  }

  // 快速起草进度页
  if (quickMode && !quickDraftReady) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setQuickMode(false)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <QuickDraftProgress
          policyTitle={title || direction}
          coreElements={coreElements}
          onComplete={handleQuickDraftComplete}
        />
      </div>
    );
  }

  // 快速起草完成 → 直接进入编辑器（打字机模式）
  if (quickDraftReady) {
    if (!draftCompleted) {
      setDraftCompleted(true);
      localStorage.setItem("policy-draft-completed", "1");
    }
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <PolicyOutputPage
          policyTitle={title || direction}
          coreElements={coreElements}
          selectedPolicies={quickDraftResult.policies}
          outline={quickDraftResult.outline}
          onBack={() => { setQuickDraftReady(false); setQuickMode(false); }}
          typewriterMode
        />
      </div>
    );
  }

  // Step 5: 正文生成页（分步起草）
  if (currentStep === 5) {
    // 进入编辑器即标记起草已完成（写入 localStorage，助手读取此标记判断是否提示）
    if (!draftCompleted) {
      setDraftCompleted(true);
      localStorage.setItem("policy-draft-completed", "1");
    }
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <PolicyOutputPage
          policyTitle={title || direction}
          coreElements={coreElements}
          selectedPolicies={selectedPolicies}
          outline={outlineResult}
          onBack={() => {
            if (resumeTask && resolveDraftingEntryFromTask(resumeTask).openOutputPage) {
              onBack();
              return;
            }
            setCurrentStep(4);
          }}
        />
      </div>
    );
  }

  /** 步驟條底部按鈕列：左側返回 + 右側下一步 */
  const renderBottomActions = (nextLabel: string, nextDisabled = false) => (
    <div className="flex items-center gap-3 pt-2">
      {currentStep > 1 && (
        <Button
          variant="outline"
          onClick={goBack}
          className="h-11 px-5 text-sm font-medium flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          返回上一步
        </Button>
      )}
      <Button
        onClick={goNext}
        disabled={nextDisabled}
        className="flex-1 h-11 gov-gradient text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
      >
        {nextLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
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
          onClick={() => navigate("/policy-writing/drafting/tasks")}
        >
          <List className="h-4 w-4" />
          历史任务列表
        </Button>
      </div>

      {/* Flow stepper — 按截图样式改为卡片式流程条 */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">起草流程</h3>
          <span className="text-xs font-medium text-muted-foreground">{`第 ${currentStep} / 5 步`}</span>
        </div>
        <div className="flex items-center justify-center gap-0">
        {flowSteps.map((step, i) => {
          const isCurrent = currentStep === step.id;
          const isClickable = step.id < currentStep && step.id <= maxReachedStep;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => handleStepClick(step.id)}
                  className={`h-12 w-12 rounded-full border flex items-center justify-center shrink-0 transition-all
                    ${isCurrent ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(230,0,50,0.24)]" : ""}
                    ${!isCurrent ? "bg-white text-[#d8b9c6] border-[#e7ced8]" : ""}
                    ${isClickable ? "cursor-pointer hover:border-primary/50 hover:text-primary" : "cursor-default"}
                  `}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span
                  onClick={() => handleStepClick(step.id)}
                  className={`text-xs font-medium whitespace-nowrap transition-colors
                    ${isCurrent ? "text-foreground" : "text-muted-foreground"}
                    ${isClickable ? "cursor-pointer hover:text-primary" : "cursor-default"}
                  `}
                >
                  {step.label}
                </span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="px-6 md:px-8 text-[#d8b9c6] text-base leading-none select-none -mt-5">{" >> "}</div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* Step content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Step 1: Input */}
        {currentStep === 1 && (
          <div className="space-y-6 rounded-xl border border-border bg-card px-5 py-6 md:px-7">
            <div className="space-y-2">
              <Label htmlFor="policy-title" className="text-sm font-medium">
                确定政策方向 <span className="text-primary">*</span>
              </Label>
              <Input
                id="policy-title"
                placeholder={DEFAULT_POLICY_DIRECTION}
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value);
                  setTitle("");
                }}
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                政策类型 <span className="text-primary">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {policyTypeOptions.map((option) => {
                  const checked = policyType === option;
                  const meta = POLICY_TYPE_META[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPolicyType(option)}
                      className={`flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/20"
                      }`}
                      aria-pressed={checked}
                    >
                      <div className="flex w-full items-start justify-between gap-1">
                        <span
                          className={`text-sm ${checked ? "font-semibold text-primary" : "font-medium text-foreground"}`}
                        >
                          {option}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none ${
                            checked
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {meta.scope}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-foreground">
                        {meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 起草方式选择 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* 快速起草 */}
              <button
                onClick={async () => {
                  if (!direction.trim() || titleGenerating) return;
                  await expandTitleFromDirection();
                  setQuickMode(true);
                }}
                disabled={!direction.trim() || titleGenerating}
                className={`group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all
                  ${direction.trim() && !titleGenerating
                    ? "border-primary/30 hover:border-primary hover:bg-primary/[0.03] cursor-pointer"
                    : "border-border opacity-50 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">快速起草</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI 自动完成检索、分析、大纲生成全流程，完成后直接输出政策全文，适合快速生成初稿。
                </p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
                  <Zap className="h-3 w-3" />
                  一键直达
                </div>
              </button>

              {/* 分步起草 */}
              <button
                onClick={async () => {
                  if (!direction.trim() || titleGenerating) return;
                  await goNext();
                }}
                disabled={!direction.trim() || titleGenerating}
                className={`group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all
                  ${direction.trim() && !titleGenerating
                    ? "border-primary/30 hover:border-primary hover:bg-primary/[0.03] cursor-pointer"
                    : "border-border opacity-50 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">分步起草</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  按步骤逐一完成政策检索、对比分析、大纲编辑，全程可干预调整，适合精细化定制。
                </p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-600">
                  <ListChecks className="h-3 w-3" />
                  逐步精控
                </div>
              </button>
            </div>

            {titleGenerating && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                AI 正在润色扩写政策标题…
              </div>
            )}
          </div>
        )}

        {/* Step 2: Policy Search */}
        {currentStep === 2 && (
          <div className="space-y-6 rounded-xl border border-border bg-card px-5 py-6 md:px-7">
            <PolicySearchStep
              policyTitle={title}
              policyDirection={direction}
              titleGenerating={titleGenerating}
              coreElements={coreElements}
              policies={selectedPolicies}
              onPoliciesSelected={setSelectedPolicies}
              onPolicyTitleChange={setTitle}
            />
            {renderBottomActions(
              `下一步：核心要素生成（已选 ${selectedPolicies.filter(p => p.selected).length} 条）`,
              selectedPolicies.filter(p => p.selected).length === 0
            )}
          </div>
        )}

        {/* Step 3: Core elements generation (formerly analysis) */}
        {currentStep === 3 && (
          <div className="space-y-6 rounded-xl border border-border bg-card px-5 py-6 md:px-7">
            <PolicyAnalysisStep
              selectedPolicies={selectedPolicies}
              policyTitle={title}
              onAnalysisComplete={setAnalysisResult}
              onCoreElementsChange={(v: string) => setCoreElements(v)}
              onCoreElementsItemsChange={(items) => setCoreItems(items)}
            />
            {renderBottomActions("下一步：生成大纲")}
          </div>
        )}

        {/* Step 4: Outline Generation */}
        {currentStep === 4 && (
          <div className="space-y-6 rounded-xl border border-border bg-card px-5 py-6 md:px-7">
              <OutlineGenerationStep
                policyTitle={title}
                coreElements={coreElements}
                selectedPolicies={selectedPolicies}
                analysisResult={analysisResult}
                coreItems={coreItems}
                onOutlineComplete={setOutlineResult}
              />
              {renderBottomActions("下一步：生成正文", outlineResult.length === 0)}
          </div>
        )}
      </motion.div>
    </div>
  );
}
