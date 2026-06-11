import { useMemo, useState } from "react";
import { Copy, FolderOpen, Search } from "lucide-react";
import {
  CLAUSE_MATERIAL_ITEMS,
  CLAUSE_MATERIAL_TAG_OPTIONS,
  type ClauseMaterialItem,
} from "@/lib/clauseMaterialLibrary";

type ClauseMaterialPanelProps = {
  onInsert?: (content: string) => void;
};

export function ClauseMaterialPanel({ onInsert }: ClauseMaterialPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredClauses = useMemo(() => {
    const q = keyword.trim();
    return CLAUSE_MATERIAL_ITEMS.filter((item) => {
      const matchKeyword = !q || item.content.includes(q);
      const matchTag = !activeTag || item.tags.includes(activeTag);
      return matchKeyword && matchTag;
    });
  }, [keyword, activeTag]);

  const handleCopy = (item: ClauseMaterialItem, key: string) => {
    navigator.clipboard.writeText(item.content).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">素材库</h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">条款素材，可搜索、筛选并插入政策正文</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">条款搜索</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入关键词"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground">标签</span>
          {CLAUSE_MATERIAL_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
              className={`inline-flex h-7 items-center rounded-lg border px-2 text-[11px] font-medium transition-colors ${
                activeTag === tag
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          共 <span className="font-semibold text-primary">{filteredClauses.length}</span> 条
        </p>

        {filteredClauses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
            暂无匹配的条款素材
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClauses.map((item, index) => {
              const key = `${item.content.slice(0, 24)}-${index}`;
              return (
                <div key={key} className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-medium leading-relaxed text-foreground">{item.content}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    <p>来源：{item.source}</p>
                    <p>
                      {item.region} · {item.department}
                    </p>
                    <p>
                      发文 {item.publishDate} · 添加 {item.createdDate}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item, key)}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] text-foreground hover:bg-muted/50"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedKey === key ? "已复制" : "复制"}
                    </button>
                    {onInsert && (
                      <button
                        type="button"
                        onClick={() => onInsert(item.content)}
                        className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        插入正文
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
