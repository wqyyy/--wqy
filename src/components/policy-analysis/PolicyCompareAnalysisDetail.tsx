import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChevronUp, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type ContrastType = "horizontal" | "duplicate" | "diff";

type ClauseItem = {
  id: string;
  label: string;
  content: string;
  title?: string;
  meta?: string;
};

type AnalysisResultItem = {
  id: string;
  clauseLabel: string;
  typeLabel: string;
  summary: string;
  finishedAt: string;
};

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

const defaultResults: AnalysisResultItem[] = [
  {
    id: "r1",
    clauseLabel: "条款1",
    typeLabel: "查重",
    summary: "共找到 20 条重复条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r2",
    clauseLabel: "条款1",
    typeLabel: "横向对比",
    summary: "共找到 0 条相似条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r3",
    clauseLabel: "条款2",
    typeLabel: "查重",
    summary: "共找到 13 条重复条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r4",
    clauseLabel: "条款2",
    typeLabel: "横向对比",
    summary: "共找到 0 条相似条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r5",
    clauseLabel: "条款3",
    typeLabel: "查重",
    summary: "共找到 0 条重复条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r6",
    clauseLabel: "条款3",
    typeLabel: "横向对比",
    summary: "共找到 0 条相似条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r7",
    clauseLabel: "条款4",
    typeLabel: "查重",
    summary: "共找到 0 条重复条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r8",
    clauseLabel: "条款4",
    typeLabel: "横向对比",
    summary: "共找到 0 条相似条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r9",
    clauseLabel: "条款5",
    typeLabel: "查重",
    summary: "共找到 0 条重复条款",
    finishedAt: "2023-09-13 16:10:50",
  },
  {
    id: "r10",
    clauseLabel: "条款5",
    typeLabel: "横向对比",
    summary: "共找到 0 条相似条款",
    finishedAt: "2023-09-13 16:10:50",
  },
];

type PolicyCompareAnalysisDetailProps = {
  taskName: string;
  isNew?: boolean;
};

export function PolicyCompareAnalysisDetail({ taskName, isNew = false }: PolicyCompareAnalysisDetailProps) {
  const navigate = useNavigate();
  const [contrastType, setContrastType] = useState<ContrastType>("duplicate");
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [overlapRate, setOverlapRate] = useState("0%");
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>(() =>
    isNew ? [] : defaultClauses.map((c) => c.id),
  );
  const [hasAnalyzed, setHasAnalyzed] = useState(!isNew);

  const clauses = isNew ? [] : defaultClauses;
  const results = hasAnalyzed ? defaultResults : [];

  const toggleClause = (id: string) => {
    setSelectedClauseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAnalyze = () => {
    if (selectedClauseIds.length === 0) return;
    setHasAnalyzed(true);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto p-5 md:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-5">
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="shrink-0 border-b border-border px-5 py-3">
            <h2 className="text-base font-semibold text-foreground">{taskName}</h2>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
        <section className="min-h-0 overflow-y-auto border-r border-[#dfe3ea] px-4 py-3">
          <div className="mb-3 flex h-8 items-center justify-center rounded-sm border border-dashed border-[#b72845] text-[12px] text-[#7b1f33]">
            <span className="mx-1">从</span>
            <span className="mx-1">▣</span>
            <span className="mx-1">条款储备库添加</span>
            <span className="mx-3">或</span>
            <span className="mx-1">☰</span>
            <span className="mx-1">自定义输入</span>
          </div>

          {clauses.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-[#c7cbd3]">
              <div className="mb-3 h-12 w-16 rounded-xl bg-[#f6f7f9]" />
              <p className="text-sm">暂无相关内容</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className={cn(
                    "relative rounded-lg border border-[#e8ebf0] bg-white p-4 pt-8 shadow-sm",
                    selectedClauseIds.includes(clause.id) && "border-primary/40",
                  )}
                >
                  <span className="absolute left-0 top-0 rounded-br-md rounded-tl-lg bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
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
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 overflow-y-auto border-b border-[#eef0f4] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="border-l-2 border-primary pl-2 text-sm font-semibold text-foreground">分析条件</h3>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-primary"
                onClick={() => setConditionsOpen((v) => !v)}
              >
                收起
                <ChevronUp className={cn("h-3.5 w-3.5 transition-transform", !conditionsOpen && "rotate-180")} />
              </button>
            </div>

            {conditionsOpen && (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="w-24 shrink-0 text-right text-foreground">
                    <span className="text-primary">*</span> 任务类型:
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="contrastType"
                      checked={contrastType === "horizontal"}
                      onChange={() => setContrastType("horizontal")}
                      className="accent-primary"
                    />
                    横向对比
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="contrastType"
                      checked={contrastType === "duplicate"}
                      onChange={() => setContrastType("duplicate")}
                      className="accent-primary"
                    />
                    查重
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="contrastType"
                      checked={contrastType === "diff"}
                      onChange={() => setContrastType("diff")}
                      className="accent-primary"
                    />
                    异同对比
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="w-24 shrink-0 text-right text-foreground">
                    <span className="text-primary">*</span> 条款字词重合率:
                  </label>
                  <select
                    value={overlapRate}
                    onChange={(e) => setOverlapRate(e.target.value)}
                    className="h-8 min-w-[120px] flex-1 rounded border border-[#e5e7eb] bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option>0%</option>
                    <option>20%</option>
                    <option>50%</option>
                    <option>80%</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="w-24 shrink-0 text-right text-foreground">发文时间:</label>
                  <div className="flex h-8 min-w-0 flex-1 items-center rounded border border-[#e5e7eb] bg-white text-[#b8bec8]">
                    <input placeholder="开始日期" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
                    <span className="px-2">→</span>
                    <input placeholder="结束日期" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
                    <span className="px-3 text-xs">▣</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="w-24 shrink-0 text-right text-foreground">地域省市:</label>
                  <select className="h-8 min-w-0 flex-1 rounded border border-[#e5e7eb] bg-white px-3 text-sm text-[#b8bec8] outline-none focus:border-primary">
                    <option>请选择省市</option>
                    <option>北京市</option>
                    <option>上海市</option>
                    <option>广东省</option>
                  </select>
                </div>

                <div className="pl-28">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    className="rounded bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    开始AI分析
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <h3 className="mb-4 border-l-2 border-primary pl-2 text-sm font-semibold text-foreground">分析结果</h3>
            {results.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-[#c7cbd3]">
                <div className="mb-3 h-12 w-16 rounded-xl bg-[#f6f7f9]" />
                <p className="text-sm">暂无分析结果</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#e8ebf0] bg-[#fafbfc] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.clauseLabel} - {item.typeLabel} - 分析结果
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
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
                        className="rounded border border-primary bg-white px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                      >
                        查看结果
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
          </div>
        </div>
      </div>
    </div>
  );
}
