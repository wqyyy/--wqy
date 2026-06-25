import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronUp,
  ClipboardList,
  Eye,
  FilePlus,
  List,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ClauseMaterialPickerModal } from "@/components/policy-analysis/ClauseMaterialPickerModal";
import { CompareAnalysisResultModal } from "@/components/policy-analysis/CompareAnalysisResultModal";
import {
  buildAnalysisResults,
  getResultSummary,
  type AnalysisResultItem,
  type ClauseItem,
} from "@/components/policy-analysis/compareAnalysisResults";
import type { ContrastType } from "@/components/policy-analysis/compareAnalysisTypes";
import type { ClauseMaterialItem } from "@/lib/clauseMaterialLibrary";

const FLOW_STEPS = [
  { id: 1, label: "选择分析条件", icon: SlidersHorizontal },
  { id: 2, label: "添加分析条款", icon: FilePlus },
  { id: 3, label: "开始AI分析", icon: Sparkles },
  { id: 4, label: "查看分析结果", icon: Eye },
] as const;

const CONTRAST_TYPE_OPTIONS: { id: ContrastType; label: string; description: string }[] = [
  {
    id: "horizontal",
    label: "横向对比",
    description: "对选定地区和时间范围内的政策条款进行比对，展示异同点。",
  },
  {
    id: "duplicate",
    label: "查重",
    description: "对选定范围内的政策条款进行查重，找出重复率符合条件的政策。",
  },
  {
    id: "diff",
    label: "异同对比",
    description: "对左侧选中的两个条款进行异同分析。",
  },
];

const OVERLAP_RATE_OPTIONS = ["20%", "40%", "60%", "80%", "100%"];

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="w-full py-2.5">
      <div className="mb-1.5 text-left text-sm text-foreground">
        {required && <span className="text-primary">* </span>}
        {label}:
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

const defaultClauses: ClauseItem[] = [
  {
    id: "c1",
    label: "条款1",
    content:
      "对2022年1月1日至2023年12月31日期间，工业产值同比增长10%（含）以上的工业企业，按照产值增量部分的1%给予支持，每年每家最高支持50万元。",
    title: "标题",
    meta: "北京市经济技术开发区关于加快推动生物制造产业创新发展的若干措施 2023-02-07",
  },
  {
    id: "c2",
    label: "条款2",
    content:
      "对经认定并纳入经开区人才清单的高层次人才，按照人才类别给予最高100万元奖励。",
    title: "标题",
    meta: "北京经济技术开发区关于加快推动生物制造产业创新发展的若干措施 2023-02-07",
  },
  {
    id: "c3",
    label: "条款3",
    content:
      "支持企业建设生物制造中试平台，按照设备投资额的20%给予补贴，单个项目最高支持500万元。",
    title: "标题",
    meta: "北京经济技术开发区关于加快推动生物制造产业创新发展的若干措施 2023-02-07",
  },
  {
    id: "c4",
    label: "条款4",
    content:
      "鼓励企业开展关键技术攻关，对承担区级重大专项的企业，给予最高300万元资金支持。",
    title: "标题",
    meta: "北京经济技术开发区关于加快推动生物制造产业创新发展的若干措施 2023-02-07",
  },
  {
    id: "c5",
    label: "条款5",
    content:
      "支持生物制造企业融资，按照实际贷款利息的50%给予贴息，每年最高贴息100万元。",
    title: "标题",
    meta: "北京经济技术开发区关于加快推动生物制造产业创新发展的若干措施 2023-02-07",
  },
];

type PolicyCompareAnalysisDetailProps = {
  taskName: string;
  isNew?: boolean;
};

export function PolicyCompareAnalysisDetail({ isNew = false }: PolicyCompareAnalysisDetailProps) {
  const navigate = useNavigate();
  const [contrastType, setContrastType] = useState<ContrastType>("horizontal");
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(true);
  const [overlapRate, setOverlapRate] = useState("");
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>(() =>
    isNew ? [] : defaultClauses.map((c) => c.id),
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [clauses, setClauses] = useState<ClauseItem[]>(() => (isNew ? [] : defaultClauses));
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
  const [results, setResults] = useState<AnalysisResultItem[]>([]);
  const [viewingResultId, setViewingResultId] = useState<string | null>(null);
  const [publishDateStart, setPublishDateStart] = useState("");
  const [publishDateEnd, setPublishDateEnd] = useState("");
  const [customInputVisible, setCustomInputVisible] = useState(false);
  const [customInputText, setCustomInputText] = useState("");
  const customInputRef = useRef<HTMLTextAreaElement>(null);

  const viewingResult = useMemo(
    () => results.find((item) => item.id === viewingResultId) ?? null,
    [results, viewingResultId],
  );

  const flowCurrent = useMemo(() => {
    if (hasAnalyzed) return 4;
    if (selectedClauseIds.length > 0) return 3;
    if (clauses.length > 0) return 2;
    return 1;
  }, [hasAnalyzed, selectedClauseIds.length, clauses.length]);

  const showOptionalFields = contrastType === "horizontal" || contrastType === "duplicate";

  const canAnalyze = useMemo(() => {
    if (contrastType === "diff") return selectedClauseIds.length === 2;
    if (contrastType === "duplicate") return selectedClauseIds.length > 0 && overlapRate !== "";
    return selectedClauseIds.length > 0;
  }, [contrastType, selectedClauseIds.length, overlapRate]);

  const toggleClause = (id: string) => {
    setSelectedClauseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allClausesSelected =
    clauses.length > 0 && clauses.every((clause) => selectedClauseIds.includes(clause.id));

  const toggleSelectAllClauses = () => {
    if (allClausesSelected) {
      setSelectedClauseIds([]);
      return;
    }
    setSelectedClauseIds(clauses.map((clause) => clause.id));
  };

  const relabelClauses = (items: ClauseItem[]) =>
    items.map((clause, index) => ({
      ...clause,
      label: `条款${index + 1}`,
    }));

  const handleDeleteClause = (id: string) => {
    setClauses((prev) => relabelClauses(prev.filter((clause) => clause.id !== id)));
    setSelectedClauseIds((prev) => prev.filter((clauseId) => clauseId !== id));
    setHasAnalyzed(false);
    setResults([]);
    setViewingResultId(null);
  };

  const openCustomInput = () => {
    setCustomInputVisible(true);
    window.setTimeout(() => customInputRef.current?.focus(), 0);
  };

  const cancelCustomInput = () => {
    setCustomInputVisible(false);
    setCustomInputText("");
  };

  const confirmCustomInput = () => {
    const content = customInputText.trim();
    if (!content) return;

    const stamp = Date.now();
    const newClause: ClauseItem = {
      id: `clause-custom-${stamp}`,
      label: "",
      content,
      meta: "自定义输入",
    };
    const merged = [newClause, ...clauses].map((clause, index) => ({
      ...clause,
      label: `条款${index + 1}`,
    }));
    setClauses(merged);
    setSelectedClauseIds((prev) => [...new Set([...prev, newClause.id])]);
    setCustomInputVisible(false);
    setCustomInputText("");
  };

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    const selectedClauses = clauses.filter((clause) => selectedClauseIds.includes(clause.id));
    setResults(buildAnalysisResults(contrastType, selectedClauses, overlapRate));
    setHasAnalyzed(true);
    setViewingResultId(null);
  };

  const handleConfirmMaterialClauses = (items: ClauseMaterialItem[]) => {
    const existing = new Set(clauses.map((c) => c.content));
    const toAdd = items.filter((item) => !existing.has(item.content));
    if (toAdd.length === 0) {
      setMaterialPickerOpen(false);
      return;
    }
    const stamp = Date.now();
    const newItems: ClauseItem[] = toAdd.map((item, i) => ({
      id: `clause-${stamp}-${i}`,
      label: "",
      content: item.content,
      meta: `${item.source} · ${item.department} · 发文 ${item.publishDate}`,
    }));
    const merged = [...clauses, ...newItems].map((clause, idx) => ({
      ...clause,
      label: `条款${idx + 1}`,
    }));
    setClauses(merged);
    setSelectedClauseIds((prev) => [...prev, ...newItems.map((item) => item.id)]);
    setMaterialPickerOpen(false);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/policy-writing")}
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
            onClick={() => navigate("/policy-writing/analysis/tasks")}
          >
            <List className="h-4 w-4" />
            历史任务列表
          </Button>
        </div>

        {/* 对比分析业务流程 */}
        <div className="shrink-0 rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">对比分析流程</h3>
            <span className="text-xs font-medium text-muted-foreground">{`第 ${flowCurrent} / ${FLOW_STEPS.length} 步`}</span>
          </div>
          <div className="flex items-center justify-center">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCurrent = flowCurrent === step.id;
              const isPending = flowCurrent < step.id;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
                        isCurrent &&
                          "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(230,0,50,0.24)]",
                        isPending && "border-[#e7ced8] bg-white text-[#d8b9c6]",
                        !isCurrent && !isPending && "border-primary/30 bg-primary/10 text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "whitespace-nowrap text-xs font-medium",
                        isPending ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <div className="-mt-5 select-none px-4 text-base leading-none text-[#d8b9c6] md:px-6">
                      {">>"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-end gap-4 border-b border-border px-5 py-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="shrink-0 rounded bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              开始AI分析
            </button>
          </div>

          <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
            {/* 左侧面板：分析类型 + 分析条款（随页面滚动） */}
            <section className="border-b border-border lg:border-b-0 lg:border-r">
              <div className="border-b border-border px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="border-l-2 border-primary pl-2 text-sm font-semibold text-foreground">分析条件</h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-primary"
                    onClick={() => setConditionsOpen((v) => !v)}
                  >
                    {conditionsOpen ? "收起" : "展开"}
                    <ChevronUp className={cn("h-3.5 w-3.5 transition-transform", !conditionsOpen && "rotate-180")} />
                  </button>
                </div>

                {conditionsOpen && (
                  <div className="text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      {CONTRAST_TYPE_OPTIONS.map((option) => {
                        const checked = contrastType === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setContrastType(option.id)}
                            className={cn(
                              "flex min-w-0 flex-col rounded-xl border px-3 py-2.5 text-left transition-all",
                              checked
                                ? "border-primary/50 bg-primary/[0.04]"
                                : "border-border bg-background hover:border-primary/25 hover:bg-muted/20",
                            )}
                            aria-pressed={checked}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                                  checked ? "border-primary" : "border-muted-foreground/40",
                                )}
                              >
                                {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </span>
                              <span
                                className={cn(
                                  "truncate text-sm font-medium",
                                  checked ? "text-primary" : "text-foreground",
                                )}
                              >
                                {option.label}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-1.5 text-[11px] leading-relaxed",
                                checked ? "text-foreground/75" : "text-muted-foreground",
                              )}
                            >
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {contrastType === "duplicate" && (
                      <FormRow label="条款字符重复率" required>
                        <select
                          value={overlapRate}
                          onChange={(e) => setOverlapRate(e.target.value)}
                          className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                        >
                          <option value="">请选择</option>
                          {OVERLAP_RATE_OPTIONS.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}
                            </option>
                          ))}
                        </select>
                      </FormRow>
                    )}

                    {showOptionalFields && (
                      <div className="mt-1 border-t border-dashed border-border pt-2">
                        <button
                          type="button"
                          className="mb-1 flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setOptionalFieldsOpen((v) => !v)}
                        >
                          <span>选填条件（发文时间、地域省市）</span>
                          <span className="inline-flex items-center gap-1 text-primary">
                            {optionalFieldsOpen ? "收起" : "展开"}
                            <ChevronUp
                              className={cn("h-3.5 w-3.5 transition-transform", !optionalFieldsOpen && "rotate-180")}
                            />
                          </span>
                        </button>

                        {optionalFieldsOpen && (
                          <>
                            <FormRow label="发文时间">
                              <div className="flex h-9 w-full items-center rounded border border-border bg-background">
                                <input
                                  type="date"
                                  value={publishDateStart}
                                  onChange={(e) => setPublishDateStart(e.target.value)}
                                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none [color-scheme:light]"
                                />
                                <span className="px-2 text-xs text-muted-foreground">~</span>
                                <input
                                  type="date"
                                  value={publishDateEnd}
                                  min={publishDateStart || undefined}
                                  onChange={(e) => setPublishDateEnd(e.target.value)}
                                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none [color-scheme:light]"
                                />
                              </div>
                            </FormRow>

                            <FormRow label="地域省市">
                              <select className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-muted-foreground outline-none focus:border-primary">
                                <option>请选择地域省市</option>
                                <option>北京市</option>
                                <option>上海市</option>
                                <option>广东省</option>
                              </select>
                            </FormRow>
                          </>
                        )}
                      </div>
                    )}

                    {contrastType === "diff" && selectedClauseIds.length !== 2 && (
                      <p className="pt-3 text-xs text-muted-foreground">异同对比需在下方勾选 2 条条款</p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">添加分析条款</h3>
                </div>

                <div className="mb-3 flex h-8 items-center justify-center rounded-sm border border-dashed border-primary/50 text-[12px] text-primary/80">
                  <button
                    type="button"
                    onClick={() => setMaterialPickerOpen(true)}
                    className="mx-1 inline-flex items-center gap-1 transition-colors hover:text-primary"
                  >
                    <span>从</span>
                    <span>▣</span>
                    <span>条款素材库添加</span>
                  </button>
                  <span className="mx-3">或</span>
                  <button
                    type="button"
                    onClick={openCustomInput}
                    className="mx-1 inline-flex items-center gap-1 transition-colors hover:text-primary"
                  >
                    <span>☰</span>
                    <span>自定义输入</span>
                  </button>
                </div>

                {customInputVisible && (
                  <div className="mb-3 rounded-lg border border-border bg-muted/15 p-3">
                    <div className="flex items-start gap-2">
                      <FilePlus className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <textarea
                        ref={customInputRef}
                        value={customInputText}
                        onChange={(e) => setCustomInputText(e.target.value)}
                        placeholder="自定义输入，在此处粘贴您要对比的内容"
                        rows={4}
                        className="min-h-[88px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-7 text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelCustomInput}
                        className="px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={confirmCustomInput}
                        disabled={!customInputText.trim()}
                        className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        确定
                      </button>
                    </div>
                  </div>
                )}

                {clauses.length > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <Checkbox
                      checked={allClausesSelected}
                      onCheckedChange={toggleSelectAllClauses}
                      className="border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm text-foreground">全选</span>
                  </div>
                )}

                {clauses.length === 0 && !customInputVisible ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center text-muted-foreground/60">
                    <div className="mb-3 h-12 w-16 rounded-xl bg-muted/40" />
                    <p className="text-sm">暂无分析条款，请从条款素材库添加或自定义输入</p>
                  </div>
                ) : clauses.length > 0 ? (
                  <div className="space-y-3">
                    {clauses.map((clause) => (
                      <div
                        key={clause.id}
                        className={cn(
                          "relative rounded-lg border border-border bg-background p-4 pb-10 pt-8 shadow-sm",
                          selectedClauseIds.includes(clause.id) && "border-primary/40",
                        )}
                      >
                        <span className="absolute left-0 top-0 rounded-br-md rounded-tl-lg bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                          {clause.label}
                        </span>
                        <div className="absolute right-3 top-3">
                          <Checkbox
                            checked={selectedClauseIds.includes(clause.id)}
                            onCheckedChange={() => toggleClause(clause.id)}
                            className="border-primary data-[state=checked]:bg-primary"
                          />
                        </div>
                        <p className="pr-8 text-sm leading-7 text-foreground">{clause.content}</p>
                        {clause.title && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            {clause.title}
                            {clause.meta ? ` ${clause.meta}` : ""}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteClause(clause.id)}
                          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="删除条款"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            {/* 右侧面板：分析结果 */}
            <section className="px-5 py-4">
              <h3 className="mb-4 border-l-2 border-primary pl-2 text-sm font-semibold text-foreground">分析结果</h3>
              {results.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/10 to-transparent px-6 py-10 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BarChart3 className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-foreground">暂无分析结果</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    完成左侧配置后，分析结果将在此展示
                  </p>
                  <div className="mt-6 w-full max-w-sm space-y-2.5 rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-left">
                    <p className="text-[11px] font-medium text-foreground/80">操作指引</p>
                    <ol className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
                          1
                        </span>
                        <span>选择分析条件（横向对比 / 查重 / 异同对比）</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
                          2
                        </span>
                        <span>添加并勾选需要分析的条款</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
                          3
                        </span>
                        <span>点击「开始 AI 分析」生成结果</span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                            {item.clauseLabel}
                          </span>
                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {item.typeLabel} - 分析结果
                          </p>
                          {item.detail.type === "duplicate" ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                              共找到{" "}
                              <span className="font-semibold text-primary">{item.detail.duplicateCount}</span>{" "}
                              条重复条款
                            </p>
                          ) : item.detail.type === "horizontal" ? null : (
                            <p className="mt-2 text-sm text-muted-foreground">{getResultSummary(item)}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">{item.finishedAt}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          分析完成
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setViewingResultId(item.id)}
                          className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          查看结果
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <ClauseMaterialPickerModal
        open={materialPickerOpen}
        onClose={() => setMaterialPickerOpen(false)}
        onConfirm={handleConfirmMaterialClauses}
        existingContents={clauses.map((clause) => clause.content)}
      />

      <CompareAnalysisResultModal
        open={viewingResultId !== null}
        result={viewingResult}
        clauses={clauses}
        onClose={() => setViewingResultId(null)}
      />
    </div>
  );
}
