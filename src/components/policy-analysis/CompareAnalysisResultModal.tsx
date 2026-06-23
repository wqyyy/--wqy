import { useEffect, useMemo, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisResultItem, ClauseItem, DuplicateHit, DuplicateTextSegment } from "./compareAnalysisResults";

type CompareAnalysisResultModalProps = {
  open: boolean;
  result: AnalysisResultItem | null;
  clauses: ClauseItem[];
  onClose: () => void;
};

const PAGE_SIZE = 5;

function HighlightedDuplicateText({ segments }: { segments: DuplicateTextSegment[] }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
      {segments.map((segment, index) => (
        <span key={index} className={segment.highlight ? "font-medium text-primary" : undefined}>
          {segment.text}
        </span>
      ))}
    </p>
  );
}

function DuplicateHitCard({ hit, index }: { hit: DuplicateHit; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-4">
      <p className="text-sm font-semibold text-primary">
        {index}.重复率: {hit.overlapRate}
      </p>
      <div className="mt-3">
        <HighlightedDuplicateText segments={hit.segments} />
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        标题: {hit.sourceTitle}
      </p>
    </div>
  );
}

export function CompareAnalysisResultModal({
  open,
  result,
  clauses,
  onClose,
}: CompareAnalysisResultModalProps) {
  const [clauseOpen, setClauseOpen] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setClauseOpen(result?.detail.type !== "duplicate");
  }, [result?.id, result?.detail.type]);

  const selectedClauses = useMemo(() => {
    if (!result) return [];
    return clauses.filter((clause) => result.clauseIds.includes(clause.id));
  }, [clauses, result]);

  const duplicatePageData = useMemo(() => {
    if (!result || result.detail.type !== "duplicate") return { total: 0, items: [] };
    const start = (page - 1) * PAGE_SIZE;
    return {
      total: result.detail.hits.length,
      items: result.detail.hits.slice(start, start + PAGE_SIZE),
    };
  }, [page, result]);

  if (!open || !result) return null;

  const title = `${result.typeLabel} - 结果`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="关闭弹窗" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {result.detail.type === "duplicate" && (
            <p className="mb-4 text-sm text-foreground">
              共找到 <span className="font-semibold text-primary">{result.detail.duplicateCount}</span> 条重复结果
            </p>
          )}

          <div className="rounded-xl border border-border bg-muted/20">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                {result.contrastType === "diff" ? "所选条款" : "所选条款"}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-primary"
                onClick={() => setClauseOpen((v) => !v)}
              >
                {clauseOpen ? "收起条款信息" : "展开条款信息"}
                <ChevronUp className={cn("h-3.5 w-3.5 transition-transform", !clauseOpen && "rotate-180")} />
              </button>
            </div>
            {clauseOpen && (
              <div className="space-y-4 px-4 py-4">
                {selectedClauses.map((clause) => (
                  <div key={clause.id}>
                    {result.contrastType === "diff" && (
                      <p className="mb-2 text-sm font-semibold text-foreground">{clause.label}</p>
                    )}
                    <p className="text-sm leading-7 text-foreground">{clause.content}</p>
                    {clause.meta && <p className="mt-2 text-xs text-muted-foreground">{clause.meta}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.detail.type === "horizontal" && (
            <div className="mt-5 space-y-5 rounded-xl border border-border bg-background p-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">[相同点]</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                  {result.detail.similarities.map((item, index) => (
                    <p key={index}>{index + 1}、{item}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">[不同点]</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                  {result.detail.differences.map((item, index) => (
                    <p key={index}>{index + 1}、{item}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result.detail.type === "duplicate" && (
            <div className="mt-5 space-y-4">
              {duplicatePageData.items.map((hit, itemIndex) => (
                <DuplicateHitCard
                  key={hit.id}
                  hit={hit}
                  index={(page - 1) * PAGE_SIZE + itemIndex + 1}
                />
              ))}
            </div>
          )}

          {result.detail.type === "diff" && (
            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-semibold text-primary">[不同点]</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                {result.detail.differences.map((item, index) => (
                  <p key={index}>{index + 1}、{item}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {result.detail.type === "duplicate" && duplicatePageData.total > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground">
            <span>共 {duplicatePageData.total} 条</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
              >
                &lt;
              </button>
              {Array.from({ length: Math.ceil(duplicatePageData.total / PAGE_SIZE) }, (_, i) => i + 1)
                .slice(0, 7)
                .map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={cn(
                      "min-w-8 rounded border px-2 py-1",
                      page === num ? "border-primary text-primary" : "border-border",
                    )}
                  >
                    {num}
                  </button>
                ))}
              <button
                type="button"
                disabled={page >= Math.ceil(duplicatePageData.total / PAGE_SIZE)}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button type="button" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
