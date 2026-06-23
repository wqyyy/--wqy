import {
  BarChart3,
  Building2,
  Check,
  PieChart,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ENTERPRISE_ANALYSIS_OPTIONS,
  FUND_ANALYSIS_OPTIONS,
  ITEM_ANALYSIS_OPTIONS,
} from "@/components/policy-report/policyReportMockData";

type DimensionCategory = {
  id: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  accent: string;
  iconBg: string;
  options: string[];
};

const DIMENSION_CATEGORIES: DimensionCategory[] = [
  {
    id: "items",
    title: "已发布事项分析",
    description: "从事项类型、时间、主管部门等维度刻画已发布兑现事项结构。",
    icon: BarChart3,
    accent: "text-blue-600",
    iconBg: "bg-blue-50",
    options: ITEM_ANALYSIS_OPTIONS,
  },
  {
    id: "funds",
    title: "已拨付资金分析",
    description: "分析资金拨付规模、行业与领域分布，识别重点投入方向。",
    icon: PieChart,
    accent: "text-emerald-600",
    iconBg: "bg-emerald-50",
    options: FUND_ANALYSIS_OPTIONS,
  },
  {
    id: "enterprises",
    title: "已申报企业分析",
    description: "从企业性质、规模、空间分布等角度洞察申报主体画像。",
    icon: Building2,
    accent: "text-amber-600",
    iconBg: "bg-amber-50",
    options: ENTERPRISE_ANALYSIS_OPTIONS,
  },
];

function countDimensions(selected: string[]) {
  return selected.filter((item) => item !== "全选").length;
}

type DimensionCategoryCardProps = {
  category: DimensionCategory;
  selected: string[];
  onChange: (next: string[]) => void;
};

function DimensionCategoryCard({ category, selected, onChange }: DimensionCategoryCardProps) {
  const Icon = category.icon;
  const allSelected = selected.length === category.options.length;
  const selectedCount = countDimensions(selected);

  const toggle = (item: string) => {
    if (item === "全选") {
      onChange(allSelected ? [] : [...category.options]);
      return;
    }
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-gradient-to-r from-[#faf8f8] to-white px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", category.iconBg)}>
            <Icon className={cn("h-5 w-5", category.accent)} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{category.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          已选 {selectedCount}
        </Badge>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">分析维度</span>
          <button
            type="button"
            onClick={() => toggle("全选")}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allSelected ? "取消全选" : "全选本类"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {category.options
            .filter((item) => item !== "全选")
            .map((item) => {
              const active = selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {item}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export function getAutoReportTitle(itemCount: number) {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月政策兑现专报（${itemCount}项）`;
}

export function getTotalSelectedDimensions(
  itemAnalysis: string[],
  fundAnalysis: string[],
  enterpriseAnalysis: string[],
) {
  return countDimensions(itemAnalysis) + countDimensions(fundAnalysis) + countDimensions(enterpriseAnalysis);
}

type ReportDimensionStepProps = {
  selectedItemCount: number;
  itemAnalysis: string[];
  fundAnalysis: string[];
  enterpriseAnalysis: string[];
  onItemAnalysisChange: (next: string[]) => void;
  onFundAnalysisChange: (next: string[]) => void;
  onEnterpriseAnalysisChange: (next: string[]) => void;
  footer: ReactNode;
};

export function ReportDimensionStep({
  itemAnalysis,
  fundAnalysis,
  enterpriseAnalysis,
  onItemAnalysisChange,
  onFundAnalysisChange,
  onEnterpriseAnalysisChange,
  footer,
}: ReportDimensionStepProps) {
  const totalDimensions = getTotalSelectedDimensions(itemAnalysis, fundAnalysis, enterpriseAnalysis);

  const selections = [
    { label: "事项分析", value: itemAnalysis, onChange: onItemAnalysisChange },
    { label: "资金分析", value: fundAnalysis, onChange: onFundAnalysisChange },
    { label: "企业分析", value: enterpriseAnalysis, onChange: onEnterpriseAnalysisChange },
  ] as const;

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">选择专报维度</h2>
        <p className="mt-1 text-sm text-muted-foreground">勾选纳入专报的分析维度，系统将按类别自动生成图表与结论。</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-1">
        {DIMENSION_CATEGORIES.map((category, index) => (
          <DimensionCategoryCard
            key={category.id}
            category={category}
            selected={selections[index].value}
            onChange={selections[index].onChange}
          />
        ))}
      </div>

      {totalDimensions === 0 && (
        <p className="text-center text-sm text-destructive">请至少选择一个分析维度</p>
      )}

      {footer}
    </div>
  );
}
