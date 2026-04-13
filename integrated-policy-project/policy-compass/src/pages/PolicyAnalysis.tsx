import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Square,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  PauseCircle,
  Wifi,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Brain,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ───
type AnalysisState = "init" | "running" | "stopped" | "completed" | "failed";

interface ThinkingItem {
  id: number;
  text: string;
  type: "info" | "success" | "warning";
  timestamp: string;
}

interface ReportSection {
  title: string;
  content: string;
  status: "pending" | "generating" | "done";
}

// ─── Mock data ───
const STEPS = ["政策解析", "指标分析", "维度评估", "综合诊断", "报告生成"];

const THINKING_MESSAGES: { text: string; type: ThinkingItem["type"] }[] = [
  { text: "正在加载政策文本数据...", type: "info" },
  { text: "已识别政策目标：促进产业发展、优化营商环境", type: "success" },
  { text: "正在解析政策条款结构，共识别 12 条核心条款", type: "info" },
  { text: "政策工具分析：发现 3 类财政工具、2 类税收工具", type: "info" },
  { text: "注意：政策工具类型覆盖面偏窄，建议补充人才类工具", type: "warning" },
  { text: "正在分析扶持范围，覆盖 5 个重点行业", type: "info" },
  { text: "扶持对象分析完成：大型企业占比 60%，中小企业覆盖不足", type: "warning" },
  { text: "正在计算计划偏移度指标...", type: "info" },
  { text: "计划偏移度计算完成：目标达成率 72.5%", type: "success" },
  { text: "正在评估扶持力度，资金投入总额 2.3 亿元", type: "info" },
  { text: "综合评分计算中...", type: "info" },
  { text: "政策效果评估完成，综合评分 78.5 分", type: "success" },
  { text: "正在生成评估报告...", type: "info" },
  { text: "报告结构优化中，合并冗余章节", type: "info" },
  { text: "报告生成完成", type: "success" },
];

const REPORT_SECTIONS: { title: string; content: string }[] = [
  {
    title: "一、政策总体评价",
    content:
      "本政策围绕北京经济技术开发区产业发展目标，聚焦新一代信息技术、高端装备制造、生物医药等重点领域，通过财政补贴、税收优惠、人才引进等多元化政策工具，构建了较为完善的产业扶持体系。政策覆盖面广、扶持力度较大，在推动区域产业升级和创新发展方面发挥了积极作用。\n\n总体来看，政策目标明确、措施具体、执行路径清晰，但在政策工具多样性和中小企业覆盖方面仍有优化空间。",
  },
  {
    title: "二、计划偏移度分析",
    content:
      "通过对比政策预期目标与实际执行效果，计划偏移度综合指标为 27.5%，处于中等偏高水平。\n\n具体表现为：\n• 产业产值增长目标达成率：85.2%，偏移度较低\n• 企业引进数量目标达成率：62.3%，偏移度较高\n• 就业带动目标达成率：71.8%，偏移度中等\n• 创新成果转化目标达成率：58.6%，偏移度较高\n\n建议重点关注企业引进和创新成果转化两个维度的目标设定合理性，适当调整量化指标。",
  },
  {
    title: "三、政策工具多样性分析",
    content:
      "本政策共使用 5 类政策工具，工具多样性指数为 0.68（满分 1.0）。\n\n工具分布如下：\n• 财政补贴类：占比 42%，包括项目资助、贷款贴息等\n• 税收优惠类：占比 23%，包括所得税减免、增值税返还等\n• 用地保障类：占比 15%，包括产业用地优惠、租金减免等\n• 人才支持类：占比 12%，包括人才引进补贴、住房保障等\n• 金融服务类：占比 8%，包括融资担保、风险补偿等\n\n政策工具结构偏重财政补贴，建议增加市场化工具（如产业基金、股权投资）和服务型工具（如公共平台建设、技术咨询）的比重。",
  },
  {
    title: "四、扶持范围分析",
    content:
      "政策扶持范围涵盖 5 个重点行业、3 类企业规模，地域覆盖经开区全域。\n\n行业分布：\n• 新一代信息技术：35% 的扶持资源\n• 高端装备制造：25%\n• 生物医药：20%\n• 新能源新材料：12%\n• 现代服务业：8%\n\n企业规模分布：\n• 大型企业：60%\n• 中型企业：28%\n• 小微企业：12%\n\n小微企业获得的扶持资源占比偏低，建议增设专项扶持条款，提升政策普惠性。",
  },
  {
    title: "五、扶持力度分析",
    content:
      "本政策年度预算总额 2.3 亿元，单个企业最高可获得 500 万元综合支持。\n\n资金分配结构：\n• 项目资助：1.2 亿元（52.2%）\n• 税收优惠：0.5 亿元（21.7%）\n• 人才补贴：0.3 亿元（13.0%）\n• 其他支持：0.3 亿元（13.1%）\n\n与同级别开发区横向对比，扶持力度处于中上水平，但单项最高资助额度偏低，对大型龙头企业的吸引力有限。",
  },
  {
    title: "六、政策效果综合评估",
    content:
      "基于多维分析模型的综合评估结果如下：\n\n综合评分：78.5 / 100\n\n各维度得分：\n• 政策目标合理性：82 分\n• 政策工具适配度：71 分\n• 扶持范围覆盖度：74 分\n• 扶持力度充分性：80 分\n• 执行效果达成度：76 分\n\n总体结论：政策设计较为科学，执行效果良好，但在工具多样性和中小企业覆盖方面存在短板。建议在下一轮政策修订中重点优化政策工具结构，扩大中小企业受益面，同时建立动态评估机制以提升政策响应能力。",
  },
];

const WAIT_TIPS = [
  { maxSeconds: 10, text: "正在启动分析引擎..." },
  { maxSeconds: 30, text: "正在深度解析政策内容，请稍候" },
  { maxSeconds: 60, text: "本次分析较为复杂，AI 正在进行多维度评估" },
  { maxSeconds: Infinity, text: "报告生成中，结果将持续输出，请耐心等待" },
];

// ─── Component ───
const PolicyAnalysis = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AnalysisState>("init");
  const [currentStep, setCurrentStep] = useState(0);
  const [thinkingItems, setThinkingItems] = useState<ThinkingItem[]>([]);
  const [reportSections, setReportSections] = useState<ReportSection[]>(
    REPORT_SECTIONS.map((s) => ({ title: s.title, content: "", status: "pending" }))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [completedModules, setCompletedModules] = useState(0);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getWaitTip = () => {
    return WAIT_TIPS.find((t) => elapsedTime < t.maxSeconds)?.text || "";
  };

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const addThinking = useCallback((text: string, type: ThinkingItem["type"]) => {
    setThinkingItems((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, type, timestamp: now() },
    ]);
  }, []);

  // Auto-scroll thinking panel
  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinkingItems]);

  // Timer
  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  // Simulate analysis
  const runAnalysis = useCallback(() => {
    setState("running");
    setElapsedTime(0);
    setThinkingItems([]);
    setReportSections(REPORT_SECTIONS.map((s) => ({ title: s.title, content: "", status: "pending" })));
    setCompletedModules(0);
    setCurrentStep(0);

    let thinkIdx = 0;
    let sectionIdx = 0;

    const processThinking = () => {
      if (stateRef.current !== "running") return;
      if (thinkIdx < THINKING_MESSAGES.length) {
        const msg = THINKING_MESSAGES[thinkIdx];
        addThinking(msg.text, msg.type);
        thinkIdx++;

        // Update step based on thinking progress
        const stepProgress = Math.floor((thinkIdx / THINKING_MESSAGES.length) * STEPS.length);
        setCurrentStep(Math.min(stepProgress, STEPS.length - 1));

        animationRef.current = setTimeout(processThinking, 800 + Math.random() * 1200);
      } else {
        // Start report generation
        processReport();
      }
    };

    const processReport = () => {
      if (stateRef.current !== "running") return;
      if (sectionIdx < REPORT_SECTIONS.length) {
        // Set current section to generating
        setReportSections((prev) =>
          prev.map((s, i) =>
            i === sectionIdx ? { ...s, status: "generating" } : s
          )
        );

        // Simulate streaming text
        const fullContent = REPORT_SECTIONS[sectionIdx].content;
        const words = fullContent.split("");
        let charIdx = 0;
        const currentSectionIdx = sectionIdx;

        const streamChar = () => {
          if (stateRef.current !== "running") return;
          if (charIdx < words.length) {
            const chunk = words.slice(charIdx, charIdx + 3 + Math.floor(Math.random() * 5)).join("");
            charIdx += chunk.length;
            setReportSections((prev) =>
              prev.map((s, i) =>
                i === currentSectionIdx
                  ? { ...s, content: fullContent.substring(0, charIdx) }
                  : s
              )
            );
            animationRef.current = setTimeout(streamChar, 20 + Math.random() * 30);
          } else {
            // Section complete
            setReportSections((prev) =>
              prev.map((s, i) =>
                i === currentSectionIdx ? { ...s, status: "done", content: fullContent } : s
              )
            );
            setCompletedModules((m) => m + 1);
            sectionIdx++;
            animationRef.current = setTimeout(processReport, 500);
          }
        };
        streamChar();
      } else {
        // All done
        setState("completed");
        setCurrentStep(STEPS.length - 1);
      }
    };

    animationRef.current = setTimeout(processThinking, 1000);
  }, [addThinking]);

  // Auto-start
  useEffect(() => {
    const timer = setTimeout(() => {
      setState("init");
      setTimeout(runAnalysis, 1500);
    }, 500);
    return () => {
      clearTimeout(timer);
      if (animationRef.current) clearTimeout(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = () => {
    setState("stopped");
    if (animationRef.current) clearTimeout(animationRef.current);
  };

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => {
    setIsEditing(false);
  };
  const handleCancelEdit = () => setIsEditing(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const statusConfig: Record<AnalysisState, { label: string; color: string; icon: React.ElementType }> = {
    init: { label: "初始化中", color: "bg-muted text-muted-foreground", icon: Loader2 },
    running: { label: "分析中", color: "bg-blue-100 text-blue-700", icon: Loader2 },
    stopped: { label: "已停止", color: "bg-orange-100 text-orange-700", icon: PauseCircle },
    completed: { label: "已完成", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    failed: { label: "失败", color: "bg-red-100 text-red-700", icon: AlertCircle },
  };

  const { label: statusLabel, color: statusColor, icon: StatusIcon } = statusConfig[state];
  const totalSections = REPORT_SECTIONS.length;
  const progressPercent = state === "completed" ? 100 : Math.round((completedModules / totalSections) * 100);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ─── Header ─── */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/policy-evaluation")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-foreground">
                  {state === "completed" ? "报告生成完成" : "政策评估分析中"}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                    statusColor
                  )}
                >
                  <StatusIcon
                    className={cn("w-3.5 h-3.5", state === "running" || state === "init" ? "animate-spin" : "")}
                  />
                  {statusLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                北京经开区产业发展促进办法 · 综合评估
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state === "running" && (
              <Button variant="outline" size="sm" onClick={handleStop} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Square className="w-3.5 h-3.5 mr-1.5" />
                停止分析
              </Button>
            )}
            {(state === "completed" || state === "stopped") && !isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                编辑报告
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  取消
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  保存
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Global Tip ─── */}
      {(state === "running" || state === "init") && (
        <div className="px-6 py-2 bg-accent/50 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-accent-foreground">
            <Sparkles className="w-4 h-4" />
            <span>{getWaitTip()}</span>
          </div>
        </div>
      )}

      {state === "failed" && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>分析过程出现异常，部分内容可能不完整</span>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Thinking Panel */}
        <div
          className={cn(
            "border-r border-border bg-card flex flex-col transition-all duration-300",
            thinkingExpanded ? "w-[380px]" : "w-[48px]"
          )}
        >
          {thinkingExpanded ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">分析过程</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setThinkingExpanded(false)} className="h-7 w-7 p-0">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Current Step */}
              <div className="px-4 py-3 border-b border-border bg-accent/30">
                <p className="text-xs text-muted-foreground mb-1">当前阶段</p>
                <div className="flex items-center gap-2">
                  {state === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                  <span className="text-sm font-medium text-foreground">
                    {state === "completed" ? "分析完成" : `正在进行「${STEPS[currentStep]}」`}
                  </span>
                </div>
              </div>

              {/* Step Progress */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-1">
                  {STEPS.map((step, i) => {
                    const isDone = state === "completed" ? true : i < currentStep;
                    const isCurrent = state !== "completed" && i === currentStep;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            isDone
                              ? "bg-primary text-primary-foreground"
                              : isCurrent
                              ? "bg-primary/20 text-primary border-2 border-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isDone ? "✓" : i + 1}
                        </div>
                        <span className="text-[10px] mt-1 text-muted-foreground text-center leading-tight">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thinking Stream */}
              <div ref={thinkingRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {thinkingItems.map((item) => (
                  <div key={item.id} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground whitespace-nowrap font-mono">{item.timestamp}</span>
                    <span
                      className={cn(
                        item.type === "success"
                          ? "text-green-600"
                          : item.type === "warning"
                          ? "text-orange-600"
                          : "text-foreground"
                      )}
                    >
                      {item.type === "success" && "✅ "}
                      {item.type === "warning" && "⚠️ "}
                      {item.text}
                    </span>
                  </div>
                ))}
                {(state === "running" || state === "init") && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span>思考中...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-3">
              <Button variant="ghost" size="sm" onClick={() => setThinkingExpanded(true)} className="h-7 w-7 p-0">
                <ChevronUp className="w-4 h-4" />
              </Button>
              <div className="mt-2 writing-mode-vertical text-xs text-muted-foreground" style={{ writingMode: "vertical-rl" }}>
                分析过程
              </div>
            </div>
          )}
        </div>

        {/* Right: Report Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">评估报告</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>已完成 {completedModules}/{totalSections} 模块</span>
              <span>{progressPercent}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-2">
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Report Content */}
          <div ref={reportRef} className="flex-1 overflow-y-auto px-6 py-6">
            {/* Report title */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-foreground">
                  北京经开区产业发展促进办法 · 政策评估报告
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  生成时间：2024年3月20日 | AI 智能分析
                </p>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {reportSections.map((section, i) => (
                  <div key={i} className="border-b border-border pb-6 last:border-0">
                    <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                      {section.status === "done" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {section.status === "generating" && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                      {section.status === "pending" && (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      {section.title}
                    </h3>
                    {section.status === "pending" ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    ) : isEditing && (section.status === "done" || state === "stopped") ? (
                      <textarea
                        className="w-full min-h-[120px] p-3 border border-input rounded-lg text-sm text-foreground leading-relaxed bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                        defaultValue={section.content}
                        onChange={(e) => {
                          setReportSections((prev) =>
                            prev.map((s, idx) =>
                              idx === i ? { ...s, content: e.target.value } : s
                            )
                          );
                        }}
                      />
                    ) : (
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                        {section.status === "generating" && (
                          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Generating tip */}
              {state === "running" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>
                    正在生成第 {Math.min(completedModules + 1, totalSections)} 部分...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer Status ─── */}
      <div className="border-t border-border bg-card px-6 py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              已用时：{formatTime(elapsedTime)}
            </span>
            <span>
              已完成 {completedModules}/{totalSections} 模块
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" />
              流式连接：{state === "running" ? "正常" : state === "completed" ? "已断开" : "待连接"}
            </span>
            <span>
              生成状态：
              {state === "running"
                ? "进行中"
                : state === "completed"
                ? "已完成"
                : state === "stopped"
                ? "已停止"
                : state === "failed"
                ? "异常"
                : "准备中"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyAnalysis;
