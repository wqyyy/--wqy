import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getClauseMaterialItems,
  CLAUSE_MATERIAL_LIBRARIES,
  matchesClauseMaterial,
  type ClauseMaterialFilters,
  type ClauseMaterialScope,
  type ClauseMaterialItem,
} from "@/lib/clauseMaterialLibrary";

function getClauseMaterialKey(item: ClauseMaterialItem, index: number) {
  return `${item.publishDate}-${item.content.slice(0, 32)}-${index}`;
}

type ClauseMaterialPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: ClauseMaterialItem[]) => void;
  existingContents: string[];
  scope?: ClauseMaterialScope;
};

export function ClauseMaterialPickerModal({
  open,
  onClose,
  onConfirm,
  existingContents,
  scope = "personal",
}: ClauseMaterialPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filters, setFilters] = useState<ClauseMaterialFilters>({ content: "", department: "", startDate: "", endDate: "" });
  const invalidDates = Boolean(startDate && endDate && startDate > endDate);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const items = getClauseMaterialItems(scope);
  const library = CLAUSE_MATERIAL_LIBRARIES[scope];

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setStartDate(""); setEndDate("");
      setFilters({ content: "", department: "", startDate: "", endDate: "" });
      setSelectedKeys(new Set());
    }
  }, [open, scope]);

  const filteredItems = useMemo(() => {
    const q = keyword.trim();
    return items.map((item, index) => ({ item, index })).filter(({ item }) => {
      if (scope === "public") return matchesClauseMaterial(item, filters);
      const matchKeyword =
        !q ||
        item.content.includes(q) ||
        item.department.includes(q) ||
        item.policyTitle?.includes(q) ||
        item.tags.some((tag) => tag.includes(q));
      return matchKeyword && matchesClauseMaterial(item, { content: "", department: "", startDate, endDate });
    });
  }, [keyword, items, scope, filters, startDate, endDate]);

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleReset = () => {
    setKeyword("");
    setStartDate(""); setEndDate("");
    setFilters({ content: "", department: "", startDate: "", endDate: "" });
  };

  const handleConfirm = () => {
    const selected = items.map((item, index) => ({ item, index }))
      .filter(({ item, index }) => selectedKeys.has(getClauseMaterialKey(item, index)))
      .map(({ item }) => item);
    onConfirm(selected);
  };

  if (!open) return null;

  const existingSet = new Set(existingContents);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="关闭弹窗"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="clause-picker-title" aria-describedby="clause-picker-description" className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="clause-picker-title" className="text-base font-semibold text-foreground">{library.title}</h2>
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
          <p id="clause-picker-description" className="mb-5 text-sm leading-7 text-muted-foreground">{library.description}</p>
          <form onSubmit={event => { event.preventDefault(); if (!invalidDates) setFilters({ content: keyword, department: "", startDate, endDate }); }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.5fr_auto_auto]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{scope === "public" ? "条款内容" : "条款搜索"}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  aria-label="条款内容搜索"
                  placeholder="请输入条款内容"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">发文时间</label>
              <div className="flex min-w-0 items-center gap-1">
                <input type="date" aria-label="发文开始日期" value={startDate} max={endDate || undefined} onChange={event => setStartDate(event.target.value)} className="h-10 min-w-0 w-1/2 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary" />
                <span className="text-muted-foreground">~</span>
                <input type="date" aria-label="发文结束日期" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} className="h-10 min-w-0 w-1/2 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary" />
              </div>
            </div>

            <Button type="button" variant="outline" className="mt-auto h-10 px-5" onClick={handleReset}>
              重置
            </Button>
            <Button type="submit" disabled={invalidDates} className="mt-auto h-10 px-5">
              查询
            </Button>
          </form>
          {invalidDates && <p role="alert" className="mt-2 text-xs text-destructive">开始日期不能晚于结束日期。</p>}

          <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-border pb-3 text-sm">
            <span className="text-foreground">
              已选 <span className="font-semibold text-primary">{selectedKeys.size}</span> 项
            </span>
            {scope !== "public" && <span className="text-muted-foreground">按发文时间排序</span>}
            {scope !== "public" && <span className="text-muted-foreground">按添加时间排序</span>}
          </div>

          <div className="mt-4 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                暂无匹配的条款素材
              </div>
            ) : (
              filteredItems.map(({ item, index }) => {
                const key = getClauseMaterialKey(item, index);
                const alreadyAdded = existingSet.has(item.content);
                const checked = selectedKeys.has(key);
                return (
                  <div
                    key={key}
                    className={`rounded-xl border bg-background p-4 transition-colors ${
                      checked ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        aria-label={`选择条款${index + 1}`}
                        checked={checked}
                        disabled={alreadyAdded}
                        onCheckedChange={() => toggleItem(key)}
                        className="mt-1 border-primary data-[state=checked]:bg-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-2 text-sm font-semibold leading-7 text-foreground">{item.policyTitle || "未提供"}</h3>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{item.content}</p>
                        {scope !== "public" && item.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {scope === "public" ? <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>发文单位：{item.department || "未提供"}</span>
                          <span>发文时间：{item.publishDate || "未提供"}</span>
                        </div> : <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>来源：{item.source}</span>
                          <span>{item.region}</span>
                          <span>发文单位：{item.department}</span>
                          <span>发文时间：{item.publishDate || "未提供"}</span>
                          {item.createdDate && <span>添加时间：{item.createdDate}</span>}
                        </div>}
                        {alreadyAdded && (
                          <p className="mt-2 text-xs text-primary">该条款已添加至分析列表</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={selectedKeys.size === 0}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
}
