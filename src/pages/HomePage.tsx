import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Mic, Paperclip, Send, X, Search, ArrowUpRight } from "lucide-react";
import {
  dismissDraftWake,
  getPendingDraftWake,
  type PendingDraftWake,
} from "@/lib/policyDraftWake";
import {
  ASSISTANT_HOME_GREETING,
  ASSISTANT_TASK_DISMISS_LABEL,
  ASSISTANT_TASK_DISMISS_ALL_LABEL,
  ASSISTANT_TASK_VIEW_LABEL,
  buildCompletedTaskMessage,
} from "@/lib/assistantCopy";
import digitalHumanImg from "@/assets/digital-human-upper.png";

/** 「可以这样问」快捷问题（沿用此前文案） */
const QUICK_QUESTIONS = [
  { id: "draft", label: "帮我写一篇数据产业高质量发展的政策" },
  { id: "talent", label: "帮我找一些人才引进相关的政策" },
  { id: "compare", label: "对比北京和深圳对于规上企业分别有什么奖励" },
  { id: "redeem", label: "我想看一下经开区最新的兑现数据" },
];

/** 无真实任务时，用于页面展示的模拟任务（便于预览样式与交互） */
const MOCK_TASK_TITLE = "关于促进数据产业高质量发展的若干政策措施";

const MOCK_REMINDERS = [
  {
    id: "mock-1",
    taskType: "政策起草",
    title: MOCK_TASK_TITLE,
    path: "/policy-writing/drafting",
  },
  {
    id: "mock-2",
    taskType: "兑现专报",
    title: "2024年第四季度政策兑现专报",
    path: "/policy-report/tasks",
  },
] as const;

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [showGreeting, setShowGreeting] = useState(true);
  const [draftWake, setDraftWake] = useState<PendingDraftWake | null>(() => getPendingDraftWake());
  /** 用户逐条忽略后隐藏的模拟任务 id，刷新页面会再次出现 */
  const [dismissedMockIds, setDismissedMockIds] = useState<string[]>([]);
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

  const reminders = draftWake
    ? [
        {
          id: "draft-wake",
          taskType: "政策起草",
          title: draftWake.title,
          path: "/policy-writing/drafting",
        },
      ]
    : MOCK_REMINDERS.filter((reminder) => !dismissedMockIds.includes(reminder.id));

  const hasTask = reminders.length > 0;
  const taskCount = reminders.length;

  const handleDismissReminder = (reminderId: string) => {
    if (reminderId === "draft-wake") {
      if (!draftWake) return;
      dismissDraftWake(draftWake.signature);
      setDraftWake(null);
      return;
    }
    setDismissedMockIds((prev) => (prev.includes(reminderId) ? prev : [...prev, reminderId]));
  };

  const handleDismissAll = () => {
    if (draftWake) {
      dismissDraftWake(draftWake.signature);
      setDraftWake(null);
    }
    setDismissedMockIds(MOCK_REMINDERS.map((reminder) => reminder.id));
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* 参考 home-bg 丝带布局，改用系统红白配色，铺满可视区域 */}
      <div className="pointer-events-none absolute inset-0 min-h-screen overflow-hidden bg-[#f7f4f4]">
        <div className="absolute inset-0 bg-gradient-to-tr from-white from-[18%] via-[#fdfafa] via-[55%] to-[#fdeef2]" />
        <div className="absolute inset-y-0 right-0 w-[42%] bg-gradient-to-l from-[#fdeef2]/90 via-[#fff6f8]/45 to-transparent" />

        <svg
          className="absolute inset-0 h-full min-h-screen w-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="homeRibbonFillA" x1="100%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%" stopColor="#f8d4dc" stopOpacity="0.72" />
              <stop offset="45%" stopColor="#fbe8ed" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="homeRibbonFillB" x1="95%" y1="5%" x2="15%" y2="95%">
              <stop offset="0%" stopColor="#d21639" stopOpacity="0.14" />
              <stop offset="40%" stopColor="#efb8c4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="homeRibbonFillC" x1="88%" y1="0%" x2="30%" y2="85%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#fff6f8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fdecef" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="homeRibbonLineA" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f4a3b3" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="homeRibbonLineB" x1="100%" y1="20%" x2="10%" y2="100%">
              <stop offset="0%" stopColor="#d21639" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d="M1180 -120 C1520 80, 1380 420, 1580 640 C1700 780, 1840 900, 1960 980 L1960 -120 Z"
            fill="url(#homeRibbonFillC)"
          />
          <path
            d="M980 -60 C1320 180, 1200 520, 1460 760 C1580 900, 1720 1000, 1920 1080 L1920 -60 Z"
            fill="url(#homeRibbonFillA)"
          />
          <path
            d="M860 20 C1140 260, 1060 560, 1280 780 C1400 920, 1540 1020, 1920 1080 L1920 20 Z"
            fill="url(#homeRibbonFillB)"
            opacity="0.9"
          />
          <path
            d="M620 40 C920 300, 860 580, 1080 820 C1180 940, 1280 1020, 1380 1080"
            fill="none"
            stroke="url(#homeRibbonLineA)"
            strokeWidth="2.5"
            opacity="0.55"
          />
          <path
            d="M760 120 C1020 360, 960 640, 1160 860 C1240 960, 1320 1020, 1400 1060"
            fill="none"
            stroke="url(#homeRibbonLineB)"
            strokeWidth="1.5"
            opacity="0.45"
          />
          <path
            d="M540 180 C820 420, 760 700, 980 920"
            fill="none"
            stroke="#f5c6d0"
            strokeWidth="1"
            opacity="0.35"
          />
        </svg>

        <div className="absolute -right-[4%] -top-[12%] h-[58%] w-[56%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92)_0%,rgba(255,241,244,0.45)_42%,transparent_72%)]" />
        <div className="absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(ellipse_at_top_right,rgba(210,22,57,0.06)_0%,transparent_72%)]" />
      </div>

      {/* 主内容区：与系统其它页面同宽，撑满可视高度 */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col justify-center px-5 py-8 md:px-8 lg:px-10">
        {/* 顶部：数字人 + 问候（左）  任务提醒（右） */}
        <div className="flex w-full flex-col items-stretch gap-6 xl:flex-row xl:items-end xl:justify-between">
          {/* 数字人上半身 + 气泡 */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <img
              src={digitalHumanImg}
              alt="智能助手数字人"
              className="hidden h-[300px] w-auto shrink-0 select-none object-contain object-bottom md:block"
              draggable={false}
            />
            {showGreeting && (
              <div className="relative mt-12 max-w-md animate-[fadeIn_0.6s_ease_both]">
                <span className="absolute -left-1.5 top-5 hidden h-3.5 w-3.5 rotate-45 rounded-sm bg-white md:block" />
                <div className="relative flex items-start gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                  <p className="text-sm leading-relaxed text-gray-800">{ASSISTANT_HOME_GREETING}</p>
                  <button
                    type="button"
                    onClick={() => setShowGreeting(false)}
                    className="mt-0.5 shrink-0 text-gray-300 transition-colors hover:text-gray-500"
                    aria-label="关闭问候"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 待办事项卡片 */}
          <div className="w-full shrink-0 rounded-2xl bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] xl:w-[320px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                任务提醒
                {taskCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d21639] px-1.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                    {taskCount > 99 ? "99+" : taskCount}
                  </span>
                )}
              </h3>
              {hasTask && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="shrink-0 text-[11px] font-medium text-gray-500 transition-colors hover:text-gray-700"
                >
                  {ASSISTANT_TASK_DISMISS_ALL_LABEL}
                </button>
              )}
            </div>
            {hasTask ? (
              <div className="flex min-h-[252px] flex-col gap-2">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                  >
                    <p className="line-clamp-3 text-[13px] leading-relaxed text-gray-700">
                      {buildCompletedTaskMessage(reminder.taskType, reminder.title)}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(reminder.path)}
                        className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#d21639] to-[#a00f27] px-2.5 py-1 text-[11px] font-medium text-white shadow-sm transition-opacity hover:opacity-95"
                      >
                        {ASSISTANT_TASK_VIEW_LABEL}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissReminder(reminder.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        {ASSISTANT_TASK_DISMISS_LABEL}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[252px] flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs text-gray-400">暂无待办事项</p>
              </div>
            )}
          </div>
        </div>

        {/* 问答框（数字人下方） */}
        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.25)] ring-1 ring-gray-200/80">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，开始对话..."
            rows={2}
            className="w-full resize-none bg-transparent px-5 pt-4 text-base leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none"
            style={{ maxHeight: "140px", overflowY: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="语音输入"
            >
              <Mic className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="上传附件"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#d21639] to-[#a00f27] text-white shadow-md transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                aria-label="发送"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 可以这样问 */}
        <div className="mt-8 w-full">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-[#d21639]/50" />
            <span className="text-sm text-gray-500">可以这样问：</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSubmit(q.label)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[#f3c6cf]/80 bg-white/75 px-4 py-3 text-left text-sm text-gray-700 shadow-[0_8px_24px_rgba(210,22,57,0.06)] backdrop-blur-sm transition-all hover:border-[#d21639]/25 hover:bg-white hover:text-gray-900"
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d21639] transition-transform group-hover:scale-125" />
                  {q.label}
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#d21639]/70" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
