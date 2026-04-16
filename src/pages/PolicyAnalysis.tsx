import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  Square,
  RotateCcw,
  ChevronDown,
  FileText,
  ClipboardList,
  BarChart3,
  CircleAlert,
  Lightbulb,
} from "lucide-react";
import { markPolicyEvaluated } from "@/lib/policyEvaluationCompleted";
import { buildGovReportPreviewHtml } from "@/lib/govReportHeaderHtml";

const STAGES = [
  {
    id: 0,
    label: "整体情况分析",
    icon: FileText,
    duration: 1100,
    thoughts: ["正在读取政策基础信息…", "提取政策目标、覆盖范围和执行周期…", "完成整体运行态势初步判断…"],
  },
  {
    id: 1,
    label: "内容逐条分析",
    icon: ClipboardList,
    duration: 1200,
    thoughts: ["拆解政策条款结构…", "识别兑现条款与执行条款…", "标注条款执行差异点…"],
  },
  {
    id: 2,
    label: "实施效果分析",
    icon: BarChart3,
    duration: 1100,
    thoughts: ["汇总政策兑现与覆盖数据…", "测算政策资金使用效率…", "评估产业带动效果…"],
  },
  {
    id: 3,
    label: "存在问题分析",
    icon: CircleAlert,
    duration: 900,
    thoughts: ["识别兑现率偏低条款…", "定位企业申报堵点…", "汇总执行过程主要问题…"],
  },
  {
    id: 4,
    label: "优化建议分析",
    icon: Lightbulb,
    duration: 900,
    thoughts: ["匹配可执行优化路径…", "生成分层改进建议…", "形成政策修订方向…"],
  },
];

const STAGE_OUTPUTS = [
  `（一）政策目标与导向匹配度
本政策聚焦外商投资企业高质量发展，围绕“稳存量、扩增量、提质量、优生态”进行制度设计，与经开区现阶段产业升级和开放型经济发展目标整体一致。政策目标与区域产业方向、招商导向、创新驱动逻辑保持同向，具备较强战略协同性。

（二）政策结构完整性评估
从结构上看，政策形成“项目引进—要素支持—经营服务—评估监督”的闭环框架，条款间前后衔接较为顺畅。前端强化项目落地和总部功能导入，中端突出研发、人才、资金等核心要素保障，末端强调绩效评估和资金使用约束，整体治理链条较完整。

（三）政策适用对象与覆盖边界
当前政策对重点外资企业、链主企业和技术密集型企业的支持导向明确，有利于快速形成示范效应；但对中小外资企业、功能型平台企业和初创型科技企业的适配支持仍可细化，建议后续增加分层条款口径，提升政策普惠度与可达性。

（四）阶段性运行判断
综合判断，本政策具备较好的总体设计基础与执行潜力，政策方向正确、框架完整、重点突出。下一步需重点在可操作细则、跨部门协同和企业端体验上持续补强，以确保政策效能稳定释放。`,
  `（一）奖励补贴类条款
奖励补贴条款执行基础较好，企业关注度高、申报动力强，是当前政策发挥效果最直接的条款类型。条款对企业投资信心和经营预期具有正向支撑作用，但在奖励标准分档、兑现节奏与绩效挂钩机制方面仍有进一步透明化空间。

（二）资格认定与门槛类条款
资格认定类条款对政策精准投放具有必要性，但部分口径偏原则化，企业在“是否符合、如何举证、何时提交”上存在理解偏差。建议统一认定边界、补充判定示例并明确否决项清单，降低企业申报不确定性。

（三）流程执行与材料要求
当前条款在材料标准、部门流转和反馈时限方面仍存在细节不一问题，导致企业重复沟通成本偏高。建议建立条款-流程-材料一体化清单，推动“同口径审核、同标准反馈”，形成更稳定的执行体验。

（四）条款可持续性与可复用性
从中长期看，鼓励研发投入、产业协同和技术升级类条款具有较高可持续性，能够持续促进企业能力建设。建议将高频应用条款沉淀为标准模块，提升后续政策迭代效率和跨政策复用能力。`,
  `（一）企业覆盖与兑现表现
从实施结果看，政策对重点企业覆盖较快，兑现效率总体可控，能够形成较好的阶段性示范。高成长、高研发投入企业受益更明显，政策对企业扩产增资和技术迭代形成了实际激励。

（二）资金使用效率与杠杆效应
政策资金投向总体与区域产业导向一致，重点领域集中度较高，具备一定资源聚焦效果。部分条款已呈现“财政资金撬动社会投资”的正向杠杆，但不同条款之间边际效果差异较大，需建立条款级投入产出评估机制。

（三）产业带动与生态联动
政策对产业链协同、上下游配套和创新平台建设具有积极带动作用，尤其在先进制造、科技服务和跨境协同创新领域效果初显。建议后续强化产业链关键环节指标跟踪，验证政策对链条韧性和竞争力提升的贡献度。

（四）企业感知与办理体验
企业端反馈显示，政策价值认可度较高，但办理便利度在不同条款间不均衡。建议继续压缩“知晓—匹配—申报—兑现”链路时长，提升政策可感知、可获得、可验证水平。`,
  `（一）条款执行尺度不一致
部分条款在不同承办环节存在解释差异，导致企业预期管理难度上升。该问题易引发“同类事项不同判断”的体验偏差，影响政策公信力与稳定性。

（二）跨部门协同与数据复用不足
目前跨部门协同机制虽已建立，但在信息共享、材料复用、节点反馈方面仍存在断点。企业重复提交、重复说明现象尚未完全消除，影响整体办理效率。

（三）政策触达结构不均衡
头部企业和既有重点企业受益更充分，新设中小外资企业在政策识别、申报辅导和流程适配方面支持不足，可能导致政策效果集中化，削弱普惠性和外溢效应。

（四）后评价机制深度不足
当前复盘以结果汇总为主，缺乏条款级问题画像、原因拆解和整改闭环跟踪，难以为下一轮政策修订提供高质量证据。建议尽快建立标准化后评价指标体系与案例库。`,
  `（一）近期可执行优化建议（0-3个月）
1. 对低兑现率条款发布配套指引，明确申报口径、材料模板、常见否决场景。
2. 建立“单一窗口 + 并联审核”机制，减少企业多头沟通。
3. 对中小外资企业提供分层辅导服务，提升匹配精度与申报成功率。

（二）中期机制化优化建议（3-12个月）
1. 构建条款级KPI体系，至少覆盖：触达率、申报率、兑现时效、企业满意度、资金杠杆率。
2. 建立后评价专题库，沉淀问题清单、典型案例、整改进度与复盘结论。
3. 将后评价结果与政策修订、预算安排、事项配置联动，形成“评估-优化-再评估”闭环。

（三）长期治理能力建设建议
1. 推动政策条款标准化和模块化，提升跨政策复用能力。
2. 强化多语种、场景化政策解读，提升国际化企业政策可理解性。
3. 建设政策运行监测看板，实现条款级动态预警和滚动优化。

综合建议：以“精准条款、高效流程、数据复盘、持续迭代”为主线，逐步实现政策从“可执行”向“高质量执行”升级。`,
];

const SECTION_TITLES = [
  "一、整体情况分析",
  "二、内容逐条分析",
  "三、实施效果分析",
  "四、存在问题分析",
  "五、优化建议分析",
];

export default function PolicyAnalysis() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const policyName = searchParams.get("policy") || "北京经开区产业发展促进办法";
  const directFinal = searchParams.get("directFinal") === "1";

  const [stage, setStage] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<number | null>(0);
  const [typingText, setTypingText] = useState("");
  const [editableResults, setEditableResults] = useState<string[]>(Array(STAGES.length).fill(""));
  const [thoughtLogs, setThoughtLogs] = useState<string[]>(Array(STAGES.length).fill(""));
  const [runKey, setRunKey] = useState(0);
  const [openFinalMode, setOpenFinalMode] = useState(directFinal);
  const typingCancelRef = useRef<(() => void) | null>(null);
  const stopRef = useRef(false);

  const handleStop = useCallback(() => {
    stopRef.current = true;
    setStopped(true);
    setFinished(true);
    setStage(STAGES.length);
  }, []);

  const handleRestart = useCallback(() => {
    setOpenFinalMode(false);
    stopRef.current = false;
    setStopped(false);
    setFinished(false);
    setStage(0);
    setExpandedThinking(0);
    setTypingText("");
    setEditableResults(Array(STAGES.length).fill(""));
    setThoughtLogs(Array(STAGES.length).fill(""));
    setRunKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (openFinalMode) {
      setThoughtLogs(STAGES.map((item) => item.thoughts.join("\n")));
      setEditableResults([...STAGE_OUTPUTS]);
      setFinished(true);
      setStopped(false);
      setStage(STAGES.length);
      setExpandedThinking(null);
      return;
    }

    stopRef.current = false;
    let mounted = true;
    const stoppedNow = () => !mounted || stopRef.current;

    const run = async () => {
      for (let i = 0; i < STAGES.length; i++) {
        setStage(i);
        setExpandedThinking(i);
        setThoughtLogs((prev) => {
          const next = [...prev];
          next[i] = STAGES[i].thoughts.join("\n");
          return next;
        });
        await new Promise((r) => setTimeout(r, STAGES[i].duration));
        if (stoppedNow()) return;
        setEditableResults((prev) => {
          const next = [...prev];
          next[i] = STAGE_OUTPUTS[i];
          return next;
        });
        setExpandedThinking(null);
      }

      setFinished(true);
      setStage(STAGES.length);
      window.dispatchEvent(
        new CustomEvent("assistant:eval-report-done", {
          detail: { title: policyName },
        })
      );
    };

    run();
    return () => {
      mounted = false;
    };
  }, [policyName, runKey, openFinalMode]);

  useEffect(() => {
    typingCancelRef.current?.();
    setTypingText("");
    const stageIdx = finished ? -1 : stage;
    if (stageIdx < 0 || stageIdx >= STAGES.length) return;
    const full = STAGES[stageIdx].thoughts.join("\n");
    let i = 0;
    let cancelled = false;
    typingCancelRef.current = () => {
      cancelled = true;
    };
    const tick = () => {
      if (cancelled) return;
      i++;
      setTypingText(full.slice(0, i));
      if (i < full.length) setTimeout(tick, 18);
    };
    setTimeout(tick, 120);
    return () => {
      cancelled = true;
    };
  }, [stage, finished]);

  /** 评估流程自然完成后记录，供政策评价列表展示「重新评估」（中途停止不计入） */
  useEffect(() => {
    if (!finished || stopped) return;
    markPolicyEvaluated(policyName);
  }, [finished, stopped, policyName]);

  const flowCurrent = Math.min(stage + 1, STAGES.length);
  const statusLabel = stopped ? "已停止" : finished ? "已完成" : STAGES[stage]?.label || "执行中";
  const finalReportText = [
    "政策评价报告",
    `评估对象：${policyName}`,
    `评估日期：${new Date().toLocaleDateString("zh-CN")}`,
    "",
    ...SECTION_TITLES.map((title, idx) => `${title}\n${editableResults[idx] || STAGE_OUTPUTS[idx]}`),
  ].join("\n\n");

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">政策评价流程</h3>
            <span className="text-xs font-medium text-muted-foreground">{`第 ${flowCurrent} / ${STAGES.length} 步`}</span>
          </div>
          <div className="flex items-center justify-center">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isCurrent = flowCurrent === s.id + 1;
              const isPending = flowCurrent < s.id + 1;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`h-12 w-12 rounded-full border flex items-center justify-center shrink-0
                      ${isCurrent ? "bg-primary text-primary-foreground border-primary shadow-[0_8px_18px_rgba(230,0,50,0.24)]" : ""}
                      ${isPending ? "bg-white text-[#d8b9c6] border-[#e7ced8]" : ""}
                      ${!isCurrent && !isPending ? "bg-primary/10 text-primary border-primary/30" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${isPending ? "text-muted-foreground" : "text-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="px-6 md:px-8 text-[#d8b9c6] text-base leading-none select-none -mt-5">{">>"}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-1.5">
              {!finished ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
              <span className="text-sm text-muted-foreground">{statusLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              {finished && (
                <button
                  onClick={() => {
                    const html = buildGovReportPreviewHtml({
                      documentTitle: `关于《${policyName}》的政策评价报告`,
                      bodyText: finalReportText,
                      windowTitle: "政策评价报告预览",
                    });
                    const w = window.open("", "_blank");
                    if (!w) return;
                    w.document.write(html);
                    w.document.close();
                  }}
                  className="py-1.5 px-3 rounded-lg gov-gradient text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  预览报告
                </button>
              )}
              {finished && (
                <button
                  onClick={() => {
                    const blob = new Blob([finalReportText], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${policyName}_政策评价报告_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="py-1.5 px-3 rounded-lg gov-gradient text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  导出报告
                </button>
              )}
              {!finished && (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  <Square className="h-3 w-3 fill-current" />
                  停止生成
                </button>
              )}
              {finished && (
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  重新生成
                </button>
              )}
              <button
                onClick={() => navigate("/policy-evaluation")}
                className="py-1.5 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                返回政策列表
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const active = !finished && stage === i;
              const done = finished || stage > i;
              const hasResult = !!editableResults[i];
              const thinkingOpen = expandedThinking === i && (active || done);

              return (
                <div key={s.id} className="rounded-xl border border-border bg-white min-h-[320px]">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedThinking(thinkingOpen ? null : i)}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground/50"}`} />
                    <span className={`flex-1 text-sm font-medium ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                    {active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : null}
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${thinkingOpen ? "rotate-180" : ""}`} />
                  </button>

                  {thinkingOpen && (
                    <div className="px-4 pb-3">
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">思考过程</p>
                        <pre className="whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
                          {active ? typingText : thoughtLogs[i] || STAGES[i].thoughts.join("\n")}
                          {active && <span className="inline-block w-0.5 h-3 bg-primary ml-0.5 animate-pulse align-middle" />}
                        </pre>
                      </div>
                    </div>
                  )}
                  {!thinkingOpen && (done || active) && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-muted-foreground">思考过程已记录，点击上方可展开查看。</p>
                    </div>
                  )}

                  <div className="px-4 pb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">分析结果（可编辑）</p>
                    <textarea
                      value={editableResults[i]}
                      onChange={(e) =>
                        setEditableResults((prev) => {
                          const next = [...prev];
                          next[i] = e.target.value;
                          return next;
                        })
                      }
                      placeholder={done ? "" : "该维度分析完成后会自动填充结果"}
                      spellCheck={false}
                      className="min-h-[180px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {!hasResult && !active && !done && <p className="mt-2 text-xs text-muted-foreground">等待执行该维度分析…</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
