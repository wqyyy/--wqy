import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  FileText,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Download,
  CircleAlert,
  Lightbulb,
  Building2,
  Filter,
  FileBarChart2,
  BookOpen,
  BookMarked,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/PageHero";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isPolicyEvaluated,
  policyEvaluationChangedEvent,
} from "@/lib/policyEvaluationCompleted";

type EvalPolicy = {
  id: string;
  title: string;
  department: string;
  domain: string;
  publishYear: string;
  publishDate: string;
};

const EVAL_POLICIES: EvalPolicy[] = [
  {
    id: "pe-1",
    title: "北京经开区产业发展促进办法",
    department: "北京经济技术开发区经济发展局",
    domain: "产业扶持",
    publishYear: "2024",
    publishDate: "2024-06-12",
  },
  {
    id: "pe-2",
    title: "科技创新企业扶持专项实施细则",
    department: "北京经济技术开发区科技创新局",
    domain: "科技创新",
    publishYear: "2025",
    publishDate: "2025-03-01",
  },
  {
    id: "pe-3",
    title: "中小企业融资支持政策（试行）",
    department: "北京经济技术开发区财政金融局",
    domain: "金融服务",
    publishYear: "2025",
    publishDate: "2025-01-18",
  },
  {
    id: "pe-4",
    title: "关于支持外商投资企业高质量发展的若干政策",
    department: "北京经济技术开发区商务金融局",
    domain: "对外开放",
    publishYear: "2024",
    publishDate: "2024-09-20",
  },
  {
    id: "pe-5",
    title: "人才引进与高层次人才服务办法",
    department: "北京经济技术开发区工委组织人事部",
    domain: "人才服务",
    publishYear: "2023",
    publishDate: "2023-11-05",
  },
  {
    id: "pe-6",
    title: "绿色低碳高质量发展若干措施",
    department: "北京经济技术开发区经济发展局",
    domain: "绿色低碳",
    publishYear: "2025",
    publishDate: "2025-07-22",
  },
];

/** 与政策触达页数据概览卡片同结构、同间距，保证高度一致 */
const EVAL_OVERVIEW_STATS = [
  {
    label: "已生成评估报告",
    value: "28",
    unit: "份",
    note: "含导出与归档报告",
    icon: FileBarChart2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "已评估政策",
    value: "13",
    unit: "篇",
    note: "已完成评价分析的政策",
    icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    label: "未评估政策",
    value: "15",
    unit: "篇",
    note: "待启动评价的政策条目",
    icon: BookMarked,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
] as const;

const PolicyEvaluation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autostart = searchParams.get("autostart") === "1";

  const [keyword, setKeyword] = useState(
    () => searchParams.get("policy") ?? searchParams.get("query") ?? ""
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [evalTick, setEvalTick] = useState(0);

  useEffect(() => {
    setKeyword(searchParams.get("policy") ?? searchParams.get("query") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const bump = () => setEvalTick((t) => t + 1);
    window.addEventListener(policyEvaluationChangedEvent, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(policyEvaluationChangedEvent, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  /** 自动跳转：来自助手推送且 autostart=1 时直接进入评估 */
  useEffect(() => {
    const policyParam = searchParams.get("policy");
    if (autostart && policyParam) {
      navigate(`/policy-analysis?policy=${encodeURIComponent(policyParam)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentOptions = useMemo(() => {
    const set = new Set(EVAL_POLICIES.map((p) => p.department));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const filteredPolicies = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return EVAL_POLICIES.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !p.department.toLowerCase().includes(q)) {
        return false;
      }
      if (departmentFilter !== "all" && p.department !== departmentFilter) return false;
      return true;
    });
  }, [keyword, departmentFilter, evalTick]);

  const urlPolicyTitle = searchParams.get("policy")?.trim();

  const evaluated = (title: string) => isPolicyEvaluated(title);

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <PageHero
          title="政策评价"
          description="面向政策统筹和决策人员，基于数据分析评估政策效果并提供优化建议。"
        />

        {/* 评价流程 */}
        <Card className="h-[156px] rounded-2xl border border-border bg-card px-5 py-4 flex items-center">
          <div className="w-full flex items-center justify-between overflow-x-auto">
            {[
              { label: "选择评估政策", icon: Search },
              { label: "整体情况分析", icon: FileText },
              { label: "内容逐条分析", icon: ClipboardList },
              { label: "实施效果分析", icon: BarChart3 },
              { label: "存在问题分析", icon: CircleAlert },
              { label: "优化建议分析", icon: Lightbulb },
              { label: "导出报告", icon: Download },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs whitespace-nowrap text-foreground font-medium">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-center shrink-0 -mt-5">
                    <ChevronRight className="w-5 h-5 text-primary/40" />
                    <ChevronRight className="w-5 h-5 text-primary/40 -ml-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 数据概览（布局与政策触达页 reachOverviewStats 一致） */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {EVAL_OVERVIEW_STATS.map((stat) => (
            <Card key={stat.label} className="border border-border px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                    <span className="pb-1 text-sm text-muted-foreground">{stat.unit}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.note}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 政策列表 + 筛选（与页面同宽） */}
        <Card className="w-full border-2 border-primary/25 shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-6 border-b border-border/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">政策列表</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    筛选后选择政策，进入政策评价分析流程
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                共 {filteredPolicies.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-4 pt-3">
            {urlPolicyTitle && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
                当前链接已携带政策「<span className="font-medium text-primary">{urlPolicyTitle}</span>
                」，可在下方列表中定位该政策并点击「开始评估」或「重新评估」。
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              筛选条件
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="政策名称 / 部门关键词"
                  className="pl-9 h-10"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="发布部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  {departmentOptions
                    .filter((d) => d !== "all")
                    .map((d) => (
                      <SelectItem key={d} value={d}>
                        {d.length > 36 ? `${d.slice(0, 36)}…` : d}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border divide-y divide-border max-h-[min(520px,55vh)] overflow-y-auto">
              {filteredPolicies.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  没有符合筛选条件的政策，请调整条件后重试。
                </div>
              ) : (
                filteredPolicies.map((p) => {
                  const active = urlPolicyTitle === p.title;
                  const done = evaluated(p.title);
                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                        active ? "bg-primary/5" : "hover:bg-muted/40"
                      } transition-colors`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-sm font-semibold text-foreground leading-snug">{p.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="line-clamp-1">{p.department}</span>
                          <span className="text-border">|</span>
                          <Badge variant="outline" className="font-normal">
                            {p.domain}
                          </Badge>
                          <span>{p.publishDate}</span>
                          {done && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-primary-foreground">
                              已评估
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        className="shrink-0 sm:ml-4"
                        variant={done ? "outline" : "default"}
                        onClick={() =>
                          navigate(`/policy-analysis?policy=${encodeURIComponent(p.title)}`)
                        }
                      >
                        {done ? "重新评估" : "开始评估"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolicyEvaluation;
