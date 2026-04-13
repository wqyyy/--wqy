import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, GitCompare, Cpu, Shield, FileText, Check, ChevronDown, Square, RotateCcw } from "lucide-react";
import { generateReportText } from "./AssessmentStep7";
import type { AssessmentPolicy } from "./AssessmentStep1";
import type { Clause } from "./AssessmentStep2";
import type { Step3Result } from "./AssessmentStep3";
import type { Step4Result } from "./AssessmentStep4";
import type { Step5Result } from "./AssessmentStep5";
import type { Step6Result } from "./AssessmentStep6";

interface Props {
  policy: AssessmentPolicy;
  onBack: () => void;
  directOpenFinal?: boolean;
}

function mockExtractClauses(_title: string): Clause[] {
  return [
    { id: "c1", article: "第三条", text: "对首次认定为国家级高新技术企业的，给予一次性奖励20万元，连续认定的每次给予10万元奖励。", category: "condition" },
    { id: "c2", article: "第四条", text: "对企业年度研发投入超过上年度50%以上的，按超出部分的20%给予补贴，最高不超过200万元。", category: "condition" },
    { id: "c3", article: "第五条", text: "鼓励企业开展技术创新，对获得国家发明专利授权的企业，每项给予5万元奖励，每家企业每年最高不超过50万元。", category: "competition" },
    { id: "c4", article: "第六条", text: "支持企业参与制定国际、国家、行业标准，对主导制定国际标准的企业给予100万元奖励。", category: "competition" },
    { id: "c5", article: "第七条", text: "深化一网通办改革，实现企业开办全流程网上办理，办理时限压缩至1个工作日以内。", category: "business" },
    { id: "c6", article: "第八条", text: "推行容缺受理机制，对申报材料基本齐全、主要内容符合条件的事项先行受理、后补材料。", category: "business" },
  ];
}

function mockStep3(_clauses: Clause[]): Step3Result {
  return {
    superiorChecks: [
      { policyTitle: "《中华人民共和国促进科技成果转化法》", source: "全国人大", url: "https://www.gov.cn", consistencyLevel: "consistent", note: "本政策扶持方向与国家科技成果转化立法精神一致。" },
      { policyTitle: "《国务院关于促进新一代人工智能产业发展三年行动计划》", source: "国务院", url: "https://www.gov.cn", consistencyLevel: "partial", note: "补贴标准与国家行动计划建议基本相符，但认定条件有差异。" },
    ],
    crossClauses: [
      { ourClause: "高新技术企业认定奖励20万元", ourArticle: "第三条", crossPolicy: "《北京市高新技术企业奖励办法》", crossClause: "高新技术企业认定奖励15万元", crossType: "duplicate", suggestion: "建议明确与市级奖励的衔接方式" },
    ],
  };
}

function mockStep4(_clauses: Clause[]): Step4Result {
  return {
    fundClauses: [
      { id: "f1", article: "第三条", clauseText: "高新技术企业认定奖励20万元", estCompanies: 45, estBudget: 900, coverageRate: "约62%", agentNote: "基于历史数据测算" },
    ],
    nonFundClauses: [
      { id: "n1", article: "第七条", clauseText: "一网通办改革，办理时限1个工作日", audienceClarity: "clear", audienceNote: "适用对象为新注册企业" },
    ],
  };
}

function mockStep5(): Step5Result {
  return [
    { id: "cp1", dimension: "公平竞争审查", level: "pass", detail: "符合相关要求" },
    { id: "cp2", dimension: "行政许可合规", level: "warning", detail: "容缺受理需补充后续流程说明", suggestion: "参照行政许可法补充说明" },
  ];
}

function mockStep6(): Step6Result {
  return [
    { id: "o1", priority: "high", category: "建议", opinion: "建议明确资金来源与拨付流程", detail: "可在实施细则中明确" },
  ];
}

const STAGES = [
  {
    id: 0, label: "条款拆解", icon: Search, duration: 900,
    thoughts: ["正在读取政策文本结构…", "按条款边界拆分政策内容…", "对条款进行分类标注…"],
  },
  {
    id: 1, label: "一致性评估", icon: GitCompare, duration: 1200,
    thoughts: ["检索上位政策数据库…", "比对政策条款一致性…", "扫描交叉条款冲突…"],
  },
  {
    id: 2, label: "落地性评估", icon: Cpu, duration: 1100,
    thoughts: ["调用政策测算智能体…", "测算资金规模及企业覆盖数量…", "评估非资金条款受众清晰度…"],
  },
  {
    id: 3, label: "合规性评估", icon: Shield, duration: 900,
    thoughts: ["进行公平竞争审查…", "核查行政许可合规性…", "检查资金管理合规要求…"],
  },
  {
    id: 4, label: "其他意见", icon: FileText, duration: 700,
    thoughts: ["归纳需补充的实施细则…", "提炼关键优化建议…", "整理风险提示与补充意见…"],
  },
];

export function PolicyAssessmentAuto({ policy, onBack, directOpenFinal = false }: Props) {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [step3, setStep3] = useState<Step3Result | null>(null);
  const [step4, setStep4] = useState<Step4Result | null>(null);
  const [step5, setStep5] = useState<Step5Result | null>(null);
  const [step6, setStep6] = useState<Step6Result | null>(null);

  const [stage, setStage] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<number | null>(0);

  /** 每个步骤正在打字输出的文字 */
  const [typingText, setTypingText] = useState("");
  const typingCancelRef = useRef<(() => void) | null>(null);
  /** 用于中断流程的 ref */
  const stopRef = useRef(false);
  /** 用于触发重新生成的计数器 */
  const [runKey, setRunKey] = useState(0);
  const [openFinalMode, setOpenFinalMode] = useState(directOpenFinal);

  const [editableResults, setEditableResults] = useState<string[]>(Array(STAGES.length).fill(""));
  const [thoughtLogs, setThoughtLogs] = useState<string[]>(Array(STAGES.length).fill(""));

  /** 停止生成 */
  const handleStop = useCallback(() => {
    stopRef.current = true;
    setStopped(true);
    setFinished(true);
    setStage(STAGES.length);
  }, []);

  /** 重新生成：重置所有状态并重新执行 */
  const handleRestart = useCallback(() => {
    setOpenFinalMode(false);
    stopRef.current = false;
    setStopped(false);
    setFinished(false);
    setStage(0);
    setClauses([]);
    setStep3(null);
    setStep4(null);
    setStep5(null);
    setStep6(null);
    setExpandedThinking(0);
    setTypingText("");
    setEditableResults(Array(STAGES.length).fill(""));
    setThoughtLogs(Array(STAGES.length).fill(""));
    setRunKey(k => k + 1);
  }, []);

  // ── 自动执行流程 ──────────────────────────────────────────
  useEffect(() => {
    if (openFinalMode) {
      const defaultClauses = mockExtractClauses(policy.title);
      const defaultStep3 = mockStep3(defaultClauses);
      const defaultStep4 = mockStep4(defaultClauses);
      const defaultStep5 = mockStep5();
      const defaultStep6 = mockStep6();

      setClauses(defaultClauses);
      setStep3(defaultStep3);
      setStep4(defaultStep4);
      setStep5(defaultStep5);
      setStep6(defaultStep6);
      setThoughtLogs(STAGES.map((item) => item.thoughts.join("\n")));
      setEditableResults([
        `共拆解 ${defaultClauses.length} 条条款。\n` +
          `条件达成类：${defaultClauses.filter(c => c.category === "condition").length} 条\n` +
          `竞争促进类：${defaultClauses.filter(c => c.category === "competition").length} 条\n` +
          `营商环境类：${defaultClauses.filter(c => c.category === "business").length} 条\n\n` +
          `【条件达成类】\n` +
          defaultClauses.filter(c => c.category === "condition").map(c => `· ${c.article} ${c.text}`).join("\n") +
          `\n\n【竞争促进类】\n` +
          defaultClauses.filter(c => c.category === "competition").map(c => `· ${c.article} ${c.text}`).join("\n") +
          `\n\n【营商环境类】\n` +
          defaultClauses.filter(c => c.category === "business").map(c => `· ${c.article} ${c.text}`).join("\n"),
        `上位一致性 ${defaultStep3.superiorChecks.length} 条，交叉条款 ${defaultStep3.crossClauses.length} 条。\n` +
          defaultStep3.superiorChecks.map(s => `· ${s.policyTitle}（${s.consistencyLevel}）：${s.note}`).join("\n") +
          "\n交叉条款：\n" +
          defaultStep3.crossClauses.map(c => `· ${c.ourArticle} ${c.ourClause} vs ${c.crossPolicy}：${c.suggestion}`).join("\n"),
        `资金类 ${defaultStep4.fundClauses.length} 条，非资金类 ${defaultStep4.nonFundClauses.length} 条。\n` +
          defaultStep4.fundClauses.map(f => `· ${f.article} ${f.clauseText}：覆盖 ${f.estCompanies} 家，预算 ${f.estBudget} 万元`).join("\n") +
          "\n非资金类：\n" + defaultStep4.nonFundClauses.map(n => `· ${n.article}：${n.audienceNote}`).join("\n"),
        defaultStep5.map(s => `· ${s.dimension}（${s.level}）：${s.detail}${s.suggestion ? " → " + s.suggestion : ""}`).join("\n"),
        defaultStep6.map(o => `· [${o.priority}] ${o.category}：${o.opinion}\n  ${o.detail}`).join("\n"),
      ]);
      setFinished(true);
      setStopped(false);
      setStage(STAGES.length);
      setExpandedThinking(null);
      return;
    }

    stopRef.current = false;
    let mounted = true;
    const stopped = () => !mounted || stopRef.current;

    const run = async () => {
      setStage(0);
      setExpandedThinking(0);
      setThoughtLogs(prev => {
        const next = [...prev];
        next[0] = STAGES[0].thoughts.join("\n");
        return next;
      });
      await new Promise(r => setTimeout(r, STAGES[0].duration));
      if (stopped()) return;
      setClauses(mockExtractClauses(policy.title));
      setExpandedThinking(null);

      setStage(1);
      setExpandedThinking(1);
      setThoughtLogs(prev => {
        const next = [...prev];
        next[1] = STAGES[1].thoughts.join("\n");
        return next;
      });
      await new Promise(r => setTimeout(r, STAGES[1].duration));
      if (stopped()) return;
      const r3 = mockStep3([]);
      setStep3(r3);
      setExpandedThinking(null);

      setStage(2);
      setExpandedThinking(2);
      setThoughtLogs(prev => {
        const next = [...prev];
        next[2] = STAGES[2].thoughts.join("\n");
        return next;
      });
      await new Promise(r => setTimeout(r, STAGES[2].duration));
      if (stopped()) return;
      setStep4(mockStep4([]));
      setExpandedThinking(null);

      setStage(3);
      setExpandedThinking(3);
      setThoughtLogs(prev => {
        const next = [...prev];
        next[3] = STAGES[3].thoughts.join("\n");
        return next;
      });
      await new Promise(r => setTimeout(r, STAGES[3].duration));
      if (stopped()) return;
      setStep5(mockStep5());
      setExpandedThinking(null);

      setStage(4);
      setExpandedThinking(4);
      setThoughtLogs(prev => {
        const next = [...prev];
        next[4] = STAGES[4].thoughts.join("\n");
        return next;
      });
      await new Promise(r => setTimeout(r, STAGES[4].duration));
      if (stopped()) return;
      setStep6(mockStep6());
      setExpandedThinking(null);

      setFinished(true);
      setStage(STAGES.length);
      setExpandedThinking(null);

      // 通知助手：前评估报告已生成完成
      window.dispatchEvent(new CustomEvent("assistant:pre-eval-done", {
        detail: { title: policy.title },
      }));
    };
    run();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy, runKey, openFinalMode]);

  // ── 每步骤进入时打字机输出思考文字 ────────────────────────
  useEffect(() => {
    typingCancelRef.current?.();
    setTypingText("");

    const stageIdx = finished ? -1 : stage;
    if (stageIdx < 0 || stageIdx >= STAGES.length) return;

    const lines = STAGES[stageIdx].thoughts;
    const full = lines.join("\n");
    let i = 0;
    let cancelled = false;
    typingCancelRef.current = () => { cancelled = true; };

    const tick = () => {
      if (cancelled) return;
      i++;
      setTypingText(full.slice(0, i));
      if (i < full.length) setTimeout(tick, 18);
    };
    setTimeout(tick, 120);
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, finished]);

  // ── 报告随完成数据更新 ────────────────────────────────────
  const currentLabel = finished
    ? "已完成"
    : stage < STAGES.length
    ? STAGES[stage].label
    : "已完成";

  const stageResults = [
    clauses.length > 0
      ? `共拆解 ${clauses.length} 条条款。\n` +
        `条件达成类：${clauses.filter(c => c.category === "condition").length} 条\n` +
        `竞争促进类：${clauses.filter(c => c.category === "competition").length} 条\n` +
        `营商环境类：${clauses.filter(c => c.category === "business").length} 条\n\n` +
        `【条件达成类】\n` +
        clauses.filter(c => c.category === "condition").map(c => `· ${c.article} ${c.text}`).join("\n") +
        `\n\n【竞争促进类】\n` +
        clauses.filter(c => c.category === "competition").map(c => `· ${c.article} ${c.text}`).join("\n") +
        `\n\n【营商环境类】\n` +
        clauses.filter(c => c.category === "business").map(c => `· ${c.article} ${c.text}`).join("\n")
      : "",
    step3
      ? `上位一致性 ${step3.superiorChecks.length} 条，交叉条款 ${step3.crossClauses.length} 条。\n` +
        step3.superiorChecks.map(s => `· ${s.policyTitle}（${s.consistencyLevel}）：${s.note}`).join("\n") +
        "\n交叉条款：\n" +
        step3.crossClauses.map(c => `· ${c.ourArticle} ${c.ourClause} vs ${c.crossPolicy}：${c.suggestion}`).join("\n")
      : "",
    step4
      ? `资金类 ${step4.fundClauses.length} 条，非资金类 ${step4.nonFundClauses.length} 条。\n` +
        step4.fundClauses.map(f => `· ${f.article} ${f.clauseText}：覆盖 ${f.estCompanies} 家，预算 ${f.estBudget} 万元`).join("\n") +
        "\n非资金类：\n" + step4.nonFundClauses.map(n => `· ${n.article}：${n.audienceNote}`).join("\n")
      : "",
    step5
      ? step5.map(s => `· ${s.dimension}（${s.level}）：${s.detail}${s.suggestion ? " → " + s.suggestion : ""}`).join("\n")
      : "",
    step6
      ? step6.map(o => `· [${o.priority}] ${o.category}：${o.opinion}\n  ${o.detail}`).join("\n")
      : "",
  ];

  useEffect(() => {
    setEditableResults(prev => {
      const next = [...prev];
      stageResults.forEach((text, idx) => {
        if (text && !next[idx]) next[idx] = text;
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clauses, step3, step4, step5, step6, finished]);

  const flowSteps = STAGES;
  const flowCurrent = Math.min(stage + 1, STAGES.length);
  const finalReportText = generateReportText({
    policy,
    clauses: clauses.length > 0 ? clauses : mockExtractClauses(policy.title),
    step3: step3 ?? mockStep3([]),
    step4: step4 ?? mockStep4([]),
    step5: step5 ?? mockStep5(),
    step6: step6 ?? mockStep6(),
  });

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">前评估流程</h3>
            <span className="text-xs font-medium text-muted-foreground">{`第 ${flowCurrent} / ${STAGES.length} 步`}</span>
          </div>
          <div className="flex items-center justify-center">
            {flowSteps.map((s, i) => {
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
                      ${!isCurrent && !isPending ? "bg-primary/10 text-primary border-primary/30" : ""}
                    `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${isPending ? "text-muted-foreground" : "text-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < flowSteps.length - 1 && (
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
              {!finished ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Check className="h-4 w-4 text-primary" />}
              <span className="text-sm text-muted-foreground">{stopped ? "已停止" : currentLabel}</span>
            </div>
            <div className="flex items-center gap-2">
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
                  onClick={() => {
                    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>前评估报告预览</title>
                    <style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,PingFang SC,Hiragino Sans GB,Microsoft YaHei,sans-serif;padding:24px;line-height:1.9;color:#1f2937;white-space:pre-wrap;}h1{font-size:20px;margin:0 0 16px;}</style>
                    </head><body><h1>政策前评估报告意见书（预览）</h1>${finalReportText.replace(/</g, "&lt;")}</body></html>`;
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
                    a.download = `${policy.title}_前评估报告意见书_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "")}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="py-1.5 px-3 rounded-lg gov-gradient text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  导出报告
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
                onClick={onBack}
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
                    {active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : done ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
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
                        setEditableResults(prev => {
                          const next = [...prev];
                          next[i] = e.target.value;
                          return next;
                        })
                      }
                      placeholder={done ? "" : "该维度分析完成后会自动填充结果"}
                      spellCheck={false}
                      className="min-h-[180px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-7 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {!hasResult && !active && !done && (
                      <p className="mt-2 text-xs text-muted-foreground">等待执行该维度分析…</p>
                    )}
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

export default PolicyAssessmentAuto;
