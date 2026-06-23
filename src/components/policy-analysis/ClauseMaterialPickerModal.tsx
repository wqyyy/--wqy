import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CLAUSE_MATERIAL_ITEMS,
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
};

export function ClauseMaterialPickerModal({
  open,
  onClose,
  onConfirm,
  existingContents,
}: ClauseMaterialPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState("");
  const [region, setRegion] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setKeyword("");
      setSource("");
      setRegion("");
      setSelectedKeys(new Set());
    }
  }, [open]);

  const sourceOptions = useMemo(
    () => [...new Set(CLAUSE_MATERIAL_ITEMS.map((item) => item.source))],
    [],
  );
  const regionOptions = useMemo(
    () => [...new Set(CLAUSE_MATERIAL_ITEMS.map((item) => item.region))],
    [],
  );

  const filteredItems = useMemo(() => {
    const q = keyword.trim();
    return CLAUSE_MATERIAL_ITEMS.map((item, index) => ({ item, index })).filter(({ item }) => {
      const matchKeyword =
        !q ||
        item.content.includes(q) ||
        item.department.includes(q) ||
        item.tags.some((tag) => tag.includes(q));
      const matchSource = !source || item.source === source;
      const matchRegion = !region || item.region === region;
      return matchKeyword && matchSource && matchRegion;
    });
  }, [keyword, source, region]);

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
    setSource("");
    setRegion("");
  };

  const handleConfirm = () => {
    const selected = CLAUSE_MATERIAL_ITEMS.map((item, index) => ({ item, index }))
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
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">从条款素材库添加</h2>
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_auto_auto]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">条款搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="请输入"
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">来源</label>
              <div className="relative">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">请选择</option>
                  {sourceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">地域省市</label>
              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-8 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">请选择地域省市</option>
                  {regionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">发文时间</label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground">
                <span className="flex-1 truncate">开始日期</span>
                <span className="px-2">~</span>
                <span className="flex-1 truncate">结束日期</span>
                <CalendarDays className="ml-1 h-4 w-4 shrink-0" />
              </div>
            </div>

            <Button type="button" variant="outline" className="mt-auto h-10 px-5" onClick={handleReset}>
              重置
            </Button>
            <Button type="button" className="mt-auto h-10 px-5">
              查询
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-border pb-3 text-sm">
            <span className="text-foreground">
              已选 <span className="font-semibold text-primary">{selectedKeys.size}</span> 项
            </span>
            <span className="text-muted-foreground">按发文时间排序</span>
            <span className="text-muted-foreground">按添加时间排序</span>
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
                        checked={checked}
                        disabled={alreadyAdded}
                        onCheckedChange={() => toggleItem(key)}
                        className="mt-1 border-primary data-[state=checked]:bg-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-7 text-foreground">{item.content}</p>
                        {item.tags.length > 0 && (
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
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>来源：{item.source}</span>
                          <span>{item.region}</span>
                          <span>{item.department}</span>
                          <span>发文时间：{item.publishDate}</span>
                          <span>添加时间：{item.createdDate}</span>
                        </div>
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
