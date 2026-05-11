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

type TabKey = "policy" | "clause" | "favorites";

const policyReserveItems = [
  {
    title: "北京经济技术开发区管理委员会印发《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》的通知",
    detailUrl: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202510/t20251029_4243376.html",
    source: "人工添加",
    region: "北京市",
    department: "北京经济技术开发区管理委员会",
    code: "京技管〔2025〕8号",
    date: "2026-03-10",
  },
  {
    title: "北京经济技术开发区管理委员会印发《关于加快推动脑机接口技术和产业创新发展的若干措施》的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202602/t20260209_4503840.html",
    source: "人工添加",
    region: "朝阳区",
    department: "修改北京经济技术开发区管理委员会",
    code: "京技管〔2025〕8号",
    date: "2026-03-06",
  },
  {
    title: "北京经济技术开发区经济发展局关于开展2025年生产性服务业十二条政策相关事项（第二批）申报的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202508/t20250808_4169681.html",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区经济发展局",
    code: "",
    date: "2025-08-08",
  },
  {
    title: "北京经济技术开发区信息技术产业局关于开展人工智能“模型券”专项奖励申报的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202508/t20250808_4169672.html",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区信息技术产业局",
    code: "",
    date: "2025-08-08",
  },
];

const clauseReserveItems = [
  {
    content:
      "第六条 推动机器人高水平制造，提升规模化生产能力。率先布局人形机器人中试产线，提升规模化生产能力，探索“机器人生产机器人”柔性制造模式，对于产线建设，按照项目总投资一定比例给予支持。自主生产销售的人形机器人，按照实际销售额的10%给予补助，最多支持1000台，每年每家最高支持1000万元。",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区管理委员会",
    publishDate: "2025-08-12",
    createdDate: "2026-02-11",
    tags: ["具身智能"],
  },
  {
    content:
      "第四条 支持机器人产品推广应用，深化全域场景创新赋能。支持机器人应用场景拓展，鼓励制造企业、产业园区、医院学校、商业场所等开放应用场景，经评审，对示范作用显著的机器人场景，按照采购投入，分别给予场景方、机器人企业30%、20%的补贴，单个项目共计支持不超过500万元。",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区管理委员会",
    publishDate: "2025-08-12",
    createdDate: "2026-02-11",
    tags: ["具身智能"],
  },
];

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
    () => policyReserveItems.filter((item) => item.title.includes(keyword.trim())),
    [keyword],
  );

  const filteredClauses = useMemo(
    () => clauseReserveItems.filter((item) => item.content.includes(keyword.trim())),
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
          description="用于沉淀本地政策、条款素材和收藏政策，为起草与评估提供基础资源。"
        />

        <div className="flex items-center gap-3 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("policy")}
            className={`relative px-1 pb-3 text-lg font-semibold transition-colors ${
              activeTab === "policy" ? "text-primary" : "text-foreground/75"
            }`}
          >
            本地政策
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
