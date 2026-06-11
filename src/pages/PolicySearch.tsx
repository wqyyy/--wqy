import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  loadFavoritePolicies,
  removeFavoritePolicy,
  upsertFavoritePolicy,
} from "@/lib/policyFavorites";

type SearchTarget = "title" | "content";
type SortMode = "time";
type RegionFilter = "all" | "national" | "beijing" | "yizhuang" | "other";
type YearFilter = "all" | "2020" | "2021" | "2022" | "2023" | "2024" | "2025" | "2026";

type PolicyResult = {
  id: string;
  title: string;
  department: string;
  docNo: string;
  publishDate: string;
  collected: boolean;
  highlighted?: boolean;
  content?: string;
};

const hotKeywords = ["专精特新", "高精尖", "人才十条", "人才引进", "人工智能", "绿色低碳"];
const publishYears: YearFilter[] = ["all", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const OTHER_REGION_OPTIONS: Record<string, string[]> = {
  上海市: ["上海市"],
  广东省: ["广州市", "深圳市", "珠海市"],
  江苏省: ["南京市", "苏州市", "无锡市"],
  浙江省: ["杭州市", "宁波市", "温州市"],
  四川省: ["成都市", "绵阳市"],
};

const basePolicies: PolicyResult[] = [
  {
    id: "1",
    title: "北京经济技术开发区经济发展局关于开展2025年生产性服务业十二条政策相关事项（第二批）申报的通知",
    department: "北京经济技术开发区经济发展局",
    docNo: "-",
    publishDate: "2025-08-08",
    collected: true,
    highlighted: true,
    content: "围绕生产性服务业、高精尖项目、企业奖励和事项申报安排开展支持。",
  },
  {
    id: "2",
    title: "北京经济技术开发区信息技术产业局关于开展人工智能“模型券”专项奖励申报的通知",
    department: "北京经济技术开发区信息技术产业局",
    docNo: "-",
    publishDate: "2025-08-08",
    collected: true,
    content: "支持人工智能模型训练、算力使用、模型券奖励和重点项目申报。",
  },
  {
    id: "3",
    title: "北京经济技术开发区经济发展局关于开展《北京经济技术开发区促进绿色低碳高质量发展若干措施》节能降碳类事项申报的通知",
    department: "北京经济技术开发区经济发展局",
    docNo: "-",
    publishDate: "2025-08-06",
    collected: true,
    content: "聚焦绿色低碳、节能降碳、企业改造和高质量发展支持。",
  },
  {
    id: "4",
    title: "北京市经济和信息化局 北京市发展和改革委员会 北京市通信管理局关于印发《北京市存量数据中心优化工作方案（2024-2027年）》的通知",
    department: "北京市经济和信息化局；北京市发展和改革委员会；北京市通信管理局",
    docNo: "京经信发〔2024〕62号",
    publishDate: "2024-11-15",
    collected: true,
    content: "涉及数据中心优化、数字基础设施、产业转型和绿色发展。",
  },
];

const themePolicyConfigs = [
  {
    keyword: "专精特新",
    department: "北京市经济和信息化局",
    prefix: "关于支持专精特新企业高质量发展的若干措施",
    content: "围绕专精特新企业培育、融资支持、技术改造和梯度成长提供政策支持。",
    count: 12,
  },
  {
    keyword: "高精尖",
    department: "北京经济技术开发区经济发展局",
    prefix: "关于推动高精尖产业高质量发展的实施方案",
    content: "聚焦高精尖产业项目引进、企业培育、创新平台建设和专项奖励。",
    count: 12,
  },
  {
    keyword: "人才十条",
    department: "北京市人力资源和社会保障局",
    prefix: "关于深化人才十条政策落地实施的若干措施",
    content: "围绕人才十条、人才服务、住房保障、落户支持和创新激励形成政策体系。",
    count: 10,
  },
  {
    keyword: "人才引进",
    department: "北京经济技术开发区工委组织人事部",
    prefix: "关于加强人才引进和培育支持的实施细则",
    content: "重点支持高层次人才引进、青年人才培育、人才安居和科研经费保障。",
    count: 16,
  },
  {
    keyword: "人工智能",
    department: "北京市科学技术委员会",
    prefix: "关于促进人工智能产业创新发展的若干政策",
    content: "支持人工智能企业发展、模型研发、场景开放、算力券和应用示范。",
    count: 14,
  },
  {
    keyword: "绿色低碳",
    department: "北京市生态环境局",
    prefix: "关于推动绿色低碳高质量发展的若干措施",
    content: "围绕绿色低碳、节能改造、绿色工厂、循环经济和减排示范开展支持。",
    count: 12,
  },
];

const generatedPolicies: PolicyResult[] = themePolicyConfigs.flatMap((config, themeIndex) =>
  Array.from({ length: config.count }, (_, index) => {
    const month = String(((index + themeIndex) % 9) + 1).padStart(2, "0");
    const day = String(((index * 2 + themeIndex) % 27) + 1).padStart(2, "0");
    return {
      id: `theme-${themeIndex + 1}-${index + 1}`,
      title: `${config.prefix}（第${index + 1}批）`,
      department: config.department,
      docNo: `京政发〔2025〕${themeIndex + 1}${String(index + 1).padStart(2, "0")}号`,
      publishDate: `2025-${month}-${day}`,
      collected: index % 3 !== 0,
      highlighted: index < 2,
      content: `${config.content} 主题关键词：${config.keyword}。`,
    };
  }),
);

const policies: PolicyResult[] = [...basePolicies, ...generatedPolicies];

const inferRegion = (item: PolicyResult) => {
  const text = `${item.title} ${item.department}`;
  if (text.includes("北京经济技术开发区") || text.includes("经开区")) return "yizhuang";
  if (text.includes("北京市") || text.includes("北京")) return "beijing";
  if (text.includes("国务院") || text.includes("全国") || text.includes("国家")) return "national";
  return "other";
};

const inferProvinceAndCity = (item: PolicyResult) => {
  const text = `${item.title} ${item.department}`;
  if (text.includes("上海")) return { province: "上海市", city: "上海市" };
  if (text.includes("广东") || text.includes("广州") || text.includes("深圳")) {
    return { province: "广东省", city: text.includes("深圳") ? "深圳市" : "广州市" };
  }
  if (text.includes("江苏") || text.includes("南京") || text.includes("苏州")) {
    return { province: "江苏省", city: text.includes("苏州") ? "苏州市" : "南京市" };
  }
  if (text.includes("浙江") || text.includes("杭州") || text.includes("宁波")) {
    return { province: "浙江省", city: text.includes("宁波") ? "宁波市" : "杭州市" };
  }
  if (text.includes("四川") || text.includes("成都")) return { province: "四川省", city: "成都市" };
  return { province: "广东省", city: "广州市" };
};

export default function PolicySearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>((searchParams.get("target") as SearchTarget) || "title");
  const [sortMode] = useState<SortMode>("time");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [otherProvince, setOtherProvince] = useState<string>("广东省");
  const [otherCity, setOtherCity] = useState<string>(OTHER_REGION_OPTIONS["广东省"][0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    loadFavoritePolicies().map((item) => item.id),
  );

  useEffect(() => {
    setKeyword(searchParams.get("q") ?? "");
    setSearchTarget((searchParams.get("target") as SearchTarget) || "title");
  }, [searchParams]);

  const pageResults = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    const filtered = policies.filter((item) => {
      if (!normalized) return true;
      const titleText = `${item.title} ${item.department}`.toLowerCase();
      const contentText = `${item.content ?? ""}`.toLowerCase();
      return searchTarget === "content"
        ? `${titleText} ${contentText}`.includes(normalized)
        : titleText.includes(normalized);
    });

    const regionFiltered = filtered.filter((item) => {
      const region = inferRegion(item);
      if (regionFilter === "all") return true;
      if (regionFilter === "other") {
        if (region !== "other") return false;
        const location = inferProvinceAndCity(item);
        return location.province === otherProvince && location.city === otherCity;
      }
      return region === regionFilter;
    });

    const yearFiltered = regionFiltered.filter((item) => {
      if (yearFilter === "all") return true;
      return item.publishDate.startsWith(yearFilter);
    });

    const themeFiltered = yearFiltered.filter((item) => {
      if (themeFilter === "all") return true;
      const text = `${item.title} ${item.content ?? ""} ${item.department}`;
      return text.includes(themeFilter);
    });

    if (sortMode === "time") {
      return [...themeFiltered].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
    }

    return [...themeFiltered];
  }, [keyword, sortMode, searchTarget, regionFilter, otherProvince, otherCity, yearFilter, themeFilter]);

  const allSelected = pageResults.length > 0 && selectedIds.length > 0 && selectedIds.length === pageResults.length;

  const toggleCollected = (item: PolicyResult) => {
    const isCollected = favoriteIds.includes(item.id);
    if (isCollected) {
      removeFavoritePolicy(item.id);
      setFavoriteIds((prev) => prev.filter((id) => id !== item.id));
      return;
    }
    upsertFavoritePolicy({
      id: item.id,
      title: item.title,
      department: item.department,
      docNo: item.docNo,
      publishDate: item.publishDate,
      content: item.content,
    });
    setFavoriteIds((prev) => Array.from(new Set([...prev, item.id])));
  };

  const handleBatchCollect = () => {
    const selectedItems = pageResults.filter((item) => selectedIds.includes(item.id));
    selectedItems.forEach((item) =>
      upsertFavoritePolicy({
        id: item.id,
        title: item.title,
        department: item.department,
        docNo: item.docNo,
        publishDate: item.publishDate,
        content: item.content,
      }),
    );
    setFavoriteIds((prev) => Array.from(new Set([...prev, ...selectedItems.map((item) => item.id)])));
  };

  const handleBatchUncollect = () => {
    selectedIds.forEach((id) => removeFavoritePolicy(id));
    setFavoriteIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? pageResults.map((item) => item.id) : []);
  };

  const toggleSelectItem = (policyId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, policyId]));
      }
      return current.filter((id) => id !== policyId);
    });
  };

  const runSearch = () => {
    const next = new URLSearchParams(searchParams);
    if (keyword.trim()) {
      next.set("q", keyword.trim());
    } else {
      next.delete("q");
    }
    next.set("target", searchTarget);
    setSearchParams(next);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/policy-writing")}
            className="inline-flex items-center gap-1 transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            返回政策制定
          </button>
          <span>/</span>
          <span className="text-foreground">政策检索</span>
        </div>

        <Card className="rounded-[28px] border-none bg-white px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="您好！请输入想要检索的政策标题或政策内容～"
                  className="h-14 rounded-2xl border-[#d9dce3] bg-white pl-5 pr-14 text-base shadow-none placeholder:text-[#b0b4be] focus-visible:ring-primary"
                />
                <Search className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7280]" />
              </div>
                <Button className="h-14 rounded-2xl bg-primary px-8 text-lg font-semibold hover:bg-primary/90">
                  高级搜索
                </Button>
            </div>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                <div className="flex flex-col gap-3 text-[15px]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-primary">发布时间：</span>
                    {publishYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setYearFilter(year)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          yearFilter === year
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[#d8dbe2] text-foreground hover:border-primary/40",
                        )}
                      >
                        {year === "all" ? "全部" : year}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-primary">政策主题：</span>
                    {["all", ...hotKeywords].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setThemeFilter(item);
                          if (item !== "all") setKeyword(item);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          themeFilter === item
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[#d8dbe2] text-foreground hover:border-primary/40",
                        )}
                      >
                        {item === "all" ? "全部" : item}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-primary">地区筛选：</span>
                    {[
                      { key: "all", label: "全部" },
                      { key: "national", label: "国家" },
                      { key: "beijing", label: "北京" },
                      { key: "yizhuang", label: "经开区" },
                      { key: "other", label: "其他地区" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setRegionFilter(option.key as RegionFilter)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          regionFilter === option.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-[#d8dbe2] text-foreground hover:border-primary/40",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                    {regionFilter === "other" && (
                      <div className="flex items-center gap-2">
                        <select
                          value={otherProvince}
                          onChange={(e) => {
                            const nextProvince = e.target.value;
                            setOtherProvince(nextProvince);
                            setOtherCity(OTHER_REGION_OPTIONS[nextProvince][0]);
                          }}
                          className="h-9 rounded-lg border border-[#d8dbe2] bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {Object.keys(OTHER_REGION_OPTIONS).map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                        <select
                          value={otherCity}
                          onChange={(e) => setOtherCity(e.target.value)}
                          className="h-9 rounded-lg border border-[#d8dbe2] bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          {OTHER_REGION_OPTIONS[otherProvince].map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-5 text-[15px]">
                    <span className="font-semibold text-primary">搜索位置：</span>
                    <button
                      type="button"
                      onClick={() => setSearchTarget("title")}
                      className="inline-flex items-center gap-2 text-foreground"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          searchTarget === "title" ? "border-primary" : "border-[#d1d5db]",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            searchTarget === "title" ? "bg-primary" : "bg-transparent",
                          )}
                        />
                      </span>
                      标题
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchTarget("content")}
                      className="inline-flex items-center gap-2 text-foreground"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          searchTarget === "content" ? "border-primary" : "border-[#d1d5db]",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            searchTarget === "content" ? "bg-primary" : "bg-transparent",
                          )}
                        />
                      </span>
                      全文
                    </button>
                  </div>
                </div>
              </div>

              <div />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#eef0f3] px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-6 text-[15px]">
                <div className="flex items-center gap-3">
                    <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))} />
                    <span className="text-[18px] font-semibold text-foreground">
                    相关结果<span className="mx-1 text-primary">{pageResults.length}</span>条
                  </span>
                </div>

                <button
                  type="button"
                  className={cn(
                    "text-[16px] font-medium transition-colors",
                    "text-foreground",
                  )}
                >
                  按时间排序
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="h-12 rounded-xl bg-primary px-7 text-base font-semibold hover:bg-primary/90"
                  onClick={handleBatchCollect}
                >
                  批量收藏
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-[#d8dbe2] px-7 text-base"
                  onClick={handleBatchUncollect}
                >
                  批量取消收藏
                </Button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#eef0f3]">
            {pageResults.map((item) => {
              const selected = selectedIds.includes(item.id);
              const isCollected = favoriteIds.includes(item.id);
              return (
                <div key={item.id} className="flex gap-4 px-6 py-8">
                  <div className="pt-1">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => toggleSelectItem(item.id, Boolean(checked))}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-start gap-3">
                      <h3
                        className={cn(
                          "text-[18px] font-semibold leading-8",
                          item.highlighted ? "text-primary" : "text-foreground",
                        )}
                      >
                        {item.title}
                      </h3>
                      {item.highlighted && (
                        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                          热门匹配
                        </Badge>
                      )}
                    </div>

                    <p className="text-[15px] leading-7 text-[#8b90a0]">
                      发文单位： {item.department}
                      <span className="mx-3">发文字号： {item.docNo}</span>
                      <span>发文时间： {item.publishDate}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCollected(item)}
                    className="flex min-w-[110px] items-center justify-end gap-2 pt-1 text-[#5f6675]"
                  >
                    <span className="text-[15px]">{isCollected ? "已收藏" : "收藏"}</span>
                    <Star className={cn("h-5 w-5", isCollected ? "fill-[#f5b800] text-[#f5b800]" : "text-[#c4c8d2]")} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eef0f3] px-6 py-5 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex items-center justify-end gap-2 text-[15px] text-foreground">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-[#d8dbe2] hover:bg-accent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary text-lg font-semibold text-primary">
                1
              </button>
              {[2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-transparent text-lg font-medium transition-colors hover:border-[#d8dbe2] hover:bg-accent"
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-[#9ca3af]">...</span>
              <button
                type="button"
                className="flex h-12 min-w-[64px] items-center justify-center rounded-xl border border-transparent text-lg font-medium transition-colors hover:border-[#d8dbe2] hover:bg-accent"
              >
                100
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent transition-colors hover:border-[#d8dbe2] hover:bg-accent"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 text-[15px] text-foreground">
              <button
                type="button"
                className="inline-flex h-12 items-center gap-3 rounded-xl border border-[#d8dbe2] px-5"
              >
                10 条/页
                <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
              </button>
              <div className="flex items-center gap-2">
                <span>跳至</span>
                <Input className="h-12 w-20 rounded-xl border-[#d8dbe2] text-center" defaultValue="1" />
                <span>页</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
