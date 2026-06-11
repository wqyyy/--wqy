import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Filter, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/PageHero";
import {
  loadFavoritePolicies,
  policyFavoritesChangedEvent,
  type FavoritePolicyItem,
} from "@/lib/policyFavorites";
import { CLAUSE_MATERIAL_ITEMS } from "@/lib/clauseMaterialLibrary";
import { POLICY_MATERIAL_ITEMS } from "@/lib/policyMaterialLibrary";

type TabKey = "policy" | "clause" | "favorites";

export default function ReserveLibrary() {
  const [activeTab, setActiveTab] = useState<TabKey>("policy");
  const [keyword, setKeyword] = useState("");
  const [favoritePolicies, setFavoritePolicies] = useState<FavoritePolicyItem[]>([]);

  useEffect(() => {
    setFavoritePolicies(loadFavoritePolicies());
    const syncFavorites = () => setFavoritePolicies(loadFavoritePolicies());
    window.addEventListener(policyFavoritesChangedEvent, syncFavorites);
    window.addEventListener("focus", syncFavorites);
    return () => {
      window.removeEventListener(policyFavoritesChangedEvent, syncFavorites);
      window.removeEventListener("focus", syncFavorites);
    };
  }, []);

  const filteredPolicies = useMemo(
    () => POLICY_MATERIAL_ITEMS.filter((item) => item.title.includes(keyword.trim())),
    [keyword],
  );

  const filteredClauses = useMemo(
    () => CLAUSE_MATERIAL_ITEMS.filter((item) => item.content.includes(keyword.trim())),
    [keyword],
  );

  const filteredFavorites = useMemo(
    () =>
      favoritePolicies.filter(
        (item) =>
          item.title.includes(keyword.trim()) ||
          item.department.includes(keyword.trim()) ||
          (item.content ?? "").includes(keyword.trim()),
      ),
    [favoritePolicies, keyword],
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          title="我的素材库"
          description="用于沉淀政策素材、条款素材和收藏政策，为起草与评估提供基础资源。"
        />

        <div className="flex items-center gap-3 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("policy")}
            className={`relative px-1 pb-3 text-lg font-semibold transition-colors ${
              activeTab === "policy" ? "text-primary" : "text-foreground/75"
            }`}
          >
            政策素材
            {activeTab === "policy" && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clause")}
            className={`relative px-1 pb-3 text-lg font-semibold transition-colors ${
              activeTab === "clause" ? "text-primary" : "text-foreground/75"
            }`}
          >
            条款素材
            {activeTab === "clause" && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`relative px-1 pb-3 text-lg font-semibold transition-colors ${
              activeTab === "favorites" ? "text-primary" : "text-foreground/75"
            }`}
          >
            我的收藏
            {activeTab === "favorites" && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary" />}
          </button>
        </div>

        <Card className="rounded-[28px] border border-border bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          {activeTab === "policy" ? (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_auto_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">政策标题：</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="请输入"
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">省市地域：</label>
                  <button className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                    请选择
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <Button variant="outline" className="mt-auto h-12 rounded-xl px-7 text-base">
                  重置
                </Button>
                <Button className="mt-auto h-12 rounded-xl px-7 text-base">查询</Button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">按发文时间排序</p>
                <Button variant="outline" className="h-12 rounded-xl border-primary px-7 text-base text-primary">
                  添加政策
                </Button>
              </div>

              <div className="space-y-4">
                {filteredPolicies.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-background p-7">
                    <h3 className="text-[18px] font-semibold leading-8">
                      <a
                        href={item.detailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground transition-colors hover:text-primary hover:underline decoration-primary/40 underline-offset-4"
                      >
                        {item.title}
                      </a>
                    </h3>
                    <p className="mt-6 text-sm leading-7 text-muted-foreground">
                      来源：{item.source}　{item.region}　{item.department} {item.code ? `${item.code}　` : ""}发文时间：{item.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "clause" ? (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_0.9fr_1fr_auto_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">条款搜索：</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="请输入"
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">来源：</label>
                  <button className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                    请选择
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">地域省市：</label>
                  <button className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                    请选择
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">发文时间：</label>
                  <button className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                    开始日期　→　结束日期
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>

                <Button variant="outline" className="mt-auto h-12 rounded-xl px-7 text-base">
                  重置
                </Button>
                <Button className="mt-auto h-12 rounded-xl px-7 text-base">查询</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-foreground">标签：</span>
                <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  <Filter className="h-4 w-4" />
                  管理
                </button>
                <button className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground">
                  发文时间
                </button>
                <button className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-foreground">
                  具身智能
                </button>
                <button className="inline-flex h-10 items-center rounded-xl px-2 text-sm font-semibold text-primary">
                  展开
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                <div className="flex flex-wrap items-center gap-8 text-sm font-semibold text-foreground">
                  <p>已选<span className="text-primary">0</span>项</p>
                  <p>按发文时间排序</p>
                  <p>按添加时间排序</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" disabled className="h-12 rounded-xl px-6 text-base">
                    批量删除
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl border-primary px-7 text-base text-primary">
                    添加
                  </Button>
                  <Button variant="outline" disabled className="h-12 rounded-xl px-7 text-base">
                    加入分析
                  </Button>
                </div>
              </div>

              <div className="space-y-5">
                {filteredClauses.map((item, index) => (
                  <div key={`${item.content}-${index}`} className="rounded-2xl border border-border bg-background p-7">
                    <div className="flex items-start gap-4">
                      <input type="checkbox" className="mt-1 h-6 w-6 rounded-md border border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[18px] font-semibold leading-10 text-foreground">{item.content}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm leading-7 text-muted-foreground">
                          <span>来源：{item.source}</span>
                          <span>{item.region}</span>
                          <span>{item.department}</span>
                          <span>发文时间：{item.publishDate}</span>
                          <span>添加时间：{item.createdDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.5fr_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">收藏政策搜索：</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="请输入政策标题/发文单位"
                      className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button variant="outline" className="mt-auto h-12 rounded-xl px-7 text-base" onClick={() => setKeyword("")}>
                  重置
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">
                  我的收藏 <span className="text-primary">{filteredFavorites.length}</span> 条
                </p>
              </div>

              <div className="space-y-4">
                {filteredFavorites.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
                    暂无收藏政策，请先在政策检索页面添加收藏。
                  </div>
                ) : (
                  filteredFavorites.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border bg-background p-7">
                      <h3 className="text-[18px] font-semibold leading-8 text-foreground">{item.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-muted-foreground">
                        发文单位：{item.department}　发文字号：{item.docNo || "-"}　发文时间：{item.publishDate}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        收藏时间：{new Date(item.savedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
