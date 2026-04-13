import { Sparkles, FileText, Activity, TrendingUp, Clock, ChevronRight, ChevronsRight, Heart, PenTool, Shield, Users, Search, BarChart3, FilePen, ClipboardCheck, Wrench, Calculator, Database, BookOpen, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { icon: FileText, label: "政策知识库", value: "30万+", desc: "国家到区级政策资金全覆盖", color: "bg-primary/10 text-primary" },
  { icon: Activity, label: "智能草稿", value: "486", desc: "近 30 天 AI 生成政策草稿", color: "bg-orange-500/10 text-orange-500" },
  { icon: TrendingUp, label: "评估报告", value: "128", desc: "自动完成合规与落地性评估", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: Clock, label: "平均起草时长", value: "18 分钟", desc: "从主题到初稿的中位数", color: "bg-orange-600/10 text-orange-600" },
];

const flowSteps = [
  { icon: Search, title: "政策检索", tag: "找参考", link: "/policy-analysis" },
  { icon: BarChart3, title: "政策分析", tag: "做判断", link: "/policy-analysis" },
  { icon: FilePen, title: "政策起草", tag: "写内容", link: "/policy-report/create" },
  { icon: ClipboardCheck, title: "政策评估", tag: "做校验", link: "/policy-evaluation" },
];

const topics = [
  {
    icon: Shield,
    iconColor: "bg-primary/10 text-primary",
    title: "推动半导体产业集群质量提升引领",
    desc: "全面提振半导体产业、加大培育性资金投入、进展企业人才技术高能推进建言。",
  },
  {
    icon: Activity,
    iconColor: "bg-violet-500/10 text-violet-500",
    title: "抢占人工智能核心技术与应用高地",
    desc: "大整合科技资源、建立全局化引导机制、AI能源开放分布共享科技资源配套完备。",
  },
  {
    icon: Users,
    iconColor: "bg-emerald-500/10 text-emerald-500",
    title: "深化人才引育机制与能级人才支持",
    desc: "激发各类人才创新活力、舒适企业人才居住、住房投保人才支持等便条化支持。",
  },
];

export default function PolicyWriting() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">政策制定</h1>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-nowrap">基于相似政策分析，一键生成大纲与全文草稿，快速完成政策初稿。</p>
        </div>
        <Button className="shrink-0 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
          <Sparkles className="w-4 h-4" />
          开始新写作
        </Button>
      </div>

      {/* Flow Navigation - Icon Pipeline */}
      <Card className="px-6 py-4 border border-border">
        <h2 className="text-base font-bold text-foreground mb-4">政策制定流程</h2>
        <div className="flex items-center justify-between">
          {flowSteps.map((step, i) => (
            <div key={step.title} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 cursor-pointer group flex-1" onClick={() => navigate(step.link)}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-md group-hover:scale-110 transition-transform">
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold whitespace-nowrap text-foreground">{step.title}</span>
                <span className="text-xs text-muted-foreground">{step.tag}</span>
                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  进入 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              {i < flowSteps.length - 1 && (
                <ChevronsRight className="w-6 h-6 text-primary/30 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border border-border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
          </Card>
        ))}
      </div>

      {/* Topic Sketches + Quick Entry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 政策主题速写 - 2/3 */}
        <Card className="p-6 border border-border md:col-span-2">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <PenTool className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">政策主题速写</h2>
                <p className="text-sm text-muted-foreground">更多主题 (8)</p>
              </div>
            </div>
            <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            {topics.map((topic, i) => (
              <Card key={i} className="p-4 border border-border hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${topic.iconColor}`}>
                  <topic.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground">{topic.title}</p>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs shrink-0">新推荐</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{topic.desc}</p>
                </div>
                <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1 shrink-0 mt-1">
                  开始写作 <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Card>
            ))}
          </div>
        </Card>

        {/* 常用功能 - 1/3 */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">常用功能</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: Wrench, title: "政策工具箱", desc: "常用政策编写工具集合" },
              { icon: Calculator, title: "政策测算", desc: "资金与效果预测模型" },
              { icon: Database, title: "政策储备库", desc: "历史政策文档归档管理" },
              { icon: BookOpen, title: "条款储备库", desc: "可复用条款模板库" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
