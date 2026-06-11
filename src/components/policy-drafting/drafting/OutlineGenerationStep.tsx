import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Loader2, ChevronDown, ChevronRight,
  Pencil, Check, X, Plus, GripVertical, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { reorderOutlineById, useOutlineChapterDrag } from "./outlineDrag";
import { ReferencePolicyTag } from "./ReferencePolicyTag";
import { generateOutline } from "@/lib/policyDraftApi";
import { parsePolicyOutlineTemplate } from "@/lib/policyOutlineTemplate";
import type { PolicyItem } from "./PolicySearchStep";
import type { ClauseComparison } from "./PolicyAnalysisStep";

/** 二級節：第X條 */
export interface OutlineSubSection {
  id: string;
  title: string;
  keyPoints: string[];
  referencePolicies: { title: string; clause: string; url?: string }[];
}

/** 一級章：第X章 */
export interface OutlineSection {
  id: string;
  title: string;
  /** 章節級要點（可選，與二級節要點並存） */
  keyPoints?: string[];
  subSections: OutlineSubSection[];
}

interface OutlineGenerationStepProps {
  policyTitle: string;
  coreElements: string;
  coreItems?: { id: string; text: string; refs: { id: string; title: string; url?: string; clause?: string }[] }[];
  selectedPolicies: PolicyItem[];
  analysisResult?: ClauseComparison[];
  onOutlineComplete?: (outline: OutlineSection[]) => void;
}

const CHAPTER_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

function buildChapterTitle(index: number): string {
  const prefix = index < CHAPTER_NUMERALS.length ? CHAPTER_NUMERALS[index] : `${index + 1}`;
  return `${prefix}、新章节`;
}

// ─── 行內文字編輯器 ──────────────────────────────────────
function InlineEditor({
  value,
  onSave,
  textClass = "",
  inputClass = "",
}: {
  value: string;
  onSave: (v: string) => void;
  textClass?: string;
  inputClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { onSave(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) {
    return (
      <span
        className={`group/ie flex items-center gap-1 cursor-pointer min-w-0 ${textClass}`}
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        <span className="truncate">{value}</span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/ie:opacity-100 shrink-0 transition-opacity" />
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        className={`flex-1 min-w-0 bg-primary/5 border border-primary/30 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary/40 text-xs ${inputClass}`}
      />
      <button onClick={commit} className="text-primary hover:text-primary/70 shrink-0"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={cancel} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
    </span>
  );
}

function resolveReferenceUrl(
  ref: { title: string; url?: string },
  selectedPolicies: PolicyItem[],
): string | undefined {
  if (ref.url && ref.url !== "#") return ref.url;
  const matched = selectedPolicies.find((p) => p.title === ref.title);
  return matched?.url && matched.url !== "#" ? matched.url : undefined;
}

// ─── 二級節組件 ──────────────────────────────────────────
function SubSectionBlock({
  sub,
  selectedPolicies,
  canRemove,
  onUpdateTitle,
  onUpdateKeyPoint,
  onAddKeyPoint,
  onRemoveKeyPoint,
  onRemove,
}: {
  sub: OutlineSubSection;
  selectedPolicies: PolicyItem[];
  canRemove: boolean;
  onUpdateTitle: (v: string) => void;
  onUpdateKeyPoint: (pi: number, v: string) => void;
  onAddKeyPoint: () => void;
  onRemoveKeyPoint: (pi: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-4 py-3 space-y-3">
      {/* 二級標題 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">▸</span>
          <InlineEditor
            value={sub.title}
            onSave={onUpdateTitle}
            textClass="text-xs font-semibold text-foreground"
          />
        </div>
        {canRemove && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            删除
          </button>
        )}
      </div>

      {/* 核心要點 */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-1.5">核心要点</p>
        <ul className="space-y-1">
          {sub.keyPoints.map((pt, pi) => (
            <li key={pi} className="flex items-center gap-2 group/pt">
              <span className="text-primary text-xs shrink-0">•</span>
              <InlineEditor
                value={pt}
                onSave={(v) => onUpdateKeyPoint(pi, v)}
                textClass="text-xs text-foreground flex-1"
              />
              <button
                onClick={() => onRemoveKeyPoint(pi)}
                className="opacity-0 group-hover/pt:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={onAddKeyPoint}
          className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" />添加要点
        </button>
      </div>

      {sub.referencePolicies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sub.referencePolicies.map((ref, ri) => (
            <ReferencePolicyTag
              key={`${ref.title}-${ri}`}
              title={ref.title}
              url={resolveReferenceUrl(ref, selectedPolicies)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 主組件 ──────────────────────────────────────────────
export function OutlineGenerationStep({
  policyTitle,
  coreElements,
  coreItems,
  selectedPolicies,
  analysisResult,
  onOutlineComplete,
}: OutlineGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isTemplateUploading, setIsTemplateUploading] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsGenerating(true);
    setError(null);
    generateOutline({ policyTitle, coreElements, selectedPolicies, analysisResult, coreItems })
      .then(({ outline: result }) => {
        setOutline(result);
        const exp: Record<string, boolean> = {};
        result.forEach((s) => { exp[s.id] = true; });
        setExpandedChapters(exp);
        onOutlineComplete?.(result);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsGenerating(false));
  }, []);

  const update = (next: OutlineSection[]) => {
    setOutline(next);
    onOutlineComplete?.(next);
  };

  const toggleChapter = (id: string) =>
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── 章級編輯 ──
  const patchChapter = (sId: string, patch: Partial<OutlineSection>) =>
    update(outline.map((s) => (s.id === sId ? { ...s, ...patch } : s)));

  const updateChapterTitle = (sId: string, v: string) => patchChapter(sId, { title: v });

  const chapterKeyPoints = (sId: string) => outline.find((s) => s.id === sId)?.keyPoints ?? [];

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

  const addChapter = () => {
    const id = `part-${Date.now()}`;
    const newSection: OutlineSection = {
      id,
      title: buildChapterTitle(outline.length),
      keyPoints: [],
      subSections: [],
    };
    update([...outline, newSection]);
    setExpandedChapters((prev) => ({ ...prev, [id]: true }));
  };

  const addSubSection = (sId: string) => {
    const section = outline.find((s) => s.id === sId)!;
    const subCount = section.subSections.length;
    const subNumerals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    const subPrefix = subCount < subNumerals.length ? subNumerals[subCount] : `${subCount + 1}`;
    const newSub: OutlineSubSection = {
      id: `${sId}-${Date.now()}`,
      title: `（${subPrefix}）新节标题`,
      keyPoints: ["新要点"],
      referencePolicies: [],
    };
    update(
      outline.map((s) => {
        if (s.id !== sId) return s;
        return {
          ...s,
          keyPoints: s.subSections.length === 0 ? [] : (s.keyPoints ?? []),
          subSections: [...s.subSections, newSub],
        };
      }),
    );
  };

  const removeChapter = (sId: string) => {
    if (outline.length <= 1) return;
    update(outline.filter((s) => s.id !== sId));
    setExpandedChapters((prev) => {
      const next = { ...prev };
      delete next[sId];
      return next;
    });
  };

  const removeSubSection = (sId: string, subId: string) => {
    const section = outline.find((s) => s.id === sId);
    if (!section) return;
    update(
      outline.map((s) =>
        s.id === sId ? { ...s, subSections: s.subSections.filter((sub) => sub.id !== subId) } : s,
      ),
    );
  };

  // ── 節級編輯 ──
  const patchSub = (sId: string, subId: string, patch: Partial<OutlineSubSection>) =>
    update(outline.map((s) =>
      s.id === sId
        ? { ...s, subSections: s.subSections.map((sub) => sub.id === subId ? { ...sub, ...patch } : sub) }
        : s
    ));

  const updateSubTitle = (sId: string, subId: string, v: string) =>
    patchSub(sId, subId, { title: v });

  const updateKeyPoint = (sId: string, subId: string, pi: number, v: string) => {
    const sub = outline.find((s) => s.id === sId)!.subSections.find((sub) => sub.id === subId)!;
    patchSub(sId, subId, { keyPoints: sub.keyPoints.map((k, i) => i === pi ? v : k) });
  };

  const addKeyPoint = (sId: string, subId: string) => {
    const sub = outline.find((s) => s.id === sId)!.subSections.find((sub) => sub.id === subId)!;
    patchSub(sId, subId, { keyPoints: [...sub.keyPoints, "新要点"] });
  };

  const removeKeyPoint = (sId: string, subId: string, pi: number) => {
    const sub = outline.find((s) => s.id === sId)!.subSections.find((sub) => sub.id === subId)!;
    patchSub(sId, subId, { keyPoints: sub.keyPoints.filter((_, i) => i !== pi) });
  };

  const moveChapter = (draggedId: string, targetId: string) => {
    update(reorderOutlineById(outline, draggedId, targetId));
  };

  const { bindDropZone, bindDragHandle, dropHighlight } = useOutlineChapterDrag(moveChapter);

  const applyTemplateOutline = (sections: OutlineSection[]) => {
    update(sections);
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

  // ── 渲染 ──

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">正在根据检索与分析结果生成政策大纲...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
        <p className="text-sm">大纲生成失败：{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">大纲生成</h3>
          <p className="text-xs text-muted-foreground">拖动章节可调整顺序；点击标题或要点可直接编辑</p>
        </div>
        <div className="w-[220px] shrink-0 space-y-2">
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
            className="w-full h-auto min-h-10 flex items-center justify-center gap-2 whitespace-normal py-2.5 text-xs leading-snug"
            disabled={isTemplateUploading}
            onClick={() => templateInputRef.current?.click()}
          >
            {isTemplateUploading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 shrink-0" />
            )}
            <span>上传政策体例模版</span>
          </Button>
          {templateMessage && (
            <p className="text-[11px] leading-relaxed text-destructive">{templateMessage}</p>
          )}
        </div>
      </div>

      {/* 大綱列表 */}
      <div className="space-y-3">
        {outline.map((section, si) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }}
            className={`border border-border rounded-xl overflow-hidden ${dropHighlight(section.id)}`}
            {...bindDropZone(section.id)}
          >
            {/* 一級章標題欄 */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {outline.length > 1 && (
                  <button
                    type="button"
                    aria-label="拖动排序"
                    className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
                    {...bindDragHandle(section.id)}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => toggleChapter(section.id)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  {expandedChapters[section.id]
                    ? <ChevronDown className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />}
                </button>
                <InlineEditor
                  value={section.title}
                  onSave={(v) => updateChapterTitle(section.id, v)}
                  textClass="text-sm font-bold text-foreground"
                />
              </div>
              <div className="flex shrink-0 items-center gap-3 ml-2">
                <span className="text-xs text-muted-foreground">{section.subSections.length} 节</span>
                {outline.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChapter(section.id);
                    }}
                    className="text-xs text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    删除
                  </button>
                )}
              </div>
            </div>

            {/* 二級節列表 */}
            {expandedChapters[section.id] && (
              <div className="p-3 space-y-2">
                {section.subSections.length === 0 && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">核心要点</p>
                    {(section.keyPoints ?? []).length > 0 && (
                      <ul className="space-y-1">
                        {(section.keyPoints ?? []).map((pt, pi) => (
                          <li key={pi} className="flex items-center gap-2 group/cpt">
                            <span className="text-primary text-xs shrink-0">•</span>
                            <InlineEditor
                              value={pt}
                              onSave={(v) => updateChapterKeyPoint(section.id, pi, v)}
                              textClass="text-xs text-foreground flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => removeChapterKeyPoint(section.id, pi)}
                              className="opacity-0 group-hover/cpt:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => addChapterKeyPoint(section.id)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3" />添加要点
                    </button>
                  </div>
                )}

                {section.subSections.map((sub) => (
                  <SubSectionBlock
                    key={sub.id}
                    sub={sub}
                    selectedPolicies={selectedPolicies}
                    canRemove={section.subSections.length >= 1}
                    onUpdateTitle={(v) => updateSubTitle(section.id, sub.id, v)}
                    onUpdateKeyPoint={(pi, v) => updateKeyPoint(section.id, sub.id, pi, v)}
                    onAddKeyPoint={() => addKeyPoint(section.id, sub.id)}
                    onRemoveKeyPoint={(pi) => removeKeyPoint(section.id, sub.id, pi)}
                    onRemove={() => removeSubSection(section.id, sub.id)}
                  />
                ))}

                {/* 新增節 */}
                <button
                  onClick={() => addSubSection(section.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-primary/5 border border-dashed border-border hover:border-primary/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加二级节
                </button>
              </div>
            )}
          </motion.div>
        ))}

        <button
          type="button"
          onClick={addChapter}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          添加一级章节
        </button>
      </div>
    </div>
  );
}
