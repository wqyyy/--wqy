import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Sparkles, FileText, Search, Upload, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Undo2, Redo2, Loader2, Pencil, Check, X, Plus, ChevronDown, ChevronRight, Copy, RefreshCw, Users, Banknote, BarChart3, TrendingUp, ExternalLink, PenLine, Expand, Calculator, BookmarkPlus, Paintbrush, BookOpen, ShieldCheck, FolderOpen, GripVertical } from "lucide-react";
import { ClauseMaterialPanel } from "./ClauseMaterialPanel";
import { reorderOutlineById, useOutlineChapterDrag } from "./outlineDrag";
import { Button } from "@/components/ui/button";
import type { PolicyItem } from "./PolicySearchStep";
import type { OutlineSection, OutlineSubSection } from "./OutlineGenerationStep";
import { isPolicyStructureHeadingLine } from "@/lib/policyNumbering";
import { generateContent, type Citation } from "@/lib/policyDraftApi";
import { isPolicyLlmConfigured, policyLlmChat } from "@/lib/llmClient";
import { parsePolicyOutlineTemplate } from "@/lib/policyOutlineTemplate";
import { FundingWorkspace } from "@/components/funding/FundingWorkspace";

interface PolicyOutputPageProps {
  policyTitle: string;
  coreElements?: string;
  selectedPolicies?: PolicyItem[];
  outline?: OutlineSection[];
  onBack: () => void;
  /** 快速起草模式：跳过 loading 骨架，直接打字机输出全文 */
  typewriterMode?: boolean;
  /** 从助手直接传入的完整政策内容，跳过生成直接进入编辑状态 */
  directContent?: string;
  flowHeader?: import("react").ReactNode;
  onContentChange?: (content: string) => void;
  onArchive?: () => void;
  onRegenerate?: () => void;
  archived?: boolean;
}

const editorTools = [
  { id: "outline", icon: Sparkles, label: "大纲编辑" },
  { id: "proofread", icon: ShieldCheck, label: "审稿核稿" },
  { id: "clause", icon: FileText, label: "生成条款" },
  { id: "calculate", icon: Calculator, label: "资金测算" },
  { id: "material", icon: FolderOpen, label: "素材库" },
  { id: "reference", icon: BookOpen, label: "参考来源" },
];

const referenceLevelLabels: Record<PolicyItem["level"], string> = {
  yizhuang: "经开区政策",
  national: "国家级政策",
  beijing: "北京市政策",
  other: "其他省市政策",
  material: "我的素材库",
};

type ProofreadIssueType = "sensitive" | "misused" | "collocation" | "grammar";
type ProofreadIssueStatus = "pending" | "accepted" | "ignored";

type ProofreadIssue = {
  id: string;
  type: ProofreadIssueType;
  title: string;
  original: string;
  replacement: string;
  reason: string;
  status: ProofreadIssueStatus;
  isExample?: boolean;
};

const proofreadTypeLabels: Record<ProofreadIssueType, string> = {
  sensitive: "敏感词",
  misused: "错用字词",
  collocation: "固定搭配错误",
  grammar: "语法错误",
};

const proofreadTypeVisuals: Record<ProofreadIssueType, {
  accent: string;
  iconBg: string;
  iconText: string;
  countText: string;
  icon: string;
}> = {
  sensitive: {
    accent: "border-l-red-400",
    iconBg: "bg-red-500",
    iconText: "text-white",
    countText: "text-red-500",
    icon: "!",
  },
  misused: {
    accent: "border-l-orange-300",
    iconBg: "bg-orange-300",
    iconText: "text-white",
    countText: "text-orange-400",
    icon: "字",
  },
  collocation: {
    accent: "border-l-teal-400",
    iconBg: "bg-teal-500",
    iconText: "text-white",
    countText: "text-teal-500",
    icon: "搭",
  },
  grammar: {
    accent: "border-l-blue-400",
    iconBg: "bg-blue-500",
    iconText: "text-white",
    countText: "text-blue-500",
    icon: "A",
  },
};

const sensitiveProofreadTerms = [
  { term: "台独", reason: "涉政敏感词，政策文本中应避免出现政治风险表述。" },
  { term: "港独", reason: "涉政敏感词，政策文本中应避免出现政治风险表述。" },
  { term: "藏独", reason: "涉政敏感词，政策文本中应避免出现政治风险表述。" },
  { term: "疆独", reason: "涉政敏感词，政策文本中应避免出现政治风险表述。" },
  { term: "颠覆国家政权", reason: "涉政敏感表述，政策文本中不应出现违法政治表述。" },
  { term: "色情", reason: "涉黄敏感词，政策文本中应避免出现低俗或违法内容。" },
  { term: "卖淫", reason: "涉黄敏感词，政策文本中应避免出现违法内容。" },
  { term: "裸聊", reason: "涉黄敏感词，政策文本中应避免出现低俗或违法内容。" },
  { term: "暴力恐吓", reason: "涉暴敏感词，政策文本中应避免出现违法或不当内容。" },
  { term: "血腥", reason: "涉暴敏感词，政策文本中应避免出现不当内容。" },
  { term: "恐怖袭击", reason: "涉暴敏感词，政策文本中应避免出现违法或极端内容。" },
  { term: "打架", reason: "涉暴敏感词，政策文本中应避免出现暴力或不当表述。" },
  { term: "斗殴", reason: "涉暴敏感词，政策文本中应避免出现暴力或不当表述。" },
];

/** 本地错用字词规则（不依赖大模型，命中即报） */
const localMisusedWordRules = [
  { wrong: "家快", right: "加快", reason: "错用字词：「家快」应为「加快」，属常见输入笔误。" },
];

/** 本地语法/语序规则（不依赖大模型，命中即报） */
const localGrammarRules = [
  {
    wrong: "制定本政草策稿",
    right: "制定本政策草稿",
    reason: "语法错误：「政草策」字序颠倒，规范表述为「政策草稿」。",
  },
  {
    wrong: "政草策",
    right: "政策草",
    reason: "语法错误：「政草策」字序颠倒，应为「政策草」（如政策草稿、政策草案）。",
  },
];

const fixedCollocationRules = [
  { wrong: "联动的机制", right: "联动机制", reason: "自定义固定搭配规则：「联动的机制」应规范为「联动机制」。" },
  { wrong: "协同的机制", right: "协同机制", reason: "自定义固定搭配规则：「协同的机制」应规范为「协同机制」。" },
  { wrong: "工作专班的机制", right: "工作专班机制", reason: "自定义固定搭配规则：机制类固定搭配应去掉冗余助词。" },
  { wrong: "给予支持资金", right: "给予资金支持", reason: "自定义固定搭配规则：「资金支持」为固定搭配。" },
  { wrong: "加大支持。", right: "加大支持力度。", reason: "自定义固定搭配规则：「加大」通常与「力度」搭配。" },
  { wrong: "健全完善", right: "健全", reason: "自定义固定搭配规则：「健全」「完善」语义重复，建议保留一项。" },
  { wrong: "高质量的发展", right: "高质量发展", reason: "自定义固定搭配规则：「高质量发展」为固定政策表达。" },
];

/** 段落 AI 操作選單 */
const PARA_ACTIONS = [
  { id: "accompany", icon: PenLine,      label: "AI伴写",    desc: "基于上下文续写内容" },
  { id: "expand",    icon: Expand,       label: "扩写",      desc: "丰富段落细节与论据" },
  { id: "polish",    icon: Paintbrush,   label: "润色",      desc: "优化表达与措辞" },
  { id: "calculate", icon: Calculator,   label: "资金测算",  desc: "测算资金规模与覆盖" },
  { id: "reserve",   icon: BookmarkPlus, label: "加入条款储备库", desc: "收藏至条款储备库" },
] as const;

function PolicyCalculatorWorkspace({ initialClauseContent }: { initialClauseContent?: string }) {
  return <div className="min-h-0 flex-1 overflow-y-auto p-4"><FundingWorkspace initialClauseContent={initialClauseContent} /></div>;
}

function PolicyReferenceSourcesPanel({
  citations = [],
  selectedPolicies = [],
}: {
  citations: Citation[];
  selectedPolicies: PolicyItem[];
}) {
  const [refsExpanded, setRefsExpanded] = useState(false);
  const selectedRefs = selectedPolicies.filter((p) => p.selected);
  const bodyCitations: Citation[] =
    citations.length > 0
      ? citations
      : selectedRefs.slice(0, 4).map((policy, index) => ({
          index: index + 1,
          title: policy.title,
          url: policy.url,
          source: policy.source,
        }));

  const groupedRefs = (["yizhuang", "beijing", "national", "other", "material"] as const).map((level) => ({
    level,
    label: referenceLevelLabels[level],
    items: selectedRefs.filter((p) => p.level === level),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">参考来源</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          政策正文中的 [ref:N] 角标与起草阶段纳入的参考政策
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5">
        {bodyCitations.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-medium text-foreground">
              正文引用（{bodyCitations.length}）
            </p>
            <div className="space-y-2">
              {bodyCitations.map((cite) => (
                <div
                  key={cite.index}
                  className="relative rounded-lg border border-border bg-muted/20 px-3 py-2.5 pr-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded border border-primary/25 bg-primary/10 px-1 text-[10px] font-bold text-primary">
                      {cite.index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-snug text-foreground line-clamp-3">
                        {cite.title}
                      </p>
                      {cite.source && (
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">{cite.source}</p>
                      )}
                      {cite.url && cite.url !== "#" && (
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                        >
                          查看原文
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {groupedRefs.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setRefsExpanded((v) => !v)}
              className="mb-2 flex w-full items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              {refsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              检索参考（{selectedRefs.length}）
            </button>
            {refsExpanded && (
              <div className="space-y-3">
                {groupedRefs.map((group) => (
                  <div key={group.level}>
                    <p className="mb-1.5 text-[11px] text-muted-foreground">{group.label}</p>
                    <div className="space-y-1.5">
                      {group.items.map((policy) => (
                        <div
                          key={policy.id}
                          className="relative rounded-lg border border-border/80 bg-background px-3 py-2.5 pb-7"
                        >
                          {policy.url && policy.url !== "#" ? (
                            <a
                              href={policy.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium leading-snug text-primary hover:underline line-clamp-2"
                            >
                              {policy.title}
                            </a>
                          ) : (
                            <p className="text-xs font-medium leading-snug text-foreground line-clamp-2">
                              {policy.title}
                            </p>
                          )}
                          {policy.source && (
                            <p className="mt-1 truncate text-[11px] text-muted-foreground">{policy.source}</p>
                          )}
                          {policy.level === "material" && (
                            <span className="absolute bottom-2 right-2 rounded border border-primary/20 bg-primary/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              我的素材
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {bodyCitations.length === 0 && selectedRefs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <BookOpen className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-xs">暂无参考来源</p>
            <p className="mt-1 text-[11px]">请在前序「政策检索」步骤勾选参考政策</p>
          </div>
        )}
      </div>
    </div>
  );
}

const splitReviewSentences = (content: string) =>
  (content.match(/[^。！？；\n]+[。！？；]?/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 6);

const compactReviewText = (text: string, maxLength = 86) => {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
};

const isLikelyReviewHeading = (sentence: string) =>
  /^(第[一二三四五六七八九十\d]+[章节条]|[一二三四五六七八九十]+、|附则|总则|支持方向|实施机制)/.test(sentence.trim());

const extractJsonArray = (text: string) => {
  const clean = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  try {
    const parsed = JSON.parse(clean.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildModelProofreadIssues = async (content: string): Promise<Omit<ProofreadIssue, "id" | "status">[]> => {
  if (!isPolicyLlmConfigured()) return [];

  const response = await policyLlmChat({
    temperature: 0.1,
    max_tokens: 1600,
    system:
      "你是中文政策公文审稿专家。只检查错用字词和语法错误，不检查敏感词和固定搭配。只返回 JSON 数组，不要解释。",
    user: `请检查以下政策文本中的真实错用字词和语法错误。要求：
1. 只输出正文中实际存在的问题，不能编造示例。
2. original 必须是原文中连续出现的精确片段。
3. type 只能是 "misused" 或 "grammar"。
4. replacement 是建议修改后的片段。
5. reason 简短说明原因。
6. 如果没有问题，返回 []。
7. 重点关注：相邻字笔误（如「家快」应为「加快」）、政策公文语序颠倒（如「政草策」应为「政策草」）、动宾搭配不当。

返回格式：
[
  {"type":"misused","original":"原文片段","replacement":"修改片段","reason":"原因"},
  {"type":"grammar","original":"原文片段","replacement":"修改片段","reason":"原因"}
]

政策文本：
${content.slice(0, 5000)}`,
  });

  return extractJsonArray(response)
    .map((item) => ({
      type: item?.type as ProofreadIssueType,
      title: item?.type === "grammar" ? "语法错误" : "错用字词",
      original: typeof item?.original === "string" ? item.original.trim() : "",
      replacement: typeof item?.replacement === "string" ? item.replacement.trim() : "",
      reason: typeof item?.reason === "string" ? item.reason.trim() : "模型识别到该处表达存在问题，建议按修改片段调整。",
    }))
    .filter((issue) =>
      (issue.type === "misused" || issue.type === "grammar") &&
      issue.original &&
      issue.replacement &&
      issue.original !== issue.replacement &&
      content.includes(issue.original)
    );
};

const buildPolicyReviewIssues = async (content: string): Promise<ProofreadIssue[]> => {
  const sentences = splitReviewSentences(content);
  const issues: ProofreadIssue[] = [];
  const usedOriginals = new Set<string>();

  const addIssue = (issue: Omit<ProofreadIssue, "id" | "status">) => {
    const original = issue.original.trim();
    const replacement = issue.replacement.trim();
    if (!original || !replacement || original === replacement || usedOriginals.has(original)) return;
    usedOriginals.add(original);
    issues.push({
      ...issue,
      original,
      replacement,
      id: `${issue.type}-${issues.length + 1}`,
      status: "pending",
    });
  };

  sensitiveProofreadTerms.forEach(({ term, reason }) => {
    if (!content.includes(term)) return;
    addIssue({
      type: "sensitive",
      title: "敏感词",
      original: term,
      replacement: "请删除或替换为合规表述",
      reason,
    });
  });

  fixedCollocationRules.forEach(({ wrong, right, reason }) => {
    if (!content.includes(wrong)) return;
    addIssue({
      type: "collocation",
      title: "固定搭配",
      original: wrong,
      replacement: right,
      reason,
    });
  });

  localMisusedWordRules.forEach(({ wrong, right, reason }) => {
    if (!content.includes(wrong)) return;
    addIssue({
      type: "misused",
      title: "错用字词",
      original: wrong,
      replacement: right,
      reason,
    });
  });

  localGrammarRules
    .slice()
    .sort((a, b) => b.wrong.length - a.wrong.length)
    .forEach(({ wrong, right, reason }) => {
      if (!content.includes(wrong)) return;
      const coveredByLongerRule = issues.some(
        (existing) =>
          existing.type === "grammar" &&
          existing.original.length > wrong.length &&
          existing.original.includes(wrong),
      );
      if (coveredByLongerRule) return;
      addIssue({
        type: "grammar",
        title: "语法错误",
        original: wrong,
        replacement: right,
        reason,
      });
    });

  try {
    const modelIssues = await buildModelProofreadIssues(content);
    modelIssues.forEach(addIssue);
  } catch (e) {
    console.warn("[PolicyProofreadPanel] 模型校验失败，仅展示规则命中结果：", e);
  }

  if (!isPolicyLlmConfigured()) {
    sentences.forEach((sentence) => {
      if (isLikelyReviewHeading(sentence)) return;
      if (/的的|，，|。。|、，/.test(sentence)) {
        addIssue({
          type: "grammar",
          title: "语法错误",
          original: sentence,
          replacement: sentence.replace(/的的/g, "的").replace(/，，/g, "，").replace(/。。/g, "。").replace(/、，/g, "，"),
          reason: "模型未配置时的本地基础语法校验：发现重复字词或连续标点。",
        });
      }
    });
  }

  return issues;
};

type ProofreadAnalysisPhase = "analyzing" | "done";

function PolicyProofreadPanel({
  content,
  onAccept,
}: {
  content: string;
  onAccept: (issue: ProofreadIssue) => void;
}) {
  const [analysisPhase, setAnalysisPhase] = useState<ProofreadAnalysisPhase>("analyzing");
  const [issues, setIssues] = useState<ProofreadIssue[]>([]);

  const runFullAnalysis = (delayMs = 650) => {
    setAnalysisPhase("analyzing");
    return window.setTimeout(() => {
      buildPolicyReviewIssues(content).then((nextIssues) => {
        setIssues(nextIssues);
        setAnalysisPhase("done");
      });
    }, delayMs);
  };

  useEffect(() => {
    let cancelled = false;
    setAnalysisPhase("analyzing");
    const timer = window.setTimeout(() => {
      buildPolicyReviewIssues(content).then((nextIssues) => {
        if (cancelled) return;
        setIssues(nextIssues);
        setAnalysisPhase("done");
      });
    }, 850);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  // 面板打开时自动全文分析；采纳回写正文后保留当前审稿状态。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateIssueStatus = (id: string, status: ProofreadIssueStatus) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status } : issue)));
  };

  const handleRerunFullAnalysis = () => {
    runFullAnalysis(650);
  };

  const handleAccept = (issue: ProofreadIssue) => {
    onAccept(issue);
    updateIssueStatus(issue.id, "accepted");
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">审稿核稿</h3>
          </div>
          {analysisPhase === "analyzing" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              分析中
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              分析完成
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          对政策全文进行分析，识别敏感词、错用字词、固定搭配和语法错误
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {analysisPhase === "analyzing" ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">分析中</p>
            <p className="mt-1 text-xs text-muted-foreground">正在校验政策表述、搭配和语法风险...</p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[18px] font-bold text-slate-700">审稿核稿结果</h4>
                <button
                  type="button"
                  onClick={handleRerunFullAnalysis}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-blue-500 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  全文分析
                </button>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-[15px] font-bold text-slate-700">审核统计</p>
                <p className="text-xs text-slate-400">共发现 {issues.length} 处问题</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(Object.keys(proofreadTypeLabels) as ProofreadIssueType[]).map((type) => {
                  const count = issues.filter((issue) => issue.type === type).length;
                  const visual = proofreadTypeVisuals[type];
                  return (
                    <div
                      key={type}
                      className={`flex min-h-[86px] items-center gap-3 rounded-2xl border-l-4 ${visual.accent} bg-white px-3 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)]`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.iconBg} ${visual.iconText} text-lg font-bold`}>
                        {visual.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold leading-tight text-slate-700">{proofreadTypeLabels[type]}</p>
                        <p className={`mt-1 text-2xl font-bold leading-none ${visual.countText}`}>{count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 shadow-sm">
              <p className="mb-4 text-xs text-slate-400">点击条目可定位并高亮</p>

              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <ShieldCheck className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-xs">暂未发现明显问题</p>
                  <p className="mt-1 text-[11px]">当前正文已完成基础审稿核验</p>
                </div>
              ) : (
              <div className="space-y-4">
                {issues.map((issue) => {
                  const isActionable = issue.status === "pending" && !issue.isExample;
                  return (
                    <div
                      key={issue.id}
                      className={`rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-opacity ${
                        issue.status === "pending" ? "" : "opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-700">{proofreadTypeLabels[issue.type]}</p>
                          {issue.isExample && <p className="mt-0.5 text-[11px] text-slate-400">示例</p>}
                        </div>
                        {issue.status !== "pending" && !issue.isExample && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                            {issue.status === "accepted" ? "已采纳" : "已忽略"}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="min-h-[74px] rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-xs font-bold text-slate-400">原词</p>
                          <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-800">
                            {compactReviewText(issue.original, 34)}
                          </p>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xl font-bold text-blue-500">
                          -&gt;
                        </span>
                        <div className="min-h-[74px] rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="text-xs font-bold text-orange-400">建议</p>
                          <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-800">
                            {compactReviewText(issue.replacement, 34)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2">
                        {isActionable ? (
                          <>
                            <button
                              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
                              onClick={() => handleAccept(issue)}
                            >
                              采纳
                            </button>
                            <button
                              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => updateIssueStatus(issue.id, "ignored")}
                            >
                              忽略
                            </button>
                          </>
                        ) : (
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-400">
                            {issue.isExample ? "示例" : issue.status === "accepted" ? "已采纳" : "已忽略"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 政策工具選項 ─────────────────────────────────────────
const POLICY_TOOLS = [
  { value: "subsidy", label: "资金补贴类" },
  { value: "tax", label: "税收减免类" },
  { value: "talent", label: "人才引进类" },
  { value: "land", label: "用地保障类" },
  { value: "credit", label: "金融信贷类" },
  { value: "award", label: "奖励扶持类" },
  { value: "platform", label: "平台建设类" },
  { value: "procurement", label: "政府采购类" },
];

const REFERENCE_CLAUSES: Record<string, string[]> = {
  subsidy: [
    "对研发投入给予不超过实际发生额30%的补贴，单个企业年度最高500万元",
    "对符合条件的企业一次性给予20万元落地奖励",
    "对购置先进设备按设备价款的15%给予补贴，单次最高100万元",
  ],
  tax: [
    "对符合条件的高新技术企业按15%的税率征收企业所得税",
    "企业研发费用允许加计扣除100%，形成无形资产的按175%摊销",
    "对技术转让所得500万元以下部分免征企业所得税",
  ],
  talent: [
    "对引进的顶尖人才给予最高500万元安家补贴及配套科研经费",
    "对高层次人才提供人才公寓保障，租金按市场价70%收取",
    "对博士及以上学历人才给予每月3000元生活补贴，期限3年",
  ],
  land: [
    "对重点产业项目优先保障建设用地指标，享受土地出让金优惠",
    "对符合条件的企业允许弹性年期出让，最短5年",
    "支持企业利用自有用地建设研发楼宇，容积率适当提高",
  ],
  credit: [
    "对成长型科技企业给予最高500万元无抵押信用贷款",
    "对贷款利率超过同期LPR部分给予贴息补贴，每年最高100万元",
    "为区内企业建立融资信用档案，提供绿色通道融资服务",
  ],
  award: [
    "对新认定的国家级专精特新'小巨人'企业给予100万元奖励",
    "对获得国家科技进步奖的企业，按奖励金额1:1配套奖励",
    "对产品销售额首次突破1亿元的企业给予50万元奖励",
  ],
  platform: [
    "对新建国家级重点实验室给予最高2000万元建设补贴",
    "对企业建设的公共技术服务平台给予运营补贴，每年最高200万元",
    "支持企业牵头组建产业联盟，给予秘书处运营经费支持",
  ],
  procurement: [
    "政府采购创新产品优先采购区内企业产品，份额不低于30%",
    "对区内企业参与政府采购项目给予5%价格评审优惠",
    "建立政府首购和订购机制，对新产品推广应用给予支持",
  ],
};

// ─── 生成條款面板 ─────────────────────────────────────────
function ClauseGeneratorPanel({ policyTitle }: { policyTitle: string }) {
  const [objective, setObjective] = useState("");
  const [tool, setTool] = useState("");
  const [generatedClause, setGeneratedClause] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [refClauses, setRefClauses] = useState<string[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShowRef = () => {
    setRefClauses(REFERENCE_CLAUSES[tool] || []);
    setShowRef(true);
  };

  const handleGenerate = () => {
    if (!tool) return;
    setIsGenerating(true);
    setGeneratedClause("");
    const toolLabel = POLICY_TOOLS.find(t => t.value === tool)?.label || "";
    const base = REFERENCE_CLAUSES[tool]?.[0] || "";
    const result = `【${toolLabel}】\n\n${objective ? `基于政策目标"${objective}"，结合${policyTitle}的实际情况，` : ""}${base}。\n\n申报企业须满足以下条件：\n（一）在本区注册并正常经营一年以上；\n（二）企业信用状况良好；\n（三）提交完整的申请材料并通过专家评审。`;
    let i = 0;
    const interval = setInterval(() => {
      if (i < result.length) {
        setGeneratedClause(result.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 18);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedClause).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 space-y-0 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">生成条款</h3>

      {/* 政策目標 */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-0.5 h-3.5 bg-primary rounded-full" />
          <p className="text-xs font-medium text-foreground">政策目标</p>
        </div>
        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="请输入政策目标"
          className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* 政策工具 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3.5 bg-primary rounded-full" />
            <p className="text-xs font-medium text-foreground">政策工具</p>
          </div>
          <button
            onClick={handleShowRef}
            disabled={!tool}
            className="text-xs px-2.5 py-1 rounded-md border border-primary text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            参考条款
          </button>
        </div>
        <div className="relative">
          <select
            value={tool}
            onChange={(e) => { setTool(e.target.value); setShowRef(false); setRefClauses([]); }}
            className="w-full h-9 px-3 pr-8 text-xs rounded-lg border border-border bg-background text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="">请选择政策工具</option>
            {POLICY_TOOLS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* 參考條款彈出 */}
        <AnimatePresence>
          {showRef && refClauses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-lg border border-primary/20 bg-primary/3 p-2 space-y-1.5"
            >
              <p className="text-[11px] font-medium text-primary mb-1.5">参考条款示例</p>
              {refClauses.map((clause, i) => (
                <div
                  key={i}
                  onClick={() => { setGeneratedClause(clause); setShowRef(false); }}
                  className="text-[11px] text-muted-foreground leading-relaxed px-2 py-1.5 rounded-md hover:bg-primary/8 hover:text-foreground cursor-pointer transition-colors border border-transparent hover:border-primary/15"
                >
                  {i + 1}. {clause}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 生成條款區域 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3.5 bg-primary rounded-full" />
            <p className="text-xs font-medium text-foreground">生成条款</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!tool || isGenerating}
            className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity font-medium flex items-center gap-1"
          >
            {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
            生成条款
          </button>
        </div>
        <div className="flex-1 relative">
          <textarea
            value={generatedClause}
            onChange={(e) => setGeneratedClause(e.target.value)}
            placeholder="点击「生成条款」自动生成，或直接在此输入条款内容"
            className="w-full h-full min-h-[160px] resize-none px-3 py-2.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 leading-relaxed"
          />
          {generatedClause && !isGenerating && (
            <button
              onClick={handleCopy}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copied ? "已复制" : "复制"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 自評估建議面板 ───────────────────────────────────────

type EvalLevel = "clear" | "vague" | "missing";

interface ClauseEval {
  id: string;
  /** 條款摘要（前30字） */
  clause: string;
  /** 受衆對象 */
  audience: { level: EvalLevel; note: string };
  /** 扶持方式 */
  method: { level: EvalLevel; note: string };
  /** 扶持力度 */
  intensity: { level: EvalLevel; note: string };
  /** 整體可落地性分數（0-100） */
  score: number;
}

const EVAL_LABEL: Record<EvalLevel, string> = { clear: "明確", vague: "模糊", missing: "缺失" };
const EVAL_COLOR: Record<EvalLevel, string> = {
  clear: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  vague: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  missing: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
};
const EVAL_DOT: Record<EvalLevel, string> = {
  clear: "bg-emerald-500",
  vague: "bg-amber-500",
  missing: "bg-red-500",
};

/** 從政策全文中提取條款並模擬評估 */
function evaluateClauses(content: string, policyTitle: string): ClauseEval[] {
  const mockClauses = [
    {
      clause: `对符合条件的${policyTitle.includes("科技") ? "科技" : ""}企业给予资金补贴`,
      audience: { level: "vague" as EvalLevel, note: "\"符合条件的企业\"范围未明确，建议细化行业、规模、注册地等准入标准" },
      method: { level: "clear" as EvalLevel, note: "资金补贴方式明确" },
      intensity: { level: "missing" as EvalLevel, note: "补贴金额、比例及上限均未说明，无法量化预期收益" },
      score: 42,
    },
    {
      clause: "对引进高层次人才给予生活补贴及安家费",
      audience: { level: "vague" as EvalLevel, note: "\"高层次人才\"定义模糊，建议对接国家人才目录或设定学历/职称门槛" },
      method: { level: "clear" as EvalLevel, note: "生活补贴与安家费均为常见扶持方式，执行路径清晰" },
      intensity: { level: "vague" as EvalLevel, note: "补贴金额区间未提及，建议明确各档次对应额度" },
      score: 58,
    },
    {
      clause: "对新认定的高新技术企业给予一次性奖励",
      audience: { level: "clear" as EvalLevel, note: "受众为新认定高企，认定标准清晰，边界明确" },
      method: { level: "clear" as EvalLevel, note: "一次性奖励操作简单，兑现路径明确" },
      intensity: { level: "missing" as EvalLevel, note: "奖励金额未注明，建议参照同类城市设定50-100万元区间" },
      score: 65,
    },
    {
      clause: "优先保障重点产业项目用地指标，享受土地出让优惠",
      audience: { level: "vague" as EvalLevel, note: "\"重点产业项目\"需配套产业目录，否则审批自由裁量空间过大" },
      method: { level: "clear" as EvalLevel, note: "用地保障与价格优惠的扶持逻辑清晰" },
      intensity: { level: "vague" as EvalLevel, note: "\"优惠\"程度不明，建议明确折扣比例或地价上限" },
      score: 55,
    },
    {
      clause: "对符合条件的贷款给予利率贴息补贴",
      audience: { level: "clear" as EvalLevel, note: "结合申贷企业范围限定，受众较为清晰" },
      method: { level: "clear" as EvalLevel, note: "贴息补贴操作成熟，银行配合度高" },
      intensity: { level: "clear" as EvalLevel, note: "贴息比例、年度上限均有说明，可落地性强" },
      score: 88,
    },
  ];

  // 若有真實正文，根據行數截取替換 clause 文字
  if (content.length > 100) {
    const lines = content.split("\n").filter(l => l.trim().length > 10);
    mockClauses.forEach((mc, i) => {
      if (lines[i * 3]) mc.clause = lines[i * 3].slice(0, 36).trim() + (lines[i * 3].length > 36 ? "..." : "");
    });
  }
  return mockClauses;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  const bg = score >= 80 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : score >= 60 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full border text-xs font-bold ${color} ${bg}`}>
      {score}分
    </span>
  );
}

function DimTag({ level, label }: { level: EvalLevel; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${EVAL_COLOR[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${EVAL_DOT[level]}`} />
      {label}：{EVAL_LABEL[level]}
    </span>
  );
}

function EvaluationPanel({ content, policyTitle }: { content: string; policyTitle: string }) {
  const [status, setStatus] = useState<"idle" | "evaluating" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ClauseEval[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [stepIdx, setStepIdx] = useState(0);

  const STEPS = [
    "解析政策条款结构...",
    "评估受众对象清晰度...",
    "分析扶持方式可行性...",
    "衡量扶持力度明确性...",
    "生成可落地性报告...",
  ];

  const handleStart = () => {
    setStatus("evaluating");
    setProgress(0);
    setStepIdx(0);
    setResults([]);

    let p = 0;
    let s = 0;
    const timer = setInterval(() => {
      p += Math.random() * 10 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        const evals = evaluateClauses(content, policyTitle);
        setResults(evals);
        setProgress(100);
        setStatus("done");
      } else {
        setProgress(p);
        const ns = Math.min(Math.floor(p / 20), STEPS.length - 1);
        if (ns > s) s = ns;
        setStepIdx(s);
      }
    }, 300);
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setResults([]);
    setExpanded({});
  };

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const clearCount = results.filter(r => r.audience.level === "clear" && r.method.level === "clear" && r.intensity.level === "clear").length;

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">政策前评估</h3>
        {status === "done" && (
          <button onClick={handleReset} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3 w-3" />重新评估
          </button>
        )}
      </div>

      {/* 待機 */}
      {status === "idle" && (
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">条款可落地性评估</p>
              <p className="text-[11px] text-muted-foreground">从受众对象、扶持方式、扶持力度<br />三维度衡量条款描写是否明确</p>
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={!content}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            开始自评估
          </button>
        </div>
      )}

      {/* 評估中 */}
      {status === "evaluating" && (
        <div className="flex flex-col items-center justify-start gap-5 pt-4 flex-1">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                className="text-primary transition-all duration-300"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full space-y-1.5">
            {STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-[11px] transition-colors ${i <= stepIdx ? "text-foreground" : "text-muted-foreground/50"}`}>
                {i < stepIdx
                  ? <Check className="h-3 w-3 text-primary shrink-0" />
                  : i === stepIdx
                    ? <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                    : <div className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />}
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 評估完成 */}
      {status === "done" && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* 總覽卡 */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-0.5">综合评分</p>
              <ScoreBadge score={avgScore} />
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-foreground">{results.length}</p>
                <p className="text-[10px] text-muted-foreground">总条款</p>
              </div>
              <div>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{clearCount}</p>
                <p className="text-[10px] text-muted-foreground">完全明确</p>
              </div>
              <div>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">{results.length - clearCount}</p>
                <p className="text-[10px] text-muted-foreground">待完善</p>
              </div>
            </div>
          </div>

          {/* 圖例 */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            {(["clear", "vague", "missing"] as EvalLevel[]).map(lv => (
              <div key={lv} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${EVAL_DOT[lv]}`} />
                {EVAL_LABEL[lv]}
              </div>
            ))}
          </div>

          {/* 條款卡片列表 */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {results.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* 卡片頭部 */}
                <div
                  className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground font-medium leading-snug line-clamp-2">{r.clause}</p>
                    {/* 三維標籤 */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <DimTag level={r.audience.level} label="受众" />
                      <DimTag level={r.method.level} label="方式" />
                      <DimTag level={r.intensity.level} label="力度" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ScoreBadge score={r.score} />
                    <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${expanded[r.id] ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* 展開詳情 */}
                <AnimatePresence>
                  {expanded[r.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-3 py-2.5 space-y-2">
                        {[
                          { icon: Users, label: "受众对象", data: r.audience },
                          { icon: Banknote, label: "扶持方式", data: r.method },
                          { icon: BarChart3, label: "扶持力度", data: r.intensity },
                        ].map(({ icon: Icon, label, data }) => (
                          <div key={label} className="flex gap-2">
                            <div className={`flex items-center gap-1 shrink-0 text-[10px] font-medium w-16 ${
                              data.level === "clear" ? "text-emerald-600 dark:text-emerald-400" :
                              data.level === "vague" ? "text-amber-600 dark:text-amber-400" :
                              "text-red-600 dark:text-red-400"
                            }`}>
                              <Icon className="h-3 w-3 shrink-0" />
                              {label}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug flex-1">{data.note}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 大綱 Fallback（後端未返回時的預設結構）────────────────
const FALLBACK_OUTLINE: OutlineSection[] = [
  {
    id: "ch1", title: "一、总则",
    subSections: [
      { id: "ch1-1", title: "1.1 制定目的", keyPoints: ["明确政策出台背景", "阐述政策目标"], referencePolicies: [] },
      { id: "ch1-2", title: "1.2 适用范围", keyPoints: ["界定适用对象", "明确地域范围"], referencePolicies: [] },
    ],
  },
  {
    id: "ch2", title: "二、支持内容",
    subSections: [
      { id: "ch2-1", title: "2.1 支持方式", keyPoints: ["列举具体扶持工具", "说明资金来源"], referencePolicies: [] },
      { id: "ch2-2", title: "2.2 支持标准", keyPoints: ["量化支持力度", "分档设定标准"], referencePolicies: [] },
    ],
  },
  {
    id: "ch3", title: "三、申报条件",
    subSections: [
      { id: "ch3-1", title: "3.1 申报主体资格", keyPoints: ["注册地要求", "经营年限及规模门槛"], referencePolicies: [] },
      { id: "ch3-2", title: "3.2 申报材料", keyPoints: ["基本材料清单", "核查及佐证材料"], referencePolicies: [] },
    ],
  },
  {
    id: "ch4", title: "四、申报流程",
    subSections: [
      { id: "ch4-1", title: "4.1 受理与审核", keyPoints: ["申报时间窗口", "审核流程与时限"], referencePolicies: [] },
      { id: "ch4-2", title: "4.2 资金拨付", keyPoints: ["拨付方式", "绩效跟踪要求"], referencePolicies: [] },
    ],
  },
  {
    id: "ch5", title: "五、附则",
    subSections: [
      { id: "ch5-1", title: "5.1 解释权与生效日期", keyPoints: ["主管部门", "生效日期"], referencePolicies: [] },
    ],
  },
];

// ─── 行內編輯器（大綱面板用）────────────────────────────────
function OutlineInlineEditor({
  value, onSave, className = "",
}: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const commit = () => { onSave(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  if (!editing) {
    return (
      <span
        className={`group/oe flex items-center gap-1 cursor-pointer ${className}`}
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        <span className="flex-1">{value}</span>
        <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover/oe:opacity-100 shrink-0 transition-opacity" />
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 w-full">
      <input
        ref={ref} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        className={`flex-1 min-w-0 bg-primary/5 border border-primary/30 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary/30 ${className}`}
      />
      <button onClick={commit} className="text-primary shrink-0"><Check className="h-3 w-3" /></button>
      <button onClick={cancel} className="text-muted-foreground shrink-0"><X className="h-3 w-3" /></button>
    </span>
  );
}

function triggerPolicyDownload(content: BlobPart, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapePolicyHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function PolicyOutputPage({
  policyTitle,
  coreElements = "",
  selectedPolicies = [],
  outline: outlineProp = [],
  onBack,
  typewriterMode = false,
  directContent,
  flowHeader,
  onContentChange,
  onArchive,
  onRegenerate,
  archived = false,
}: PolicyOutputPageProps) {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (isComplete) onContentChange?.(displayedText);
  }, [isComplete, displayedText, onContentChange]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const fullContentRef = useRef("");

  /** 正文引用列表 */
  const [citations, setCitations] = useState<Citation[]>([]);

  /** 段落互動 */
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [paraMenuIdx, setParaMenuIdx] = useState<number | null>(null);
  const [paraActionResult, setParaActionResult] = useState<{ idx: number; action: string; text: string } | null>(null);
  const [paraActionLoading, setParaActionLoading] = useState(false);
  const [selectedClauseText, setSelectedClauseText] = useState("");
  const [calculatorClausePrefill] = useState("");
  const [selectionActionLoading, setSelectionActionLoading] = useState<string | null>(null);
  const editorBodyRef = useRef<HTMLDivElement | null>(null);

  /** 可編輯大綱 state — outlineProp 為空時使用模組層級的 FALLBACK_OUTLINE */
  const [editableOutline, setEditableOutline] = useState<OutlineSection[]>(() =>
    outlineProp.length > 0 ? outlineProp : FALLBACK_OUTLINE
  );
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const src = outlineProp.length > 0 ? outlineProp : FALLBACK_OUTLINE;
    const init: Record<string, boolean> = {};
    src.forEach((s) => { init[s.id] = true; });
    return init;
  });
  const [isOutlineRegenerating, setIsOutlineRegenerating] = useState(false);
  const [isContentRegenerating, setIsContentRegenerating] = useState(false);
  const [isTemplateUploading, setIsTemplateUploading] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (outlineProp.length > 0) {
      setEditableOutline(outlineProp);
      const init: Record<string, boolean> = {};
      outlineProp.forEach((s) => { init[s.id] = true; });
      setExpandedChapters(init);
    }
  }, [outlineProp.length]);

  /** 重新生成提綱（模擬） */
  const handleRegenerateOutline = () => {
    setIsOutlineRegenerating(true);
    setTimeout(() => {
      const base = outlineProp.length > 0 ? outlineProp : FALLBACK_OUTLINE;
      setEditableOutline(base.map(s => ({
        ...s,
        subSections: s.subSections.map(sub => ({
          ...sub,
          keyPoints: [...sub.keyPoints, "（重新生成补充要点）"],
        })),
      })));
      setIsOutlineRegenerating(false);
    }, 1800);
  };

  const applyTemplateOutline = (sections: OutlineSection[]) => {
    setEditableOutline(sections);
    const exp: Record<string, boolean> = {};
    sections.forEach((s) => { exp[s.id] = true; });
    setExpandedChapters(exp);
  };

  const handleTemplateFileChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setIsTemplateUploading(true);
    setTemplateMessage(null);
    try {
      const sections = await parsePolicyOutlineTemplate(file);
      applyTemplateOutline(sections);
      setTemplateMessage(null);
    } catch (err) {
      setTemplateMessage(err instanceof Error ? err.message : "体例模版解析失败");
    } finally {
      setIsTemplateUploading(false);
      if (templateInputRef.current) templateInputRef.current.value = "";
    }
  };

  const startTypewriter = (content: string) => {
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    fullContentRef.current = content;
    setIsComplete(false);
    setDisplayedText("");
    const charDelay = typewriterMode ? 6 : 12;
    let index = 0;
    typewriterIntervalRef.current = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    }, charDelay);
  };

  /** 按当前大纲重新生成正文 */
  const handleRegenerateContent = async () => {
    if (isContentRegenerating || isLoading) return;
    setIsContentRegenerating(true);
    setError(null);
    try {
      const { content, citations: cites } = await generateContent({
        policyTitle,
        coreElements,
        selectedPolicies,
        outline: editableOutline,
      });
      if (cites?.length) setCitations(cites);
      startTypewriter(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新生成正文失败");
    } finally {
      setIsContentRegenerating(false);
    }
  };

  /** 節：刪除參考文檔 */
  const removeRefFromSub = (sId: string, subId: string, ri: number) => {
    const sub = editableOutline.find(s => s.id === sId)?.subSections.find(s => s.id === subId);
    if (sub) patchSub(sId, subId, { referencePolicies: sub.referencePolicies.filter((_, i) => i !== ri) });
  };

  // ── 大綱編輯操作 ──
  const patchChapter = (sId: string, patch: Partial<OutlineSection>) =>
    setEditableOutline(prev => prev.map(s => (s.id === sId ? { ...s, ...patch } : s)));

  const updateChapterTitle = (sId: string, v: string) => patchChapter(sId, { title: v });

  const chapterKeyPoints = (sId: string) => editableOutline.find(s => s.id === sId)?.keyPoints ?? [];

  const updateChapterKeyPoint = (sId: string, pi: number, v: string) => {
    const pts = chapterKeyPoints(sId);
    patchChapter(sId, { keyPoints: pts.map((k, i) => (i === pi ? v : k)) });
  };

  const addChapterKeyPoint = (sId: string) => {
    patchChapter(sId, { keyPoints: [...chapterKeyPoints(sId), "新要点"] });
  };

  const removeChapterKeyPoint = (sId: string, pi: number) => {
    patchChapter(sId, { keyPoints: chapterKeyPoints(sId).filter((_, i) => i !== pi) });
  };

  const patchSub = (sId: string, subId: string, patch: Partial<OutlineSubSection>) =>
    setEditableOutline(prev => prev.map(s =>
      s.id === sId ? { ...s, subSections: s.subSections.map(sub => sub.id === subId ? { ...sub, ...patch } : sub) } : s
    ));

  const updateSubTitle = (sId: string, subId: string, v: string) => patchSub(sId, subId, { title: v });

  const updateKeyPoint = (sId: string, subId: string, pi: number, v: string) => {
    const sub = editableOutline.find(s => s.id === sId)?.subSections.find(s => s.id === subId);
    if (sub) patchSub(sId, subId, { keyPoints: sub.keyPoints.map((k, i) => i === pi ? v : k) });
  };

  const addKeyPoint = (sId: string, subId: string) => {
    const sub = editableOutline.find(s => s.id === sId)?.subSections.find(s => s.id === subId);
    if (sub) patchSub(sId, subId, { keyPoints: [...sub.keyPoints, "新要点"] });
  };

  const removeKeyPoint = (sId: string, subId: string, pi: number) => {
    const sub = editableOutline.find(s => s.id === sId)?.subSections.find(s => s.id === subId);
    if (sub) patchSub(sId, subId, { keyPoints: sub.keyPoints.filter((_, i) => i !== pi) });
  };

  const addSubSection = (sId: string) =>
    setEditableOutline(prev =>
      prev.map(s => {
        if (s.id !== sId) return s;
        return {
          ...s,
          keyPoints: s.subSections.length === 0 ? [] : (s.keyPoints ?? []),
          subSections: [
            ...s.subSections,
            { id: `${sId}-${Date.now()}`, title: "新节标题", keyPoints: ["新要点"], referencePolicies: [] },
          ],
        };
      }),
    );

  const removeChapter = (sId: string) => {
    if (editableOutline.length <= 1) return;
    setEditableOutline(prev => prev.filter(s => s.id !== sId));
    setExpandedChapters(prev => {
      const next = { ...prev };
      delete next[sId];
      return next;
    });
  };

  const moveChapter = (draggedId: string, targetId: string) => {
    setEditableOutline((prev) => reorderOutlineById(prev, draggedId, targetId));
  };

  const { bindDropZone, bindDragHandle, dropHighlight } = useOutlineChapterDrag(moveChapter);

  const removeSubSection = (sId: string, subId: string) => {
    const section = editableOutline.find(s => s.id === sId);
    if (!section) return;
    setEditableOutline(prev =>
      prev.map(s =>
        s.id === sId ? { ...s, subSections: s.subSections.filter(sub => sub.id !== subId) } : s,
      ),
    );
  };

  // directContent：从助手直接传入，跳过生成
  useEffect(() => {
    if (directContent) {
      fullContentRef.current = directContent;
      setDisplayedText(directContent);
      setIsComplete(true);
      setIsLoading(false);
    }
  // 仅在 directContent 首次挂载时执行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (directContent) return;
    setIsLoading(true);
    setError(null);
    generateContent({ policyTitle, coreElements, selectedPolicies, outline: outlineProp })
      .then(({ content, citations: cites }) => {
        if (cites?.length) setCitations(cites);
        setIsLoading(false);
        startTypewriter(content);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 將文章文字按問題詞語分割並包裹高亮 span
   * 敏感詞 → 紅色底，不當用詞 → 橙色底
   */
  /** 將純文字 token 轉為 React 節點，同時處理 [ref:N] 角標 */
  const renderToken = (token: string, keyPrefix: string) => {
    const citationMap = Object.fromEntries(citations.map(c => [`[ref:${c.index}]`, c]));
    const refPattern = citations.length > 0
      ? new RegExp(`(\\[ref:\\d+\\])`, "g")
      : null;

    if (!refPattern) return <span key={keyPrefix}>{token}</span>;

    const subParts = token.split(refPattern);
    return (
      <span key={keyPrefix}>
        {subParts.map((sub, si) => {
          const cite = citationMap[sub];
          if (!cite) return <span key={si}>{sub}</span>;
          return (
            <span key={si} className="relative inline-block group/cite">
              <a
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-w-[1.1em] h-[1.1em] text-[10px] font-bold leading-none align-super bg-primary/15 hover:bg-primary/30 text-primary rounded border border-primary/30 px-0.5 mx-0.5 cursor-pointer transition-colors no-underline"
                title={`${cite.title}${cite.source ? ` — ${cite.source}` : ""}`}
              >
                {cite.index}
              </a>
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none opacity-0 group-hover/cite:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                <span className="flex flex-col items-start gap-0.5 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg px-3 py-2.5 text-[11px] w-[380px] whitespace-normal">
                  <span className="font-semibold text-foreground">{cite.title}</span>
                  {cite.source && <span className="text-muted-foreground">{cite.source}</span>}
                  <span className="text-primary text-[10px]">点击跳转政策原文 →</span>
                </span>
                <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-1 overflow-hidden">
                  <span className="block w-2 h-2 bg-popover border-r border-b border-border rotate-45 -translate-y-1.5 translate-x-0" />
                </span>
              </span>
            </span>
          );
        })}
      </span>
    );
  };

  /** 渲染正文：處理引用角標 [ref:N] */
  const renderHighlightedText = (text: string) => renderToken(text, "all");

  const isPolicyHeadingLine = (line: string) => isPolicyStructureHeadingLine(line, policyTitle);

  const renderPolicyLines = (text: string, keyPrefix: string) =>
    text.split("\n").map((line, lineIndex) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={`${keyPrefix}-${lineIndex}`} className="h-2" />;
      const isHeading = isPolicyHeadingLine(trimmedLine);
      return (
        <p
          key={`${keyPrefix}-${lineIndex}`}
          className={isHeading ? "font-semibold text-foreground" : ""}
          style={isHeading ? undefined : { textIndent: "2em" }}
        >
          {renderHighlightedText(trimmedLine)}
        </p>
      );
    });

  const handleNavigateToPreEvaluation = () => {
    navigate("/policy-writing/pre-evaluation", {
      state: {
        startEvaluation: true,
        policyTitle,
        policyContent: displayedText || fullContentRef.current,
      },
    });
  };

  const handleToolClick = (id: string) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  const openFundingCalculation = (content: string) => {
    if (!content.trim()) return;
    const url = new URL(window.location.href);
    url.hash = `/policy-writing/model-estimation?${new URLSearchParams({ clause: content.trim() })}`;
    window.open(url.href, "_blank", "noopener,noreferrer");
  };

  const handleUseSelectionForCalculation = () => openFundingCalculation(selectedClauseText);

  const handleAcceptProofreadIssue = (issue: ProofreadIssue) => {
    const current = fullContentRef.current || displayedText;
    const next = current.includes(issue.original)
      ? current.replace(issue.original, issue.replacement)
      : current.replace(compactReviewText(issue.original), issue.replacement);
    fullContentRef.current = next;
    setDisplayedText(next);
  };

  const handleInsertClauseMaterial = (clauseText: string) => {
    const trimmed = clauseText.trim();
    if (!trimmed) return;
    const current = (fullContentRef.current || displayedText).trim();
    const next = current ? `${current}\n\n${trimmed}` : trimmed;
    fullContentRef.current = next;
    setDisplayedText(next);
  };

  const updateEditableTextBlock = (blockIndex: number, nextBlock: string) => {
    const blocks = (fullContentRef.current || displayedText).split(/\n{2,}/);
    const normalizedBlock = nextBlock
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!normalizedBlock || blocks[blockIndex]?.trim() === normalizedBlock) return;
    const nextBlocks = [...blocks];
    nextBlocks[blockIndex] = normalizedBlock;
    const nextContent = nextBlocks.join("\n\n");
    fullContentRef.current = nextContent;
    setDisplayedText(nextContent);
  };

  const applySelectionTextAction = (action: "polish" | "expand" | "accompany") => {
    const selected = selectedClauseText.trim();
    if (!selected) return;
    setSelectionActionLoading(action);
    setTimeout(() => {
      const content = fullContentRef.current || displayedText;
      let replaced = selected;
      if (action === "polish") {
        replaced = `经润色：${selected.replace(/，/g, "，并").replace(/。?$/, "。")}`;
      } else if (action === "expand") {
        replaced = `${selected} 同时，进一步细化适用对象、申报流程和绩效评估标准，明确审核口径与责任分工，提升条款可执行性。`;
      } else if (action === "accompany") {
        replaced = `${selected} 建议补充：符合条件的企业应在本区持续经营并按要求提交佐证材料，主管部门按程序组织审核兑现。`;
      }

      const next = content.includes(selected) ? content.replace(selected, replaced) : content;
      fullContentRef.current = next;
      setDisplayedText(next);
      setSelectionActionLoading(null);
      setSelectedClauseText("");
      window.getSelection()?.removeAllRanges();
    }, 700);
  };

  const handleDownload = () => {
    const content = (fullContentRef.current || displayedText).trim();
    if (!content) return;
    const safeTitle = policyTitle.replace(/[\\/:*?"<>|]/g, "_");
    triggerPolicyDownload(
      `\uFEFF${content}`,
      "text/plain;charset=utf-8",
      `${safeTitle}.txt`,
    );
  };

  const handleFormattedDownload = () => {
    const content = (fullContentRef.current || displayedText).trim();
    if (!content) return;

    const safeTitle = policyTitle.replace(/[\\/:*?"<>|]/g, "_");
    const bodyHtml = content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .filter((block, index) => !(index === 0 && block === policyTitle.trim()))
      .map((block) => {
        const escaped = escapePolicyHtml(block).replace(/\n/g, "<br>");
        const isHeading = isPolicyStructureHeadingLine(block);
        return isHeading
          ? `<p class="heading">${escaped}</p>`
          : `<p class="body">${escaped}</p>`;
      })
      .join("");

    const formattedDocument = `\uFEFF<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapePolicyHtml(policyTitle)}</title>
  <style>
    @page { size: A4; margin: 2.8cm 2.6cm; }
    body { font-family: "仿宋_GB2312", "FangSong", serif; color: #000; font-size: 16pt; line-height: 1.8; }
    h1 { margin: 0 0 28pt; text-align: center; font-family: "方正小标宋简体", "STZhongsong", serif; font-size: 22pt; font-weight: normal; line-height: 1.5; }
    p { margin: 0; }
    .heading { margin: 12pt 0 4pt; font-family: "黑体", "SimHei", sans-serif; font-weight: bold; text-indent: 0; }
    .body { text-align: justify; text-indent: 2em; }
  </style>
</head>
<body>
  <h1>${escapePolicyHtml(policyTitle)}</h1>
  ${bodyHtml}
</body>
</html>`;

    triggerPolicyDownload(
      formattedDocument,
      "application/msword;charset=utf-8",
      `${safeTitle}_格式化.doc`,
    );
  };

  return (
    <div className="flex flex-col -mx-6 -my-6 md:-mx-8 md:-my-8 px-6 py-0 md:px-8" style={{ height: "100vh" }}>
      {/* 快速起草模式：打字机输出进度提示条 */}
      {typewriterMode && !isComplete && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 mb-3 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0"
        >
          <div className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-xs font-medium">AI 正在输出政策全文，请稍候…</span>
        </motion.div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-semibold text-foreground">政策文件编辑</h2>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && !archived && onRegenerate && <Button variant="outline" size="sm" onClick={onRegenerate}>重新生成正文</Button>}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-2"
            >
              <Button
                size="sm"
                className="text-xs gap-1.5 gov-gradient text-primary-foreground hover:opacity-90"
                onClick={handleNavigateToPreEvaluation}
              >
                政策前评估
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                下载
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleFormattedDownload}
              >
                <Download className="h-3.5 w-3.5" />
                格式化下载
              </Button>
            </motion.div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/policy-writing/drafting/tasks")}
          >
            <List className="h-4 w-4" />
            历史任务列表
          </Button>
        </div>
      </div>

      {flowHeader}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left tool sidebar */}
        <div className="w-[132px] shrink-0">
          <div className="rounded-[26px] border border-border bg-card/95 px-3 py-4 shadow-sm">
            <div className="flex flex-col gap-2">
              {editorTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`group w-full rounded-2xl px-2 py-2.5 transition-colors ${
                    activePanel === tool.id ? "bg-muted/70" : "hover:bg-muted/45"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <tool.icon
                        className={`h-7 w-7 transition-colors ${
                          activePanel === tool.id
                            ? "text-primary"
                            : "text-slate-500 group-hover:text-slate-600"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs leading-none tracking-tight whitespace-nowrap transition-colors ${
                        activePanel === tool.id
                          ? "text-primary"
                          : "text-slate-600 group-hover:text-slate-700"
                      }`}
                    >
                      {tool.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-card rounded-xl border border-border min-w-0 flex flex-col min-h-0"
        >
          {activePanel === "calculate" ? (
            <PolicyCalculatorWorkspace initialClauseContent={calculatorClausePrefill} />
          ) : (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border flex-wrap shrink-0">
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="撤销"><Undo2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="重做"><Redo2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
                <div className="w-px h-4 bg-border mx-1.5" />
                <select className="h-7 px-2 text-xs rounded border border-border bg-background text-foreground appearance-none cursor-pointer">
                  <option>正文</option>
                  <option>标题一</option>
                  <option>标题二</option>
                  <option>标题三</option>
                </select>
                <select className="h-7 px-2 text-xs rounded border border-border bg-background text-foreground appearance-none cursor-pointer ml-1">
                  <option>14px</option>
                  <option>12px</option>
                  <option>16px</option>
                  <option>18px</option>
                  <option>20px</option>
                </select>
                <div className="w-px h-4 bg-border mx-1.5" />
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="加粗"><Bold className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="斜体"><Italic className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="下划线"><Underline className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="删除线"><Strikethrough className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
                <div className="w-px h-4 bg-border mx-1.5" />
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors bg-muted" title="左对齐"><AlignLeft className="h-3.5 w-3.5 text-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="居中"><AlignCenter className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="右对齐"><AlignRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
                <div className="w-px h-4 bg-border mx-1.5" />
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="无序列表"><List className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors" title="有序列表"><ListOrdered className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
              </div>

              <div
                ref={editorBodyRef}
                className="px-12 py-8 overflow-y-auto flex-1"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-para-menu]")) return;
                  setParaMenuIdx(null);
                }}
                onMouseUp={() => {
                  const selection = window.getSelection();
                  if (!selection || selection.rangeCount === 0) return;
                  const selectedText = selection.toString().trim();
                  if (!selectedText) return;
                  const range = selection.getRangeAt(0);
                  const container = editorBodyRef.current;
                  if (!container) return;
                  const withinEditor = container.contains(range.commonAncestorContainer);
                  if (!withinEditor) return;
                  setSelectedClauseText(selectedText);
                }}
              >
                <p className="font-semibold text-lg mb-6 text-foreground text-center">{policyTitle}</p>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">正在根据检索与大纲生成政策全文...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-destructive">
                    <p className="text-sm">正文生成失败：{error}</p>
                  </div>
                ) : (
                  <>
                {/* 段落按块渲染：避免逐行碎片化展示，完成后支持 hover 交互 */}
                <div className="text-base text-foreground leading-[1.95] space-y-3 pr-4">
                  {isComplete ? (
                    displayedText.split(/\n{2,}/).map((block, idx) => {
                      const trimmed = block.trim();
                      if (!trimmed) return <div key={idx} className="h-2" />;
                      const isActive = activeParagraph === idx;
                      const isMenuOpen = paraMenuIdx === idx;
                      return (
                        <div
                          key={idx}
                          className="group relative flex items-start gap-2"
                          onMouseEnter={() => setActiveParagraph(idx)}
                          onMouseLeave={() => { if (paraMenuIdx !== idx) setActiveParagraph(null); }}
                        >
                          {/* 左側 AI 圖標 */}
                          <button
                            className={`shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all ${
                              isMenuOpen
                                ? "opacity-100 bg-primary text-white shadow"
                                : "opacity-0 group-hover:opacity-100 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                            }`}
                            title="AI 操作"
                            onClick={(e) => {
                              e.stopPropagation();
                              setParaMenuIdx(isMenuOpen ? null : idx);
                              setActiveParagraph(idx);
                              setParaActionResult(null);
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                          </button>

                          {/* 段落文字 */}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            role="textbox"
                            aria-multiline="true"
                            tabIndex={0}
                            className={`flex-1 rounded px-1 -mx-1 transition-colors outline-none focus:bg-primary/5 focus:ring-1 focus:ring-primary/20 ${
                              isActive || isMenuOpen ? "bg-primary/5" : ""
                            }`}
                            onBlur={(e) => updateEditableTextBlock(idx, e.currentTarget.innerText)}
                            onFocus={() => setActiveParagraph(idx)}
                          >
                            <div className="space-y-2">{renderPolicyLines(trimmed, `block-${idx}`)}</div>
                          </div>

                          {/* 操作選單 */}
                          {isMenuOpen && (
                            <div
                              data-para-menu
                              className="absolute left-6 top-6 z-50 bg-card border border-border rounded-xl shadow-lg p-2 w-56"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] text-muted-foreground px-2 pb-1.5 font-medium">AI 段落操作</p>
                              {PARA_ACTIONS.map((action) => {
                                const Icon = action.icon;
                                const isLoading = paraActionLoading && paraActionResult?.action === action.id && paraActionResult.idx === idx;
                                return (
                                  <button
                                    key={action.id}
                                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                                    onClick={() => {
                                      if (action.id === "calculate") {
                                        openFundingCalculation(trimmed);
                                        setParaMenuIdx(null);
                                        setParaActionLoading(false);
                                        return;
                                      }
                                      setParaActionLoading(true);
                                      setParaActionResult({ idx, action: action.id, text: "" });
                                      setTimeout(() => {
                                        const resultMap: Record<string, string> = {
                                          accompany: "（AI伴写）本条款可进一步明确适用范围，建议补充：符合条件的企业须在本市注册登记满一年，且近三年无重大违规记录...",
                                          expand: "（扩写）为确保政策精准落地，本条款在执行过程中应注意以下几点：一是明确申报主体资格；二是规范资金拨付流程；三是建立绩效评估机制...",
                                          polish: "（润色）本条款经优化后表述更为规范：依据相关法律法规，对符合条件的市场主体给予相应支持，具体标准由主管部门另行制定。",
                                          calculate: "（资金测算）预计覆盖企业：约 1,200 家；年度资金需求：约 3,600 万元；人均补贴：约 3 万元/企业。",
                                          reserve: "✓ 已成功加入条款储备库",
                                        };
                                        setParaActionResult({ idx, action: action.id, text: resultMap[action.id] ?? "操作完成" });
                                        setParaActionLoading(false);
                                      }, 1200);
                                    }}
                                  >
                                    {isLoading
                                      ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                                      : <Icon className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    <div>
                                      <p className="text-xs font-medium text-foreground">{action.label}</p>
                                      <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                                    </div>
                                  </button>
                                );
                              })}
                              {/* 操作結果展示 */}
                              {paraActionResult && paraActionResult.idx === idx && paraActionResult.text && !paraActionLoading && (
                                <div className="mt-2 mx-1 p-2 bg-primary/5 rounded-lg border border-primary/20">
                                  <p className="text-[11px] text-foreground leading-relaxed">{paraActionResult.text}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="whitespace-pre-line text-base leading-[1.95] indent-[2em]">
                      {displayedText}<span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                    </div>
                  )}
                </div>

                {isComplete && (
                  <>
                    {/* 參考文獻列表 */}
                    {citations.length > 0 && (
                      <div className="mt-8 pt-5 border-t border-border/60">
                        <p className="text-xs font-semibold text-foreground mb-2.5">参考文献</p>
                        <ol className="space-y-1.5 list-none">
                          {citations.map((cite) => (
                            <li key={cite.index} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center justify-center min-w-[1.3em] h-[1.3em] text-[10px] font-bold bg-primary/10 text-primary rounded border border-primary/20 shrink-0 mt-0.5">
                                {cite.index}
                              </span>
                              <span className="leading-relaxed">
                                {cite.title}
                                {cite.source && <span className="text-muted-foreground/70 ml-1">[{cite.source}]</span>}
                                {cite.url && (
                                  <a
                                    href={cite.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 ml-1.5 text-primary hover:underline"
                                  >
                                    查看原文
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
                  </>
                )}

                {selectedClauseText && (
                  <div className="sticky bottom-4 z-30 ml-auto mt-4 w-fit rounded-xl border border-primary/30 bg-background/95 p-2 shadow-lg backdrop-blur">
                    <div className="mb-1 px-1 text-[10px] text-muted-foreground max-w-[340px] truncate">
                      已选中：{selectedClauseText}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={handleUseSelectionForCalculation}
                      >
                        资金测算
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        disabled={selectionActionLoading !== null}
                        onClick={() => applySelectionTextAction("polish")}
                      >
                        {selectionActionLoading === "polish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "润色"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        disabled={selectionActionLoading !== null}
                        onClick={() => applySelectionTextAction("expand")}
                      >
                        {selectionActionLoading === "expand" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "扩写"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        disabled={selectionActionLoading !== null}
                        onClick={() => applySelectionTextAction("accompany")}
                      >
                        {selectionActionLoading === "accompany" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "续写"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          setSelectedClauseText("");
                          window.getSelection()?.removeAllRanges();
                        }}
                      >
                        关闭
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        {/* Right side panel */}
        <AnimatePresence>
          {activePanel && activePanel !== "calculate" && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 360 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 overflow-hidden min-h-0"
            >
              <div className="w-[360px] bg-card rounded-xl border border-border h-full flex flex-col min-h-0">
                {activePanel === "outline" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* 頭部：固定不滾動 */}
                    <div className="space-y-2 px-4 pt-4 pb-2 shrink-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">大纲编辑</h3>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">拖动章节可调整顺序</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRegenerateOutline}
                          disabled={isOutlineRegenerating || isTemplateUploading}
                          className="flex shrink-0 items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isOutlineRegenerating
                            ? <><Loader2 className="h-3 w-3 animate-spin" />生成中…</>
                            : <><RefreshCw className="h-3 w-3" />重新生成</>}
                        </button>
                      </div>
                      <input
                        ref={templateInputRef}
                        type="file"
                        accept=".docx,.txt,.md,.text"
                        className="hidden"
                        onChange={(e) => void handleTemplateFileChange(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-auto min-h-9 flex items-center justify-center gap-2 whitespace-normal py-2 text-xs leading-snug"
                        disabled={isTemplateUploading || isOutlineRegenerating}
                        onClick={() => templateInputRef.current?.click()}
                      >
                        {isTemplateUploading ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>上传文档提取大纲</span>
                      </Button>
                      {templateMessage && (
                        <p className="text-[11px] leading-relaxed text-destructive">{templateMessage}</p>
                      )}
                    </div>

                    {/* 可滾動的大綱內容 */}
                    <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
                      <div className="text-xs space-y-2">
                        {editableOutline.map((section) => (
                          <div
                            key={section.id}
                            className={`rounded-lg border border-border overflow-hidden ${dropHighlight(section.id)}`}
                            {...bindDropZone(section.id)}
                          >
                            {/* 一級章標題 */}
                            <div className="flex items-center justify-between gap-2 px-2.5 py-2 bg-muted/40 hover:bg-muted/60 transition-colors">
                              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                {editableOutline.length > 1 && (
                                  <button
                                    type="button"
                                    aria-label="拖动排序"
                                    className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
                                    {...bindDragHandle(section.id)}
                                  >
                                    <GripVertical className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setExpandedChapters(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                  className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  {expandedChapters[section.id]
                                    ? <ChevronDown className="h-3 w-3" />
                                    : <ChevronRight className="h-3 w-3" />}
                                </button>
                                <OutlineInlineEditor
                                  value={section.title}
                                  onSave={(v) => updateChapterTitle(section.id, v)}
                                  className="font-semibold text-foreground text-xs"
                                />
                              </div>
                              {editableOutline.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeChapter(section.id)}
                                  className="shrink-0 text-[11px] text-destructive hover:underline flex items-center gap-0.5"
                                >
                                  <X className="h-3 w-3" />
                                  删除
                                </button>
                              )}
                            </div>

                            {expandedChapters[section.id] && (
                              <>
                                {(section.subSections?.length ?? 0) === 0 && (
                                  <div className="border-b border-border/50 bg-muted/10 px-3 py-2 space-y-1.5">
                                    <p className="text-[11px] font-medium text-muted-foreground">核心要点</p>
                                    {(section.keyPoints ?? []).length > 0 && (
                                      <ul className="space-y-0.5 pl-2">
                                        {(section.keyPoints ?? []).map((pt, pi) => (
                                          <li key={pi} className="flex items-center gap-1 group/ckp">
                                            <span className="text-primary shrink-0 text-[10px]">•</span>
                                            <OutlineInlineEditor
                                              value={pt}
                                              onSave={(v) => updateChapterKeyPoint(section.id, pi, v)}
                                              className="text-muted-foreground text-[11px] flex-1"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeChapterKeyPoint(section.id, pi)}
                                              className="opacity-0 group-hover/ckp:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                                            >
                                              <X className="h-2.5 w-2.5" />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => addChapterKeyPoint(section.id)}
                                      className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors pl-2"
                                    >
                                      <Plus className="h-3 w-3" />添加要点
                                    </button>
                                  </div>
                                )}

                                {/* 二級節 */}
                                {(section.subSections?.length ?? 0) > 0 && (
                                <div className="divide-y divide-border/50">
                                {section.subSections.map((sub) => (
                                    <div key={sub.id} className="px-3 py-2 space-y-1.5">
                                      {/* 節標題 */}
                                      <div className="flex items-start justify-between gap-2">
                                        <OutlineInlineEditor
                                          value={sub.title}
                                          onSave={(v) => updateSubTitle(section.id, sub.id, v)}
                                          className="font-medium text-foreground text-[11px] flex-1 min-w-0"
                                        />
                                        {(section.subSections?.length ?? 0) >= 1 && (
                                          <button
                                            type="button"
                                            onClick={() => removeSubSection(section.id, sub.id)}
                                            className="shrink-0 text-[11px] text-destructive hover:underline flex items-center gap-0.5"
                                          >
                                            <X className="h-3 w-3" />
                                            删除
                                          </button>
                                        )}
                                      </div>
                                      {/* 要點列表 */}
                                      <ul className="space-y-0.5 pl-2">
                                        {sub.keyPoints?.map((pt, pi) => (
                                          <li key={pi} className="flex items-center gap-1 group/kp">
                                            <span className="text-primary shrink-0 text-[10px]">•</span>
                                            <OutlineInlineEditor
                                              value={pt}
                                              onSave={(v) => updateKeyPoint(section.id, sub.id, pi, v)}
                                              className="text-muted-foreground text-[11px] flex-1"
                                            />
                                            <button
                                              onClick={() => removeKeyPoint(section.id, sub.id, pi)}
                                              className="opacity-0 group-hover/kp:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                                            >
                                              <X className="h-2.5 w-2.5" />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                      <button
                                        onClick={() => addKeyPoint(section.id, sub.id)}
                                        className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary transition-colors pl-2"
                                      >
                                        <Plus className="h-3 w-3" />添加要点
                                      </button>

                                      {/* 參考文檔標籤列表（ref 是物件，顯示 title 欄位） */}
                                      {(sub.referencePolicies?.length ?? 0) > 0 && (
                                        <div className="flex flex-wrap gap-1 pl-2 pt-0.5">
                                          {sub.referencePolicies.map((ref, ri) => {
                                            const label = typeof ref === "string" ? ref : ref.title;
                                            return (
                                              <span key={ri} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5">
                                                <FileText className="h-2.5 w-2.5 shrink-0" />
                                                {label}
                                                <button
                                                  onClick={() => removeRefFromSub(section.id, sub.id, ri)}
                                                  className="hover:text-destructive transition-colors ml-0.5"
                                                >
                                                  <X className="h-2.5 w-2.5" />
                                                </button>
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                ))}
                                </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => addSubSection(section.id)}
                                  className="flex items-center gap-1 w-full px-3 py-1.5 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-t border-dashed border-border"
                                >
                                  <Plus className="h-3 w-3" />添加节
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-border bg-card px-4 py-3">
                      <Button
                        type="button"
                        className="h-9 w-full gap-1.5 rounded-lg text-xs"
                        disabled={isContentRegenerating || isLoading}
                        onClick={handleRegenerateContent}
                      >
                        {isContentRegenerating ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            正在重新生成正文…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" />
                            重新生成正文
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {activePanel === "clause" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                    <ClauseGeneratorPanel policyTitle={policyTitle} />
                  </div>
                )}
                {activePanel === "reference" && (
                  <PolicyReferenceSourcesPanel citations={citations} selectedPolicies={selectedPolicies} />
                )}
                {activePanel === "proofread" && (
                  <PolicyProofreadPanel
                    content={displayedText || fullContentRef.current}
                    onAccept={handleAcceptProofreadIssue}
                  />
                )}
                {activePanel === "material" && (
                  <ClauseMaterialPanel onInsert={handleInsertClauseMaterial} />
                )}
                {activePanel !== "mindmap" && activePanel !== "outline" && activePanel !== "reference" && activePanel !== "proofread" && activePanel !== "material" && activePanel !== "clause" && (
                  <div className="p-4 flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                    <p className="text-sm">功能开发中...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isComplete && onArchive && (
        <div className="mt-3 flex shrink-0 items-center gap-3 border-t border-border bg-background px-5 py-5">
          {!archived && <Button className="h-11 shrink-0 px-5" variant="outline" onClick={onBack}><ArrowLeft className="mr-1.5 h-4 w-4" />返回上一步</Button>}
          <Button className={`h-11 flex-1 ${archived ? "border-gray-300 bg-gray-100 text-gray-700 disabled:opacity-100" : "gov-gradient text-primary-foreground hover:opacity-90"}`} variant={archived ? "outline" : "default"} disabled={archived} onClick={onArchive}>
            {archived ? "已归档" : "归档"}
          </Button>
        </div>
      )}
    </div>
  );
}
