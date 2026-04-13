import { useNavigate } from "react-router-dom";
import { FileText, BarChart3, Award, ArrowRight, BookOpen, Building2, Bot, Wallet, RefreshCw, ChevronRight, Eye, Clock, ClipboardList, DollarSign, Users, BadgeCheck, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/PageHero";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        {/* Header + 流程 */}
        <div className="space-y-3">
          <PageHero
            title="政策兑现"
            description="面向政策执行人员，支持企业评优、效果监测与专报生成，实时掌握兑现情况。"
          />

          {/* 政策兑现流程 */}
          <Card className="h-[156px] rounded-2xl border border-border bg-card px-5 py-4 flex items-center">
            <div className="w-full flex items-center justify-between overflow-x-auto">
              {[
                { label: "企业申报", icon: Building2, highlight: false, iconSoft: true },
                { label: "申报受理与审核", icon: ClipboardList, highlight: true, iconSoft: true },
                { label: "企业智能评优", icon: Award, highlight: false, iconSoft: false },
                { label: "确定扶持结果", icon: BadgeCheck, highlight: true, iconSoft: true },
                { label: "项目公示", icon: Eye, highlight: false, iconSoft: true },
                { label: "资金拨付", icon: DollarSign, highlight: true, iconSoft: true },
                { label: "兑现效果监测", icon: BarChart3, highlight: true, iconSoft: false },
                { label: "专报分析与评估", icon: FileText, highlight: true, iconSoft: false },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center border shadow-sm ${
                        step.iconSoft
                          ? "bg-[#fceef2] border-[#e7b8c8] text-[#c41e3a]"
                          : "bg-[#d21639] border-transparent text-white"
                      }`}
                    >
                      <step.icon className={`w-5 h-5 ${step.iconSoft ? "text-[#c41e3a]" : "text-white"}`} />
                    </div>
                    <span className="whitespace-nowrap text-xs font-medium text-foreground">{step.label}</span>
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

          {/* 兑现统计数据 */}
          <div className="h-full">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[
                { label: "申报中", value: "5", unit: "项", icon: Clock, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
                { label: "申报已截止", value: "316", unit: "项", icon: Calendar, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
                { label: "已确认扶持结果", value: "5", unit: "项", icon: BadgeCheck, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
                { label: "已兑现", value: "310", unit: "项", icon: Wallet, iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
                { label: "已兑现资金", value: "85.3", unit: "亿元", icon: DollarSign, iconBg: "bg-violet-50", iconColor: "text-violet-500" },
              ].map((stat) => (
                <div key={stat.label} className="min-h-[150px] rounded-xl border border-border/80 bg-card px-4 py-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="leading-none">
                    <span className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</span>
                    <span className="ml-1 text-base font-semibold text-muted-foreground">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col"
          onClick={() => navigate("/enterprise-evaluation")}
        >
          <div className="flex items-center gap-3 p-5 pb-3">
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-orange))]/10 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[hsl(var(--gov-orange))]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">企业智能评优</h3>
              <p className="text-xs text-muted-foreground"><p className="text-xs text-muted-foreground">智能评分，精准择优</p></p>
            </div>
          </div>
          <div className="px-5 pb-3 flex-1 space-y-3">
            <div className="bg-accent/50 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-foreground" />
                  </div>
                  <span>申报企业<br/>标签匹配</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-foreground" />
                  </div>
                  <span>权重配置</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                  <span>AI自动评分</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
                    <Award className="w-4 h-4 text-foreground" />
                  </div>
                  <span>择优筛选列表</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 兑现效果监测 (stays in middle) */}
        <Card
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col"
          onClick={() => navigate("/effect-dashboard")}
        >
          <div className="flex items-center gap-3 p-5 pb-3">
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-blue))]/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-[hsl(var(--gov-blue))]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">兑现效果监测</h3>
              <p className="text-xs text-muted-foreground"><p className="text-xs text-muted-foreground">实时监测，动态评估</p></p>
            </div>
          </div>
          <div className="px-5 pb-3 flex-1 space-y-3">
            {/* 上排：饼图 + 柱状图 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground text-center mb-1">事项兑现情况</p>
                <ResponsiveContainer width="100%" height={80}>
                  <PieChart>
                    <Pie data={[{ name: "已兑现", value: 76 }, { name: "未兑现", value: 23 }]} cx="50%" cy="50%" innerRadius={20} outerRadius={32} dataKey="value" strokeWidth={1}>
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}项`} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-center text-muted-foreground">已兑现 <span className="font-bold text-foreground">76</span>/99 项</p>
              </div>
              <div className="bg-accent/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground text-center mb-1">已兑现资金(亿元)</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={[{ name: "2022", v: 5.2 }, { name: "2023", v: 12.8 }, { name: "2024", v: 45.6 }, { name: "2025", v: 21.7 }]} barSize={14}>
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="v" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Tooltip formatter={(v: number) => `${v}亿`} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>

        {/* 兑现专报生成 (was first, now third) */}
        <Card
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col"
          onClick={() => navigate("/policy-report")}
        >
          <div className="flex items-center gap-3 p-5 pb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">兑现专报生成</h3>
              <p className="text-xs text-muted-foreground"><p className="text-xs text-muted-foreground">AI分析，决策支撑</p></p>
            </div>
          </div>
          <div className="px-5 pb-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              {["整体态势", "事项分布"].map((label) => (
                <div key={label} className="bg-accent/50 rounded-lg p-3 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">【{label}】</p>
                  <div className="w-14 h-14 rounded-full border-4 border-primary/30 border-t-primary border-r-primary/60 relative flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-card" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        </div>

        {/* 兑现执行功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              title: "项目审核",
              desc: "基于政策条件与申报材料进行规则校验与综合评审",
              icon: ClipboardList,
              iconColor: "text-blue-600",
              iconBg: "bg-blue-50",
              path: "/policy-project-review",
            },
            {
              title: "确定扶持结果",
              desc: "结合审核结果与评估规则，形成最终扶持名单及支持方式",
              icon: BadgeCheck,
              iconColor: "text-emerald-600",
              iconBg: "bg-emerald-50",
              path: "/support-result",
            },
            {
              title: "项目公示",
              desc: "对拟扶持项目进行公开透明展示，支持社会监督与异议反馈",
              icon: Eye,
              iconColor: "text-amber-600",
              iconBg: "bg-amber-50",
              path: "/project-public-notice",
            },
            {
              title: "资金拨付",
              desc: "依据最终审批结果完成资金发放与记录归档",
              icon: Wallet,
              iconColor: "text-violet-600",
              iconBg: "bg-violet-50",
              path: "/fund-disbursement",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className={`p-5 ${item.path ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
              onClick={item.path ? () => navigate(item.path) : undefined}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.iconBg}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Index;
