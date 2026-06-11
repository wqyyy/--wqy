import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit3, Send, Sparkles, StopCircle, User } from "lucide-react";

// ─── 类型定义 ──────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** 是否为政策起草类回复（输出后显示编辑按钮） */
  isDraftReply?: boolean;
  /** 打字机是否还在输出中 */
  isStreaming?: boolean;
}

// ─── 模拟回复内容 ───────────────────────────────────────────────────────────

/** 判断问题类型 */
function detectQuestionType(q: string): "draft" | "search" {
  const draftKeywords = ["起草", "拟定", "制定", "撰写", "草拟", "编写", "写一篇"];
  return draftKeywords.some((kw) => q.includes(kw)) ? "draft" : "search";
}

/** 政策起草模拟内容 */
const MOCK_DRAFT_POLICY = `# 北京市经济技术开发区数据产业发展支持政策

**（征求意见稿）**

---

## 第一章 总则

**第一条** 为深入贯彻党中央、国务院关于数字经济发展的战略部署，加快推进北京市经济技术开发区（以下简称"经开区"）数据产业高质量发展，培育壮大数据要素市场，构建数据驱动型产业生态，依据《中华人民共和国数据安全法》《北京市数字经济促进条例》等法律法规，结合经开区实际，制定本政策。

**第二条** 本政策所称数据产业，是指以数据资源为核心要素，涵盖数据采集、存储、加工、流通、应用及安全保障等环节的产业集群，包括大数据、人工智能基础数据服务、数据交易流通、数据安全等细分领域。

**第三条** 凡在经开区注册并实际经营的数据产业企业，符合本政策规定条件的，均可依照本政策申请相关支持。

---

## 第二章 支持重点领域

**第四条** 重点支持以下方向：

1. **数据基础设施建设**：支持建设高算力、低延迟的数据中心及边缘计算节点，优先支持绿色数据中心项目；
2. **数据要素流通平台**：支持建设数据交易所、数据资产登记确权平台及跨域数据流通基础设施；
3. **数据安全与合规**：支持企业开展数据安全技术研发，建设数据合规管理体系；
4. **数据应用创新**：鼓励企业在制造、医疗、金融、交通等场景开展数据应用创新示范。

---

## 第三章 支持措施

**第五条 落地奖励**

对年营业收入首次突破5000万元、1亿元、5亿元的数据产业企业，分别给予100万元、200万元、500万元的一次性奖励。

**第六条 研发补贴**

对企业当年度在经开区实际发生的研发投入，按不超过实际投入额的30%给予补贴，每家企业每年最高补贴1000万元。

**第七条 人才引进支持**

对引进的数据产业高端人才，给予最高50万元的安家补贴；对企业聘用的应届博士毕业生，给予每人每年3万元、连续3年的岗位津贴。

**第八条 算力券支持**

向符合条件的数据产业中小企业发放算力消费券，单家企业每年最高领取30万元，用于抵扣经开区认定的算力平台服务费用。

**第九条 办公用房支持**

对新落地的数据产业重点项目，三年内按不高于市场价50%的标准给予租金优惠。

---

## 第四章 申报与审核

**第十条** 各项奖励及支持资金采取"事后奖补"方式，企业须在规定时间内向经开区管委会产业发展局提交申请材料。

**第十一条** 管委会组织专家对申请材料进行评审，评审结果在经开区官网公示5个工作日后予以兑现。

---

## 第五章 附则

**第十二条** 本政策自发布之日起施行，有效期三年。

**第十三条** 本政策由北京市经济技术开发区管理委员会负责解释。

---

*北京市经济技术开发区管理委员会*
*2026年4月*`;

/** 政策搜索模拟内容 */
const MOCK_SEARCH_REPLY = `根据最新数据，以下是北京市经济技术开发区（亦庄）近期发布的相关政策和事项：

---

**📋 近期主要政策（2025-2026年）**

**1. 《经开区产业高质量发展三年行动计划（2025-2027）》**
发布时间：2025年12月 | 支持金额：总规模50亿元
重点支持集成电路、新能源汽车、工业互联网、数字经济等四大主导产业，对年产值超10亿元企业给予专项奖励。

**2. 《2025年度人才引进与激励支持办法》**
发布时间：2025年10月
面向高端制造、软件信息等领域，提供安家补贴最高100万元，并配套子女入学、医疗等绿色通道服务。

**3. 《亦庄数据要素流通促进办法》**
发布时间：2025年11月
支持数据交易所建设，对入驻数据交易场景的企业给予运营补贴，最高200万元/年。

**4. 《2026年科技创新券使用指南》**
发布时间：2026年1月
中小科技企业可申领10-50万元科技创新券，用于购买研发设备、委托检测检验及知识产权服务。

---

**📢 近期重要事项**

- **申报截止提醒**：2026年上半年"高新技术企业"认定申报窗口将于4月30日关闭
- **政策宣讲活动**：5月初将举办2026年度惠企政策集中宣讲会，届时可现场咨询
- **资金兑现进度**：2025年度政策资金已完成审核，预计5月中旬完成拨付

---

如需查看某项政策的完整文件或申请指南，请告诉我具体名称。`;

/** 数据产业政策查找模拟内容 */
const MOCK_DATA_INDUSTRY_REPLY = `以下是2025-2026年数据产业相关最新政策汇总：

---

**🌐 国家级政策**

**1. 《数据基础设施建设指引》（工信部，2025年9月）**
明确算力网络、数据流通基础设施建设标准，给予参与建设企业税收减免及专项资金支持。

**2. 《数字经济核心产业统计分类（2025年版）》（国家统计局）**
重新界定数字经济口径，数据服务类企业可享受增值税即征即退政策。

---

**🏙️ 北京市级政策**

**3. 《北京市数据资产入表实施指引（试行）》（2025年11月）**
全国首个数据资产入表地方操作细则，指导企业依法将数据资源确认为无形资产，可用于质押融资。

**4. 《北京人工智能数据安全管理规定》（2026年1月起施行）**
规范AI训练数据合规使用，对通过安全评估的数据服务企业发放"数据安全白名单"认证。

---

**🏭 经开区专项政策**

**5. 《亦庄数据产业集聚区建设方案》（2025年12月）**
规划"数据产业园"核心区，提供首期5万平米算力+办公一体化空间，租金8折优惠，期限5年。

**6. 《经开区数据要素市场化配置改革试点方案》**
亦庄被列为全市数据要素市场化改革重点试验区，赋予更大数据跨境流通探索权限。

---

以上政策均可在经开区管委会官网政策专栏下载完整版本，如需协助起草申请材料，请告知。`;

/** 根据问题返回对应模拟内容 */
function getMockReply(question: string): { content: string; isDraftReply: boolean } {
  const type = detectQuestionType(question);
  if (type === "draft") {
    return { content: MOCK_DRAFT_POLICY, isDraftReply: true };
  }
  if (question.includes("数据产业") && (question.includes("找") || question.includes("最新"))) {
    return { content: MOCK_DATA_INDUSTRY_REPLY, isDraftReply: false };
  }
  return { content: MOCK_SEARCH_REPLY, isDraftReply: false };
}

// ─── 打字机 Hook ────────────────────────────────────────────────────────────

/**
 * 逐字输出文本的打字机效果
 * @returns [displayedText, isComplete, start, stop]
 */
function useTypewriter() {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (fullText: string, onDone?: () => void) => {
      stop();
      setDisplayedText("");
      setIsComplete(false);
      indexRef.current = 0;

      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        // 每帧输出更多字符以加快速度（Markdown内容较长）
        const chunkSize = Math.min(3, fullText.length - (indexRef.current - 1) * 3);
        if (chunkSize <= 0) return;

        setDisplayedText(fullText.slice(0, indexRef.current * 3));

        if (indexRef.current * 3 >= fullText.length) {
          setDisplayedText(fullText);
          setIsComplete(true);
          stop();
          onDone?.();
        }
      }, 18);
    },
    [stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { displayedText, isComplete, start, stop };
}

// ─── 主组件 ─────────────────────────────────────────────────────────────────

export default function BrainChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialQuestion = (location.state as { question?: string })?.question ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  const typewriter = useTypewriter();

  /** 自动滚到底部 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** 发送消息并触发流式输出 */
  const sendMessage = useCallback(
    (question: string) => {
      if (!question.trim() || isGenerating) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question.trim(),
      };

      const { content: replyContent, isDraftReply } = getMockReply(question);
      const assistantMsgId = `ai-${Date.now()}`;

      streamingIdRef.current = assistantMsgId;
      setIsGenerating(true);

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          isDraftReply,
          isStreaming: true,
        },
      ]);

      typewriter.start(replyContent, () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: replyContent, isStreaming: false }
              : m
          )
        );
        setIsGenerating(false);
        streamingIdRef.current = null;
      });
    },
    [isGenerating, typewriter]
  );

  /** 中止输出 */
  const handleStop = useCallback(() => {
    typewriter.stop();
    if (streamingIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, content: typewriter.displayedText, isStreaming: false }
            : m
        )
      );
    }
    setIsGenerating(false);
    streamingIdRef.current = null;
  }, [typewriter]);

  /** 初始问题自动发送 */
  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
    }
    // 仅执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isGenerating) return;
    const q = inputValue;
    setInputValue("");
    sendMessage(q);
  };

  /** 跳转政策起草编辑页 */
  const handleEdit = (content: string) => {
    navigate("/policy-writing/drafting", {
      state: {
        directContent: content,
        policyTitle: "数据产业发展支持政策",
      },
    });
  };

  return (
    <div className="flex h-full flex-col bg-[#f7f4f4]">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d21639]/10 to-[#d21639]/5">
                <Sparkles className="h-8 w-8 text-[#d21639]" />
              </div>
              <p className="text-lg font-medium text-gray-500">惠企政策大脑</p>
              <p className="mt-1 text-sm text-gray-400">正在思考中...</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* 头像 */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-gray-200"
                    : "bg-gradient-to-br from-[#d21639] to-[#8b0f24]"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-gray-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white" />
                )}
              </div>

              {/* 气泡 */}
              <div
                className={`group relative max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}
              >
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-[#d21639] text-white"
                      : "rounded-tl-sm bg-white text-gray-800"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-800">
                      <StreamingContent
                        content={
                          msg.isStreaming ? typewriter.displayedText : msg.content
                        }
                        isStreaming={!!msg.isStreaming}
                      />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                </div>

                {/* 政策起草完成后显示编辑按钮 */}
                {msg.role === "assistant" &&
                  msg.isDraftReply &&
                  !msg.isStreaming &&
                  msg.content && (
                    <button
                      onClick={() => handleEdit(msg.content)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#d21639]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#d21639] shadow-sm transition-all hover:bg-[#d21639] hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" />
                      编辑政策文件
                    </button>
                  )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入区 */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm focus-within:border-[#d21639]/40 focus-within:ring-2 focus-within:ring-[#d21639]/10">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续提问..."
              rows={1}
              disabled={isGenerating}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />

            {isGenerating ? (
              <button
                onClick={handleStop}
                className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-gray-600 transition-colors hover:bg-gray-300"
                title="停止生成"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d21639] to-[#a00f27] text-white shadow-sm transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            AI生成内容仅供参考，请结合实际情况使用
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 流式内容渲染组件 ────────────────────────────────────────────────────────

/**
 * 将 Markdown 文本转换为带样式的 JSX，同时支持打字机光标
 */
function StreamingContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  if (!content) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
        <span
          className="inline-block h-4 w-0.5 animate-pulse bg-[#d21639]"
          style={{ animationDuration: "0.8s" }}
        />
        正在生成...
      </span>
    );
  }

  // 简单 Markdown 渲染（标题 / 加粗 / 列表 / 分隔线）
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="mt-3 text-base font-bold text-gray-900">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-2 text-sm font-bold text-gray-800">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
          return (
            <p key={i} className="font-semibold text-gray-800">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="border-gray-200 my-3" />;
        }
        if (/^(\d+\.\s|\*\s|-\s)/.test(line)) {
          const text = line.replace(/^(\d+\.\s|\*\s|-\s)/, "");
          return (
            <p key={i} className="flex gap-2 text-gray-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d21639]" />
              <RichLine text={text} />
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1.5" />;
        }
        return (
          <p key={i} className="text-gray-700">
            <RichLine text={line} />
            {isStreaming && i === lines.length - 1 && (
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#d21639] align-middle"
                style={{ animationDuration: "0.7s" }}
              />
            )}
          </p>
        );
      })}

      {/* 末尾光标（当最后一行非空时挂在这里） */}
      {isStreaming && lines[lines.length - 1].trim() !== "" && false && (
        <span
          className="inline-block h-4 w-0.5 animate-pulse bg-[#d21639]"
          style={{ animationDuration: "0.7s" }}
        />
      )}
    </div>
  );
}

/** 处理行内 **bold** 语法 */
function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-gray-800">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
