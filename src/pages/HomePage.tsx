import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles } from "lucide-react";

/** 快捷问题气泡配置 */
const QUICK_QUESTIONS = [
  {
    id: "draft",
    label: "帮我起草一篇数据产业的政策？",
    type: "draft" as const,
  },
  {
    id: "search",
    label: "经开区最新的政策和事项有哪些？",
    type: "search" as const,
  },
  {
    id: "find",
    label: "帮我找一些数据产业的最新政策",
    type: "find" as const,
  },
];

export default function HomePage() {
  const [inputValue, setInputValue] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "calc(100vh)" }}>
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
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d21639] to-[#8b0f24] shadow-[0_0_30px_rgba(210,22,57,0.5)]">
              <Sparkles className="h-7 w-7 text-white" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                惠企政策大脑
              </h1>
              <p className="mt-1 text-sm font-medium text-white/60 tracking-wider">
                BEIJING YIZHUANG · ENTERPRISE POLICY AI
              </p>
            </div>
          </div>
        </div>

        {/* 副标题 */}
        <p className="mb-10 text-center text-lg text-white/70 animate-[fadeIn_1s_0.3s_ease_both_backwards]">
          智能搜索政策 · AI起草文件 · 精准匹配企业需求
        </p>

        {/* 主对话框 */}
        <div
          className="w-full max-w-2xl animate-[fadeInUp_0.8s_0.2s_ease_both_backwards]"
          style={{ filter: "drop-shadow(0 25px 60px rgba(0,0,0,0.5))" }}
        >
          <div className="relative rounded-2xl bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur-xl">
            {/* 输入框内光效 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="flex items-end gap-3 rounded-xl bg-white/95 px-5 py-4">
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

        {/* 底部信息 */}
        <div className="mt-10 flex items-center gap-6 text-xs text-white/30">
          <span>北京经济技术开发区</span>
          <span className="h-3 w-px bg-white/20" />
          <span>惠企政策智能服务平台</span>
          <span className="h-3 w-px bg-white/20" />
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
