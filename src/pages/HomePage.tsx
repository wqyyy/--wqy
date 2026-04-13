import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, FileText, Megaphone, BadgeCheck, BarChart3 } from "lucide-react";
import {
  buildDraftWakeMessage,
  dismissDraftWake,
  getPendingDraftWake,
  type PendingDraftWake,
} from "@/lib/policyDraftWake";
import {
  ASSISTANT_HOME_GREETING,
  ASSISTANT_TASK_REMINDER_TITLE,
  ASSISTANT_TASK_CONTINUE_LABEL,
  ASSISTANT_TASK_DISMISS_LABEL,
} from "@/lib/assistantCopy";
import assistantAvatarImg from "@/assets/ai-assistant-avatar.png";

/** 快捷问题气泡配置 */
const QUICK_QUESTIONS = [
  {
    id: "draft",
    label: "帮我写一篇数据产业高质量发展的政策",
    type: "draft" as const,
  },
  {
    id: "talent",
    label: "帮我找一些人才引进相关的政策",
    type: "search" as const,
  },
  {
    id: "compare",
    label: "对比北京和深圳对于规上企业分别有什么奖励",
    type: "find" as const,
  },
  {
    id: "redeem",
    label: "我想看一下经开区最新的兑现数据",
    type: "search" as const,
  },
];

/** 首页统计数据 */
const POLICY_STATS = [
  { label: "政策文件总量", value: "30万篇" },
  { label: "政策起草成果", value: "10篇" },
  { label: "政策发布数量", value: "600篇" },
  { label: "兑现事项", value: "700项" },
  { label: "政策评价报告", value: "20篇" },
];

/** 快速入口（路径与侧栏主导航一致） */
const QUICK_ASSISTANTS = [
  {
    key: "drafting",
    title: "政策制定",
    desc: "快速进入政策起草与预评估",
    path: "/policy-writing",
    Icon: FileText,
  },
  {
    key: "reach",
    title: "政策触达",
    desc: "查看触达成效与目标企业覆盖",
    path: "/policy-reach",
    Icon: Megaphone,
  },
  {
    key: "redeem",
    title: "政策兑现",
    desc: "跟踪兑现数据与执行进度",
    path: "/dashboard",
    Icon: BadgeCheck,
  },
  {
    key: "evaluation",
    title: "政策评价",
    desc: "生成评价报告与指标分析",
    path: "/policy-evaluation",
    Icon: BarChart3,
  },
];

/** 无真实未完成草稿时，用于页面展示的模拟任务（便于预览样式与交互） */
const MOCK_DRAFT_TITLE = "关于促进数据产业高质量发展的若干政策措施（示例）";

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [draftWake, setDraftWake] = useState<PendingDraftWake | null>(() => getPendingDraftWake());
  /** 用户点击「忽略」后隐藏模拟条，刷新页面会再次出现 */
  const [mockWakeDismissed, setMockWakeDismissed] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sync = () => setDraftWake(getPendingDraftWake());
    sync();
    window.addEventListener("policy-draft-wake:changed", sync);
    window.addEventListener("assistant:outline-saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("policy-draft-wake:changed", sync);
      window.removeEventListener("assistant:outline-saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** 提交问题，跳转政策制定页并以全屏助手展示答案 */
  const handleSubmit = (question: string) => {
    if (!question.trim()) return;
    navigate("/policy-writing", {
      state: { assistantQuestion: question.trim() },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const showTaskReminder = Boolean(draftWake || (!mockWakeDismissed && !getPendingDraftWake()));

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      {/* 亦庄背景图 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=90')`,
        }}
      />

      {/* 深色渐变遮罩 - 营造政务科技感 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/85 via-[#0d1f3c]/80 to-[#1a0a0a]/75" />

      {/* 顶部光晕装饰 */}
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#d21639]/10 blur-[120px] pointer-events-none" />
      <div className="absolute right-0 top-1/4 h-[300px] w-[400px] rounded-full bg-[#1a4a8a]/20 blur-[100px] pointer-events-none" />

      {/* 主内容区 */}
      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-10">
        {/* 顶部标志 */}
        <div className="mb-8 flex flex-col items-center gap-3 animate-[fadeInDown_0.8s_ease_both]">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
              惠企政策大脑
            </h1>
          </div>
        </div>

        {/* 副标题 */}
        <p className="mb-10 text-center text-lg text-white/70 animate-[fadeIn_1s_0.3s_ease_both_backwards]">
          智能搜索政策 · AI起草文件 · 精准匹配企业需求
        </p>

        {/* 统计数据 */}
        <div className="mb-8 w-full max-w-5xl animate-[fadeInUp_1s_0.7s_ease_both_backwards]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {POLICY_STATS.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-center backdrop-blur-sm"
              >
                <p className="text-xs text-white/60">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 主对话框（任务提醒嵌套在问答框内） */}
        <div
          className="w-full max-w-2xl animate-[fadeInUp_0.8s_0.2s_ease_both_backwards]"
          style={{ filter: "drop-shadow(0 25px 60px rgba(0,0,0,0.5))" }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.12)] ring-1 ring-gray-200/90">
            {/* 智能助手问候语 */}
            <div className="relative z-10 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
              <img
                src={assistantAvatarImg}
                alt="智能助手"
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
              />
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-gray-800">{ASSISTANT_HOME_GREETING}</p>
            </div>

            {/* 任务提醒（问候语下方；有真实数据优先，否则展示模拟） */}
            {showTaskReminder && (
              <div className="relative z-10 border-b border-gray-100 bg-white px-4 pb-3 pt-3">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">{ASSISTANT_TASK_REMINDER_TITLE}</p>
                <p className="text-[13px] leading-relaxed text-gray-800">
                  {draftWake ? buildDraftWakeMessage(draftWake.title) : buildDraftWakeMessage(MOCK_DRAFT_TITLE)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/policy-writing/drafting")}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-[#d21639] to-[#a00f27] px-2.5 py-1 text-[11px] font-medium text-white shadow-sm transition-opacity hover:opacity-95"
                  >
                    {ASSISTANT_TASK_CONTINUE_LABEL}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (draftWake) {
                        dismissDraftWake(draftWake.signature);
                        setDraftWake(null);
                        setMockWakeDismissed(true);
                      } else {
                        setMockWakeDismissed(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {ASSISTANT_TASK_DISMISS_LABEL}
                  </button>
                </div>
              </div>
            )}

            <div className="relative z-10 flex items-end gap-3 bg-white px-5 py-4">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入您的问题，例如：经开区最新惠企政策有哪些..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed"
                style={{ maxHeight: "120px", overflowY: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim()}
                className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d21639] to-[#a00f27] text-white shadow-md transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(210,22,57,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 提示文字 */}
          <p className="mt-3 text-center text-xs text-white/40">
            按 Enter 发送 · Shift+Enter 换行
          </p>
        </div>

        {/* 快捷问题 */}
        <div className="mt-8 w-full max-w-2xl animate-[fadeInUp_0.9s_0.5s_ease_both_backwards]">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-white/50" />
            <span className="text-sm text-white/50">可以这样问：</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSubmit(q.label)}
                className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-left text-sm text-white/75 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d21639] transition-transform group-hover:scale-125" />
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* 快速入口 */}
        <div className="mt-8 w-full max-w-5xl animate-[fadeInUp_1s_0.8s_ease_both_backwards]">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm text-white/55">快速入口</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ASSISTANTS.map((assistant) => (
              <button
                key={assistant.key}
                onClick={() => navigate(assistant.path)}
                className="group rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-left backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
              >
                <div className="flex items-center gap-2">
                  <assistant.Icon className="h-4 w-4 text-[#f1c2cc] transition-transform group-hover:scale-110" />
                  <p className="text-sm font-medium text-white">{assistant.title}</p>
                </div>
                <p className="mt-1 text-xs text-white/60">{assistant.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-white/30 sm:gap-6">
          <span>北京经济技术开发区</span>
          <span className="hidden h-3 w-px bg-white/20 sm:inline" />
          <span>惠企政策智能服务平台</span>
          <span className="hidden h-3 w-px bg-white/20 sm:inline" />
          <span>AI · 2026</span>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
