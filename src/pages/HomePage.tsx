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

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const [showGreeting, setShowGreeting] = useState(true);
  const [draftWake, setDraftWake] = useState<PendingDraftWake | null>(() => getPendingDraftWake());
  /** 用户点击「忽略」后隐藏模拟任务，刷新页面会再次出现 */
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

  const hasTask = Boolean(draftWake || (!mockWakeDismissed && !getPendingDraftWake()));
  const taskCount = hasTask ? 1 : 0;

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      {/* 红白 Soft UI 背景：柔和渐变 + 流动光带 */}
      <div className="absolute inset-0 overflow-hidden bg-[#fafafa]">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#fff8f9] to-[#fdecef]" />
        <div className="absolute left-1/2 top-0 h-[85%] w-[130%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.98)_0%,rgba(255,240,243,0.55)_45%,transparent_78%)]" />
        <div className="pointer-events-none absolute -right-[8%] top-[2%] h-[48%] w-[58%] rotate-[18deg] rounded-[42%] bg-gradient-to-bl from-[#d21639]/14 via-[#f5b8c4]/22 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -left-[12%] top-[18%] h-[52%] w-[62%] -rotate-[8deg] rounded-[46%] bg-gradient-to-tr from-[#d21639]/10 via-[#ffe3e9]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8%] left-[5%] h-[42%] w-[90%] rounded-[50%] bg-gradient-to-t from-[#d21639]/8 via-[#fff1f4]/45 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute right-[8%] top-[42%] h-[28%] w-[38%] rotate-[-14deg] rounded-[40%] bg-gradient-to-l from-[#ffc9d4]/30 to-transparent blur-2xl" />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="homeWaveA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d21639" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="homeWaveB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f4a3b3" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-80 520 C 220 380, 420 680, 720 520 S 1180 360, 1520 480"
            fill="none"
            stroke="url(#homeWaveA)"
            strokeWidth="140"
            strokeLinecap="round"
          />
          <path
            d="M-40 680 C 280 560, 520 820, 820 660 S 1240 500, 1500 620"
            fill="none"
            stroke="url(#homeWaveB)"
            strokeWidth="110"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center px-6 py-10">
        {/* 顶部：数字人上半身 + 问候气泡（左）  待办事项（右） */}
        <div className="flex items-end justify-between gap-4">
          {/* 数字人上半身 + 气泡 */}
          <div className="flex items-start gap-3">
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
          <div className="w-72 shrink-0 self-end rounded-2xl bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
              待办事项
              {taskCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d21639] px-1.5 text-[10px] font-semibold leading-none text-white shadow-sm">
                  {taskCount > 99 ? "99+" : taskCount}
                </span>
              )}
            </h3>
            {hasTask ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="line-clamp-3 text-[13px] leading-relaxed text-gray-700">
                  {buildCompletedTaskMessage(
                    "政策起草",
                    draftWake?.title ?? MOCK_TASK_TITLE,
                  )}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/policy-writing/drafting")}
                    className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-[#d21639] to-[#a00f27] px-2.5 py-1 text-[11px] font-medium text-white shadow-sm transition-opacity hover:opacity-95"
                  >
                    {ASSISTANT_TASK_VIEW_LABEL}
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
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {ASSISTANT_TASK_DISMISS_LABEL}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
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
