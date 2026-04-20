import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, Loader2, ChevronDown, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { searchPolicies } from "@/lib/policyDraftApi";

export interface PolicyItem {
  id: string;
  title: string;
  url: string;
  selected: boolean;
  level: "national" | "beijing" | "other";
  source?: string;
}

interface PolicySearchStepProps {
  policyTitle: string;
  coreElements: string;
  onPoliciesSelected: (policies: PolicyItem[]) => void;
  policies: PolicyItem[];
}


const levelLabels: Record<string, string> = {
  national: "国家级政策",
  beijing: "北京市政策",
  other: "其他省市政策",
};

export function PolicySearchStep({ policyTitle, coreElements, onPoliciesSelected, policies: externalPolicies }: PolicySearchStepProps) {
  const [searchQuery, setSearchQuery] = useState(policyTitle);
  const [isSearching, setIsSearching] = useState(externalPolicies.length === 0);
  const [isSearchingMore, setIsSearchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<PolicyItem[]>(externalPolicies.length > 0 ? externalPolicies : []);
  const [collapsedLevels, setCollapsedLevels] = useState<Record<string, boolean>>({});
  const [searchHint, setSearchHint] = useState<string | null>(null);
  /** 优先参考我的素材库，默认开启；切换后重新拉取检索结果 */
  const [prioritizeMyLibrary, setPrioritizeMyLibrary] = useState(true);
  /** 已从父级同步过政策列表时不再用首次空请求覆盖（返回上一步等场景） */
  const externalAppliedRef = useRef(false);

  useEffect(() => {
    if (externalPolicies.length > 0 && !externalAppliedRef.current) {
      externalAppliedRef.current = true;
      setPolicies(externalPolicies);
      onPoliciesSelected(externalPolicies);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    searchPolicies(policyTitle, coreElements, { prioritizeMyLibrary })
      .then(({ policies: result }) => {
        setPolicies(result);
        onPoliciesSelected(result);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsSearching(false));
  }, [policyTitle, coreElements, prioritizeMyLibrary]);

  useEffect(() => {
    setSearchQuery(policyTitle);
  }, [policyTitle]);

  const togglePolicy = (id: string) => {
    const updated = policies.map(p => p.id === id ? { ...p, selected: !p.selected } : p);
    setPolicies(updated);
    onPoliciesSelected(updated);
  };

  const toggleLevel = (level: string) => {
    setCollapsedLevels(prev => ({ ...prev, [level]: !prev[level] }));
  };

  const toggleAllInLevel = (level: string) => {
    const levelPolicies = policies.filter(p => p.level === level);
    const allSelected = levelPolicies.every(p => p.selected);
    const updated = policies.map(p => p.level === level ? { ...p, selected: !allSelected } : p);
    setPolicies(updated);
    onPoliciesSelected(updated);
  };

  const removeSelectedPolicy = (id: string) => {
    const updated = policies.map((p) => (p.id === id ? { ...p, selected: false } : p));
    setPolicies(updated);
    onPoliciesSelected(updated);
  };

  const mergePolicies = (current: PolicyItem[], incoming: PolicyItem[]) => {
    const existingIds = new Set(current.map((item) => item.id));
    const deduped = incoming.filter((item) => !existingIds.has(item.id));
    return [...current, ...deduped];
  };

  const handleSearchMore = async () => {
    const keyword = searchQuery.trim();
    if (!keyword) return;
    setSearchHint(null);
    setIsSearchingMore(true);
    try {
      const { policies: more } = await searchPolicies(policyTitle, coreElements, {
        prioritizeMyLibrary,
        query: keyword,
        appendMode: true,
      });
      const appended = more.map((item) => ({
        ...item,
        id: `extra-${item.level}-${Date.now()}-${item.id}`,
      }));
      const merged = mergePolicies(policies, appended);
      const addedCount = merged.length - policies.length;
      setPolicies(merged);
      onPoliciesSelected(merged);
      setSearchHint(addedCount > 0 ? `已新增 ${addedCount} 条与“${keyword}”相关政策，请勾选后加入参考。` : `未找到新的“${keyword}”相关政策。`);
    } catch (err) {
      setSearchHint(err instanceof Error ? `检索失败：${err.message}` : "检索失败，请重试");
    } finally {
      setIsSearchingMore(false);
    }
  };

  const filteredPolicies = policies;

  const levels: Array<"national" | "beijing" | "other"> = ["national", "beijing", "other"];

  const selectedCount = policies.filter(p => p.selected).length;
  const selectedPolicies = policies.filter((p) => p.selected);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">智能政策检索</h3>
        <p className="text-xs text-muted-foreground">
          根据「{policyTitle}」自动检索相关政策，默认全部选中作为参考文档
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="输入关键词检索更多政策（如：营商环境）"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearchMore();
            }
          }}
          className="pl-9 h-9 text-sm"
        />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 px-3 text-xs"
          onClick={() => void handleSearchMore()}
          disabled={!searchQuery.trim() || isSearchingMore}
        >
          {isSearchingMore ? "检索中..." : "检索更多"}
        </Button>
      </div>
      {searchHint && <p className="text-xs text-muted-foreground -mt-3">{searchHint}</p>}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Switch
            id="policy-search-my-library"
            checked={prioritizeMyLibrary}
            onCheckedChange={setPrioritizeMyLibrary}
          />
          <Label htmlFor="policy-search-my-library" className="cursor-pointer text-sm font-medium text-foreground">
            优先参考我的素材库
          </Label>
        </div>
        {!prioritizeMyLibrary && (
          <span className="text-xs text-muted-foreground">
            已关闭：按全库检索，不优先展示我的素材库
          </span>
        )}
      </div>

      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">正在根据政策标题智能检索相关政策...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
          <p className="text-sm">检索失败：{error}</p>
          <button
            className="text-xs underline text-muted-foreground hover:text-foreground"
            onClick={() => {
              setError(null);
              setIsSearching(true);
              searchPolicies(policyTitle, coreElements, { prioritizeMyLibrary })
                .then(({ policies: result }) => { setPolicies(result); onPoliciesSelected(result); })
                .catch((err: Error) => setError(err.message))
                .finally(() => setIsSearching(false));
            }}
          >
            重试
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              共检索到 <span className="text-foreground font-medium">{policies.length}</span> 条相关政策，
              已选 <span className="text-primary font-medium">{selectedCount}</span> 条作为参考
            </p>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="space-y-4">
          {levels.map(level => {
            const levelPolicies = filteredPolicies.filter(p => p.level === level);
            if (levelPolicies.length === 0) return null;
            const allSelected = levelPolicies.every(p => p.selected);
            const someSelected = levelPolicies.some(p => p.selected);
            const isCollapsed = collapsedLevels[level];

            return (
              <div key={level} className="border border-border rounded-lg overflow-hidden">
                {/* Level header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleLevel(level)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{levelLabels[level]}</span>
                    <span className="text-xs text-muted-foreground">（{levelPolicies.length}）</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={allSelected}
                      // @ts-ignore
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={() => toggleAllInLevel(level)}
                    />
                    <span className="text-xs text-muted-foreground">全选</span>
                  </div>
                </div>

                {/* Policy list */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-border">
                        {levelPolicies.map((policy, i) => (
                          <div
                            key={policy.id}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20 ${
                              policy.selected ? "bg-primary/[0.02]" : ""
                            }`}
                          >
                            <Checkbox
                              checked={policy.selected}
                              onCheckedChange={() => togglePolicy(policy.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <a
                                href={policy.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline truncate block"
                                onClick={e => e.stopPropagation()}
                              >
                                {policy.title}
                              </a>
                            </div>
                            {policy.source && (
                              <span className="text-xs text-muted-foreground shrink-0">{policy.source}</span>
                            )}
                            <a
                              href={policy.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
            </div>

          <aside className="h-fit self-start rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h4 className="text-sm font-semibold text-foreground">
                已加入参考（{selectedPolicies.length}）
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                可删除不需要的参考政策
              </p>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {selectedPolicies.length === 0 ? (
                <p className="px-4 py-6 text-xs text-muted-foreground">
                  暂无已选政策，请在左侧勾选加入参考。
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {selectedPolicies.map((policy) => (
                    <div key={policy.id} className="flex items-start gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{policy.title}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => removeSelectedPolicy(policy.id)}
                        title="移除参考"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
          </div>
        </div>
      )}
    </div>
  );
}
