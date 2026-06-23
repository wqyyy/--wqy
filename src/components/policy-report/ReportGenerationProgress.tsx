import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Building2, Check, FileText, Loader2, PieChart, Sparkles } from "lucide-react";

interface ReportGenerationProgressProps {
  reportTitle: string;
  itemCount: number;
  onComplete: () => void;
}

interface StepDef {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  thoughts: string[];
}

const STEPS: StepDef[] = [
  {
    id: 1,
    label: "已兑现事项分析",
    sublabel: "统计事项类型、时间、主管部门等分布",
    icon: BarChart3,
    thoughts: [
      "正在汇总纳入专报的兑现事项数据…",
      "按兑现类型、年份、月份等维度统计分布…",
      "生成已兑现事项结构分析结论…",
    ],
  },
  {
    id: 2,
    label: "已拨付资金分析",
    sublabel: "分析资金拨付规模、行业与领域分布",
    icon: PieChart,
    thoughts: [
      "正在汇总已拨付资金规模数据…",
      "按行业、主管部门、支持领域等维度分析…",
      "生成资金拨付分布图表与结论…",
    ],
  },
  {
    id: 3,
    label: "已申报企业分析",
    sublabel: "洞察申报主体性质、规模与空间分布",
    icon: Building2,
    thoughts: [
      "正在汇总已申报企业基础数据…",
      "按企业性质、规模、行业等维度分析…",
      "生成企业画像分布结论…",
    ],
  },
  {
    id: 4,
    label: "生成专报文档",
    sublabel: "整合图表与结论，排版输出专报",
    icon: FileText,
    thoughts: [
      "正在整合各维度分析结果…",
      "生成图表与评估结论…",
      "排版专报文档，即将完成…",
    ],
  },
];

type StepStatus = "pending" | "running" | "done";

export function ReportGenerationProgress({ reportTitle, itemCount, onComplete }: ReportGenerationProgressProps) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(["running", "pending", "pending", "pending"]);
  const [activeThought, setActiveThought] = useState<string>(STEPS[0].thoughts[0]);
  const [thoughtVisible, setThoughtVisible] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const hasRunRef = useRef(false);

  const switchThought = (text: string) => {
    setThoughtVisible(false);
    setTimeout(() => {
      setActiveThought(text);
      setThoughtVisible(true);
    }, 200);
  };

  const runThoughtCycle = (stepIdx: number, durationMs: number) => {
    const thoughts = STEPS[stepIdx].thoughts;
    let idx = 0;
    switchThought(thoughts[0]);
    const interval = Math.floor(durationMs / thoughts.length);
    const timer = setInterval(() => {
      idx++;
      if (idx < thoughts.length) {
        switchThought(thoughts[idx]);
      } else {
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  };

  const animateProgress = (from: number, to: number, durationMs: number) => {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const frac = Math.min(elapsed / durationMs, 1);
      setOverallProgress(Math.round(from + (to - from) * frac));
      if (frac < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      // Step 0: 已兑现事项分析 (0% → 25%)
      animateProgress(0, 25, 1200);
      const clearStep0 = runThoughtCycle(0, 1100);
      await new Promise((r) => setTimeout(r, 1150));
      clearStep0();

      setStepStatuses(["done", "running", "pending", "pending"]);

      // Step 1: 已拨付资金分析 (25% → 50%)
      animateProgress(25, 50, 1200);
      const clearStep1 = runThoughtCycle(1, 1100);
      await new Promise((r) => setTimeout(r, 1150));
      clearStep1();

      setStepStatuses(["done", "done", "running", "pending"]);

      // Step 2: 已申报企业分析 (50% → 75%)
      animateProgress(50, 75, 1200);
      const clearStep2 = runThoughtCycle(2, 1100);
      await new Promise((r) => setTimeout(r, 1150));
      clearStep2();

      setStepStatuses(["done", "done", "done", "running"]);

      // Step 3: 生成专报文档 (75% → 100%)
      animateProgress(75, 100, 900);
      const clearStep3 = runThoughtCycle(3, 800);
      await new Promise((r) => setTimeout(r, 850));
      clearStep3();

      setStepStatuses(["done", "done", "done", "done"]);
      setOverallProgress(100);

      setTimeout(() => {
        onComplete();
      }, 600);
    };

    run();
  }, [onComplete]);

  const allDone = stepStatuses.every((s) => s === "done");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-8 rounded-xl border border-border bg-card p-8">
        <div className="space-y-1 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-foreground">正在生成兑现专报</h2>
          <p className="mx-auto max-w-sm truncate text-xs text-muted-foreground">《{reportTitle}》· 覆盖 {itemCount} 项</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>整体进度</span>
            <span className="font-medium tabular-nums">{overallProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full gov-gradient"
              style={{ width: `${overallProgress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const status = stepStatuses[idx];
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors
                  ${status === "running" ? "border border-primary/20 bg-primary/5" : ""}
                  ${status === "done" ? "opacity-60" : ""}
                  ${status === "pending" ? "opacity-35" : ""}
                `}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors
                  ${status === "done" ? "bg-primary/10 text-primary" : ""}
                  ${status === "running" ? "bg-amber-100 text-amber-600" : ""}
                  ${status === "pending" ? "bg-muted text-muted-foreground" : ""}
                `}
                >
                  {status === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.sublabel}</div>
                </div>

                {status === "pending" && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {idx + 1}/{STEPS.length}
                  </span>
                )}
                {status === "done" && <span className="shrink-0 text-xs font-medium text-primary">完成</span>}
              </div>
            );
          })}
        </div>

        <div className="flex min-h-[48px] items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <div className="flex shrink-0 gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/50"
                animate={!allDone ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] } : { opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={activeThought}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: thoughtVisible ? 1 : 0, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground"
            >
              {allDone ? "专报生成完成，正在展示报告…" : activeThought}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
