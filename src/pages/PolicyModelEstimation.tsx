import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type SupportMethod = "fixed_amount" | "fixed_ratio" | "review";
type ConditionKind = "calculation" | "estimation";

interface PolicyCondition {
  id: string;
  label: string;
  value: string;
  editable: boolean;
  kind: ConditionKind;
}

interface EstimateRow {
  id: string;
  companyType: string;
  minCount: number;
  maxCount: number;
  minAvgAmount: number;
  maxAvgAmount: number;
}

interface HistoricalClause {
  id: string;
  itemName: string;
  clauseTitle: string;
  dimensions: string[];
  companyCount: number;
  amount: number;
}

const historyClauses: HistoricalClause[] = [
  {
    id: "hist-1",
    itemName: "高精尖产业研发奖励",
    clauseTitle: "对经开区注册满3年且高新技术企业给予研发投入补贴",
    dimensions: ["注册地:经开区", "注册年限:>=3年", "资质:高新技术企业", "研发投入:增长"],
    companyCount: 78,
    amount: 4680,
  },
  {
    id: "hist-2",
    itemName: "制造业数字化升级专项",
    clauseTitle: "支持制造业企业开展数字化改造并给予固定比例补贴",
    dimensions: ["注册地:经开区", "行业:制造业", "营收:>=5000万", "数字化改造:实施"],
    companyCount: 52,
    amount: 6240,
  },
];

const publicSearchResults = [
  {
    title: "国家统计局：规模以上工业企业主要指标",
    source: "国家统计局",
    scene: "行业统计数据",
  },
  {
    title: "企查查行业企业分布查询",
    source: "企查查",
    scene: "企业基础信息",
  },
  {
    title: "艾瑞咨询：产业数字化年度报告",
    source: "艾瑞咨询",
    scene: "第三方行业报告",
  },
];

function calculateOverlap(current: string[], historical: string[]) {
  const currentSet = new Set(current);
  const historySet = new Set(historical);
  let intersect = 0;
  for (const item of currentSet) {
    if (historySet.has(item)) intersect += 1;
  }
  const union = new Set([...currentSet, ...historySet]).size;
  if (union === 0) return 0;
  return Math.round((intersect / union) * 100);
}

function computeSummary(rows: EstimateRow[]) {
  const minCompanies = rows.reduce((sum, row) => sum + row.minCount, 0);
  const maxCompanies = rows.reduce((sum, row) => sum + row.maxCount, 0);
  const minBudget = rows.reduce((sum, row) => sum + row.minCount * row.minAvgAmount, 0);
  const maxBudget = rows.reduce((sum, row) => sum + row.maxCount * row.maxAvgAmount, 0);
  return { minCompanies, maxCompanies, minBudget, maxBudget };
}

const createRow = (suffix: number): EstimateRow => ({
  id: `row-${Date.now()}-${suffix}`,
  companyType: "新增企业类型",
  minCount: 5,
  maxCount: 10,
  minAvgAmount: 20,
  maxAvgAmount: 40,
});

export default function PolicyModelEstimation() {
  const navigate = useNavigate();
  const [clauseContent, setClauseContent] = useState(
    "聚焦医药健康、自动驾驶、具身智能、工业制造等领域，支持企业事业单位建设高质量人工智能语料库和行业数据库。",
  );

  const [calculationConditions, setCalculationConditions] = useState<PolicyCondition[]>([]);
  const [estimationConditions, setEstimationConditions] = useState<PolicyCondition[]>([
    { id: "e1", label: "产业链位置", value: "数据要素流通服务商", editable: true, kind: "estimation" },
    { id: "e2", label: "场景能力", value: "具备行业大模型应用落地案例", editable: true, kind: "estimation" },
  ]);
  const [supportMethod, setSupportMethod] = useState<SupportMethod>("fixed_ratio");
  const [supportStrength, setSupportStrength] = useState("按项目投入的 30% 补贴，单家企业最高 200 万元");
  const [ratioMetric, setRatioMetric] = useState("项目实际投资额");

  const [thinkingOpen, setThinkingOpen] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingLines, setThinkingLines] = useState<string[]>([]);
  const [resultTab, setResultTab] = useState("estimate");
  const [tableEditable, setTableEditable] = useState(false);
  const [rows, setRows] = useState<EstimateRow[]>([
    { id: "r1", companyType: "数据流通基础设施企业", minCount: 18, maxCount: 26, minAvgAmount: 35, maxAvgAmount: 48 },
    { id: "r2", companyType: "场景应用服务企业", minCount: 25, maxCount: 40, minAvgAmount: 18, maxAvgAmount: 30 },
  ]);

  const currentDimensions = useMemo(
    () =>
      [...calculationConditions, ...estimationConditions]
        .map((c) => `${c.label}:${c.value}`)
        .filter(Boolean),
    [calculationConditions, estimationConditions],
  );

  const bestHistoryMatch = useMemo(() => {
    return historyClauses
      .map((item) => ({ item, overlap: calculateOverlap(currentDimensions, item.dimensions) }))
      .sort((a, b) => b.overlap - a.overlap)[0];
  }, [currentDimensions]);

  const estimateScene = useMemo(() => {
    if (bestHistoryMatch && bestHistoryMatch.overlap > 80) return "场景一：历史相似条款";
    if (calculationConditions.length > 0) return "场景二：部分企业信息支撑";
    if (publicSearchResults.length > 0) return "场景三：公开数据估算";
    return "场景四：模型知识推理";
  }, [bestHistoryMatch, calculationConditions.length]);

  const summary = useMemo(() => computeSummary(rows), [rows]);
  const hasEstimateConditions = estimationConditions.length > 0;
  const canRun = calculationConditions.length > 0 || estimationConditions.length > 0;

  const updateConditionValue = (
    id: string,
    value: string,
    kind: ConditionKind,
  ) => {
    const setter = kind === "calculation" ? setCalculationConditions : setEstimationConditions;
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const removeEstimateCondition = (id: string) => {
    setEstimationConditions((prev) => prev.filter((item) => item.id !== id));
  };

  const analyzeClause = () => {
    const text = clauseContent.trim();
    if (!text) return;
    const calc: PolicyCondition[] = [];
    const estimate: PolicyCondition[] = [];
    const nextId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

    if (/经开区|北京|亦庄/.test(text)) {
      calc.push({ id: `c-${nextId()}`, label: "注册地", value: "北京经开区", editable: true, kind: "calculation" });
    }
    const yearMatch = text.match(/(\d+)年/);
    if (yearMatch) {
      calc.push({
        id: `c-${nextId()}`,
        label: "注册年限",
        value: `>=${yearMatch[1]}年`,
        editable: true,
        kind: "calculation",
      });
    }
    if (/高新/.test(text)) {
      calc.push({ id: `c-${nextId()}`, label: "企业资质", value: "高新技术企业", editable: true, kind: "calculation" });
    }
    if (/专精特新/.test(text)) {
      calc.push({ id: `c-${nextId()}`, label: "企业资质", value: "专精特新", editable: true, kind: "calculation" });
    }
    const revenueMatch = text.match(/营收[^0-9]*(\d+)/);
    if (revenueMatch) {
      calc.push({
        id: `c-${nextId()}`,
        label: "营收",
        value: `>=${revenueMatch[1]}万元`,
        editable: true,
        kind: "calculation",
      });
    }

    if (/自动驾驶|具身智能|工业制造|医药健康|人工智能|大模型|语料库|行业数据库/.test(text)) {
      estimate.push({
        id: `e-${nextId()}`,
        label: "产业领域",
        value: "属于医药健康/自动驾驶/具身智能/工业制造四类之一",
        editable: true,
        kind: "estimation",
      });
      estimate.push({
        id: `e-${nextId()}`,
        label: "能力要求",
        value: "建设开放人工智能语料库或行业数据库",
        editable: true,
        kind: "estimation",
      });
    }

    if (estimate.length === 0) {
      estimate.push({
        id: `e-${nextId()}`,
        label: "行业特征",
        value: "条款包含标签库外行业条件，需模型估算",
        editable: true,
        kind: "estimation",
      });
    }

    setCalculationConditions(calc);
    setEstimationConditions(estimate);
  };

  const runEstimation = () => {
    if (!canRun || isThinking) return;
    setIsThinking(true);
    setThinkingOpen(true);
    setThinkingLines([]);
    setResultTab(hasEstimateConditions ? "estimate" : "calculation");

    const lines = [
      `识别估算场景：${estimateScene}。`,
      bestHistoryMatch && bestHistoryMatch.overlap > 80
        ? `命中历史条款「${bestHistoryMatch.item.clauseTitle}」，条件重合度 ${bestHistoryMatch.overlap}%。`
        : "未命中>80%历史条款，进入综合估算流程。",
      "综合企业基础信息、行业统计与第三方报告进行企业规模区间推理。",
      "结合扶持方式与扶持力度，计算资金预算区间。",
      "生成可编辑测算表，支持人工修正后重新计算。",
    ];

    let index = 0;
    const timer = window.setInterval(() => {
      setThinkingLines((prev) => [...prev, lines[index]]);
      index += 1;
      if (index >= lines.length) {
        window.clearInterval(timer);
        setIsThinking(false);
        setThinkingOpen(false);
      }
    }, 800);
  };

  const updateRow = (id: string, key: keyof EstimateRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (key === "companyType") return { ...row, companyType: value };
        const numeric = Number(value);
        return { ...row, [key]: Number.isNaN(numeric) ? 0 : numeric };
      }),
    );
  };

  const addRow = () => setRows((prev) => [...prev, createRow(prev.length + 1)]);

  const actionLabel = hasEstimateConditions ? "开始估算" : "开始测算";

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <button
          onClick={() => navigate("/policy-writing")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回政策制定
        </button>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Card className="space-y-5 border border-border p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">政策测算 - 模型估算</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                当存在标签库外条件时，结合历史兑现与公开数据进行估算，并输出推理过程。
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">条款内容</Label>
              <Textarea
                value={clauseContent}
                onChange={(e) => setClauseContent(e.target.value)}
                className="min-h-[110px]"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <Button size="sm" onClick={analyzeClause}>智能解析</Button>
                <span className="text-xs text-muted-foreground">{clauseContent.length}/500</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">测算条件（可编辑）</Label>
              {calculationConditions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  当前条款暂无法获取精准的企业数据，您可以手动添加。
                </p>
              ) : (
                <div className="space-y-2">
                  {calculationConditions.map((item) => (
                    <div key={item.id} className="grid grid-cols-[120px_1fr] items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <Input
                        value={item.value}
                        onChange={(e) => updateConditionValue(item.id, e.target.value, "calculation")}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasEstimateConditions && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">估算条件（智能解析生成，可编辑/删除）</Label>
                <div className="space-y-2">
                  {estimationConditions.map((item) => (
                    <div key={item.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <Input
                        value={item.value}
                        onChange={(e) => updateConditionValue(item.id, e.target.value, "estimation")}
                        className="h-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeEstimateCondition(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">扶持方式</Label>
                <Select value={supportMethod} onValueChange={(v) => setSupportMethod(v as SupportMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_amount">固定金额</SelectItem>
                    <SelectItem value="fixed_ratio">固定比例</SelectItem>
                    <SelectItem value="review">评审认定</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {supportMethod === "fixed_ratio" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">比例依据指标</Label>
                  <Input value={ratioMetric} onChange={(e) => setRatioMetric(e.target.value)} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">扶持力度</Label>
              <Textarea
                value={supportStrength}
                onChange={(e) => setSupportStrength(e.target.value)}
                className="min-h-[84px]"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              当前估算场景：<span className="font-medium text-foreground">{estimateScene}</span>
              {bestHistoryMatch && (
                <span className="ml-2">（历史条款最高重合度 {bestHistoryMatch.overlap}%）</span>
              )}
            </div>

            <Button className="w-full" disabled={!canRun || isThinking} onClick={runEstimation}>
              {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {actionLabel}
            </Button>
          </Card>

          <Card className="space-y-4 border border-border p-5">
            <h3 className="text-base font-semibold text-foreground">测算结果</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">扶持企业数量</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{summary.minCompanies} - {summary.maxCompanies} 家</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">总扶持金额预算</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{summary.minBudget} - {summary.maxBudget} 万元</p>
              </div>
            </div>

            <Tabs value={resultTab} onValueChange={setResultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="estimate">估算结果</TabsTrigger>
                <TabsTrigger value="calculation">测算结果</TabsTrigger>
              </TabsList>

              <TabsContent value="estimate" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">思考过程</h4>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setThinkingOpen((v) => !v)}
                    type="button"
                  >
                    {thinkingOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {isThinking ? "深度思考中" : "已完成深度思考"}
                  </button>
                </div>
                {thinkingOpen && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs leading-6 text-muted-foreground">
                    {thinkingLines.length === 0 ? "点击开始估算后展示思考过程..." : thinkingLines.map((line, idx) => <p key={idx}>{line}</p>)}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    汇总企业类型、企业数量区间和平均扶持金额区间，支持编辑后重新计算。
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setTableEditable((v) => !v)}>
                      {tableEditable ? "完成编辑" : "编辑表格"}
                    </Button>
                    {tableEditable && (
                      <Button size="sm" variant="outline" onClick={addRow}>
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        添加行
                      </Button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-muted/30 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">企业类型</th>
                        <th className="px-3 py-2 text-left">企业数量区间</th>
                        <th className="px-3 py-2 text-left">平均扶持金额区间（万元）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="px-3 py-2">
                            {tableEditable ? (
                              <Input value={row.companyType} onChange={(e) => updateRow(row.id, "companyType", e.target.value)} />
                            ) : (
                              row.companyType
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {tableEditable ? (
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <Input type="number" value={row.minCount} onChange={(e) => updateRow(row.id, "minCount", e.target.value)} />
                                <span>-</span>
                                <Input type="number" value={row.maxCount} onChange={(e) => updateRow(row.id, "maxCount", e.target.value)} />
                              </div>
                            ) : (
                              `${row.minCount} - ${row.maxCount}`
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {tableEditable ? (
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <Input type="number" value={row.minAvgAmount} onChange={(e) => updateRow(row.id, "minAvgAmount", e.target.value)} />
                                <span>-</span>
                                <Input type="number" value={row.maxAvgAmount} onChange={(e) => updateRow(row.id, "maxAvgAmount", e.target.value)} />
                              </div>
                            ) : (
                              `${row.minAvgAmount} - ${row.maxAvgAmount}`
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button variant="outline" onClick={() => setRows((prev) => [...prev])}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重新计算
                </Button>
              </TabsContent>

              <TabsContent value="calculation" className="space-y-3">
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  以下是依据左侧测算条件得出的部分企业。因未依据全部条件进行测算，可能存在较大偏差，数据仅供参考。
                </p>
                <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                  <p>可测算企业数量：42 家</p>
                  <p>对应资金规模：约 2100 万元</p>
                  <p className="text-xs text-muted-foreground">示例企业：亦庄数据科技、经开数联、智算创新（仅演示）</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <h4 className="text-sm font-medium text-foreground">检索结果（互联网 + 本地）</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                {publicSearchResults.map((item) => (
                  <p key={item.title}>[{item.scene}] {item.title} · {item.source}</p>
                ))}
                <p>[本地兑现事项] 仅展示经开区已兑现条款，可跳转查看事项详情与兑现结果。</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
