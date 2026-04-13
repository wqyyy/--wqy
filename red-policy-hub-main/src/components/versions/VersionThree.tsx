import { useState } from "react";
import { motion } from "framer-motion";
import { PolicyDraftingFlow } from "./PolicyDraftingFlow";
import { PolicyAssessmentFlow } from "./assessment/PolicyAssessmentFlow";
import {
  FileEdit,
  ClipboardCheck,
  Cpu,
  Car,
  HeartPulse,
  Bot,
  Leaf,
  BookOpen,
  Lightbulb,
  Briefcase,
  Users,
  FileText,
  Palette,
  MessageSquare,
  RefreshCw,
  Zap,
  Rocket,
  Brain,
  Factory,
  Sprout,
  Building2,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const scenarioItems = [
  { title: "促进新一代信息技术产业创新突破", desc: "集成电路、5G、云计算、大数据等核心技术攻关与产业化应用支持", icon: Cpu, hot: false },
  { title: "加快建设全球智能网联汽车高地", desc: "智能网联汽车示范应用、自动驾驶测试、汽车芯片与软件本土化", icon: Car, hot: false },
  { title: "推动生命健康产业高质量创新引领", desc: "生物医药研发、医疗器械创新、健康服务新业态与临床成果转化", icon: HeartPulse, hot: true },
  { title: "赋能机器人与智能制造产业链发展", desc: "工业机器人研发应用、制造业数字化转型、智能工厂建设支持", icon: Bot, hot: false },
  { title: "深入推进绿色低碳与节能减排发展", desc: "绿色技术创新、节能改造补贴、碳减排项目支持与绿色金融", icon: Leaf, hot: false },
  { title: "抢占人工智能核心技术与应用高地", desc: "大模型研发、算力基础设施、AI场景开放与数据要素流通治理", icon: Brain, hot: true },
  { title: "抢抓未来前沿产业与先导技术突破", desc: "量子信息、6G、先进材料、合成生物等未来产业超前布局支持", icon: Rocket, hot: false },
  { title: "加大招商引资力度促进高质量聚集", desc: "龙头企业引进奖励、产业链补链强链、重大项目落地配套保障", icon: Building2, hot: false },
  { title: "深化人才引育机制与厚植人才沃土", desc: "高层次人才引进激励、青年人才培育、住房子女教育等配套保障", icon: Users, hot: true },
  { title: "完善全生命周期孵化与专精特新培育", desc: "创新创业孵化平台、专精特新培育、小巨人企业梯度成长支持", icon: Sprout, hot: false },
  { title: "持续优化营商环境与提升政务效能", desc: "行政审批提速、企业全生命周期服务、政务数字化与信用体系建设", icon: BookOpen, hot: false },
];

const aiTools = [
  { title: "政策检索", desc: "智能检索政策文件，快速定位关键条款", icon: FileText },
  { title: "政策工具箱", desc: "集成常用政策工具，提升工作效率", icon: Palette },
  { title: "政策测算", desc: "量化分析政策影响，精准预估实施效果", icon: MessageSquare },
  { title: "条款比对分析", desc: "智能比对政策条款，发现差异与关联", icon: RefreshCw },
];

const scenarioPrefills: Record<string, { title: string; coreElements: string }> = {
  "新一代信息技术": {
    title: "关于促进新一代信息技术产业创新突破的若干政策措施",
    coreElements: "1. 集成电路、5G、人工智能等重点领域扶持\n2. 企业研发投入补贴与税收优惠\n3. 信息技术人才引进与培育计划\n4. 产业园区建设与配套设施支持\n5. 技术成果转化与知识产权保护",
  },
  "智能网联汽车": {
    title: "关于加快建设全球智能网联汽车高地的若干政策措施",
    coreElements: "1. 智能网联汽车产业链关键环节扶持\n2. 新能源汽车示范应用与推广\n3. 自动驾驶测试与应用场景开放\n4. 汽车软件与芯片本土化支持\n5. 产学研协同创新平台建设",
  },
  "生命健康产业": {
    title: "关于推动生命健康产业高质量创新引领的若干政策措施",
    coreElements: "1. 生物医药与医疗器械研发支持\n2. 健康服务新业态培育\n3. 临床试验与成果转化加速\n4. 健康数据开放与利用规范\n5. 高层次医疗卫生人才引进",
  },
  "人工智能": {
    title: "关于抢占人工智能核心技术与应用高地的若干政策措施",
    coreElements: "1. 大模型与基础算法研发支持\n2. 算力基础设施建设与共享\n3. AI应用场景开放与落地\n4. 人工智能人才培育与引进\n5. 数据要素流通与安全治理",
  },
  "人才引育机制": {
    title: "关于深化人才引育机制与厚植人才沃土的若干政策措施",
    coreElements: "1. 高层次人才引进激励政策\n2. 青年人才培育与成长通道\n3. 人才住房、子女教育等配套保障\n4. 产学研联合育才机制\n5. 海外人才回流支持措施",
  },
};

export function VersionThree() {
  const [showDrafting, setShowDrafting] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [draftingProps, setDraftingProps] = useState<{ title?: string; coreElements?: string }>({});

  const handleScenarioClick = (scenarioTitle: string) => {
    // 用主題標題的前幾個關鍵字匹配 prefill
    const key = Object.keys(scenarioPrefills).find(k => scenarioTitle.includes(k));
    if (key) {
      setDraftingProps(scenarioPrefills[key]);
    } else {
      setDraftingProps({ title: `关于${scenarioTitle}的若干政策措施` });
    }
    setShowDrafting(true);
  };

  if (showDrafting) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <PolicyDraftingFlow
          onBack={() => { setShowDrafting(false); setDraftingProps({}); }}
          initialTitle={draftingProps.title}
          initialCoreElements={draftingProps.coreElements}
        />
      </div>
    );
  }

  if (showAssessment) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <PolicyAssessmentFlow onBack={() => setShowAssessment(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top cards - minimal flat style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => setShowDrafting(true)}
          className="rounded-xl border-2 border-primary/20 bg-card p-6 cursor-pointer hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileEdit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">政策起草</h3>
                <p className="text-xs text-muted-foreground">AI-Powered Drafting</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-muted-foreground">
            AI 辅助政策文件起草，智能模板一键生成，大幅提升起草效率
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => setShowAssessment(true)}
          className="rounded-xl border-2 border-primary/20 bg-card p-6 cursor-pointer hover:border-primary/50 transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">政策前评估</h3>
                <p className="text-xs text-muted-foreground">Pre-Policy Assessment</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-muted-foreground">
            政策出台前智能评估，预判实施效果与潜在风险
          </p>
        </motion.div>
      </div>

      {/* Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">政策主题速写</h2>
          </div>
          <button
            onClick={() => setShowAllScenarios(v => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {showAllScenarios ? (
              <><ChevronUp className="h-3.5 w-3.5" />收起</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" />更多主题（{scenarioItems.filter(s => !s.hot).length}）</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(showAllScenarios ? scenarioItems : scenarioItems.filter(s => s.hot)).map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              onClick={() => handleScenarioClick(item.title)}
              className="flex items-start gap-3.5 bg-card rounded-lg px-4 py-3.5 border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors mt-0.5">
                <item.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                  {item.hot && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 rounded-full px-1.5 py-0.5 shrink-0">
                      <Flame className="h-2.5 w-2.5" />热门
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Tools - horizontal cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-gov-gold flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <h2 className="text-base font-semibold text-foreground">热门工具</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {aiTools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              className="bg-card rounded-lg p-4 border border-border hover:border-primary/30 transition-all cursor-pointer group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2.5 group-hover:bg-primary/20 transition-colors">
                <tool.icon className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">{tool.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
