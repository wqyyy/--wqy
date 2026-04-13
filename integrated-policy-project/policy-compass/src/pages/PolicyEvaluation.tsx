import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Target,
  Layers,
  Users,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ClipboardList,
  BrainCircuit,
  PenLine,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



const recentPolicies = ["北京经开区产业发展促进办法", "科技创新企业扶持专项", "中小企业融资支持政策"];

const dimensions = [
  { title: "计划偏移度分析", desc: "对比政策预期目标与实际执行效果的偏离程度", icon: Target, bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-primary" },
  { title: "政策工具多样性", desc: "评估政策所使用的工具类型丰富程度", icon: Layers, bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { title: "扶持范围分析", desc: "分析政策覆盖的行业、区域与企业类型", icon: Users, bg: "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-600" },
  { title: "扶持力度分析", desc: "量化政策在资金、税收等方面的支持强度", icon: TrendingUp, bg: "bg-teal-50", iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { title: "政策效果分析", desc: "综合评估政策实施后的经济社会效益", icon: BarChart3, bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
];

const recentTasks = [
  { name: "北京经开区产业发展促进办法", status: "completed", label: "已完成", time: "2024-03-20", color: "text-green-600", bgColor: "bg-green-50 border-green-200", StatusIcon: CheckCircle2 },
  { name: "科技创新企业扶持专项", status: "in-progress", label: "进行中", time: "2024-03-19", color: "text-orange-500", bgColor: "bg-orange-50 border-orange-200", StatusIcon: Clock },
  { name: "中小企业融资支持政策", status: "editing", label: "编辑中", time: "2024-03-18", color: "text-orange-500", bgColor: "bg-orange-50 border-orange-200", StatusIcon: Clock },
];

const PolicyEvaluation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header + Flow + Stats in one row */}
      <div className="flex gap-6 items-stretch">
        {/* Left: Header + Flow */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">政策评价</h1>
            <p className="text-sm text-muted-foreground mt-1">
              针对发布政策，提供多维分析、智能诊断与报告生成能力
            </p>
          </div>

          {/* 政策评价流程 */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">政策评价流程</h3>
            <div className="flex items-center justify-between overflow-x-auto">
              {[
                { label: "选择政策", icon: ClipboardList, highlight: false },
                 { label: "智能分析", icon: BrainCircuit, highlight: false },
                 { label: "编辑润色", icon: PenLine, highlight: false },
                { label: "导出报告", icon: Download, highlight: false },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-2 min-w-[80px]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.highlight ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs whitespace-nowrap ${step.highlight ? "text-primary font-semibold" : "text-muted-foreground"}`}>{step.label}</span>
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
        </div>

        {/* Right: Stats Card */}
        <div className="w-72 shrink-0 rounded-xl bg-primary text-primary-foreground p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest opacity-80 mb-2">TOTAL INSIGHTS</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">28</span>
              <span className="text-lg opacity-80">份</span>
            </div>
            <p className="text-sm mt-1 opacity-90">已评估政策数</p>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-foreground/20">
            <span className="text-xs opacity-80">本月新增: +5</span>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <TrendingUp className="w-3.5 h-3.5" />
              12%
            </div>
          </div>
        </div>
      </div>

      {/* 选择待评估政策 */}
      <Card className="border-2 border-primary shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-2 pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-bold">选择待评估政策</CardTitle>
              <span className="px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">从这里开始</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 ml-[52px]">搜索并选择您要评估的政策，然后开始分析</p>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索政策名称/关键词"
                className="pl-10 h-12 text-base rounded-lg border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base font-semibold rounded-lg" onClick={() => navigate("/policy-analysis")}>开始评估</Button>
          </div>
        </CardContent>
      </Card>

      {/* 核心评估维度 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">核心评估维度</h3>
        <div className="grid grid-cols-5 gap-4">
          {dimensions.map((d) => (
            <div
              key={d.title}
              className={`${d.bg} rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 rounded-xl ${d.iconBg} flex items-center justify-center mb-4`}>
                <d.icon className={`w-6 h-6 ${d.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{d.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 最近评估任务 */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">最近评估任务</h3>
        <div className="grid grid-cols-3 gap-4">
          {recentTasks.map((t) => (
            <div key={t.name} className="border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-base font-semibold text-foreground mb-4">{t.name}</p>
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${t.bgColor} ${t.color}`}>
                  <t.StatusIcon className="w-3.5 h-3.5" />
                  {t.label}
                </div>
                <span className="text-sm text-muted-foreground">{t.time}</span>
              </div>
              <button className="flex items-center gap-1.5 text-primary text-sm hover:underline mx-auto">
                <Eye className="w-4 h-4" />
                查看详情
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PolicyEvaluation;
