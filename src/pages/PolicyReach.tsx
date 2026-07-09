import { useEffect, useMemo, useState, type ElementType } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle,
  ChevronsRight,
  ChevronRight,
  Clock,
  Factory,
  Search,
  Send,
  Tag,
  TrendingUp,
  Users,
  Highlighter,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { POLICY_ITEMS, PUSHED_COMPANIES, compareReachListItems, isReachItemDeadlinePassed, isVisibleInReachList, type PolicyItem, type PolicyItemStatus, type PolicyPushStatus, type PushedCompany } from "@/data/policyReachData";
import { PageHero } from "@/components/PageHero";
import { TaskListPagination } from "@/components/TaskListPagination";
import { useTaskListPagination } from "@/hooks/useTaskListPagination";
import { cn } from "@/lib/utils";

const ITEM_STATUS_META: Record<PolicyItemStatus, { className: string; icon?: ElementType }> = {
  申报中: { className: "border border-blue-200 bg-blue-50 text-blue-600", icon: Clock },
  即将截止: { className: "border border-red-200 bg-red-50 text-red-600", icon: Clock },
  已截止: { className: "bg-muted text-muted-foreground" },
};

const PUSH_STATUS_META: Record<PolicyPushStatus, { className: string }> = {
  待推送: { className: "border border-amber-200 bg-amber-50 text-amber-700" },
  已推送: { className: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
};

type PushStatusFilter = "all" | PolicyPushStatus;
type ItemStatusFilter = "all" | "申报中" | "已截止";

const STATUS_META: Record<PushedCompany["status"], { icon: ElementType; color: string; bg: string }> = {
  已触达: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  已申报: { icon: BadgeCheck, color: "text-blue-600", bg: "bg-blue-50" },
  未响应: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
};

const SIZE_COLOR: Record<PushedCompany["size"], string> = {
  大型: "text-primary",
  中型: "text-blue-600",
  小型: "text-amber-600",
  微型: "text-muted-foreground",
};

/** light：与首页「政策兑现」流程 iconSoft（如企业申报）一致；accent：主色红强调 */
const reachFlowSteps = [
  { icon: Highlighter, title: "事项打标", tag: "做标注", variant: "accent" as const },
  { icon: Building2, title: "企业匹配", tag: "做匹配", variant: "light" as const },
  { icon: Send, title: "事项推送", tag: "做推送", variant: "light" as const },
  { icon: TrendingUp, title: "触达效果检测", tag: "看反馈", variant: "accent" as const },
];

const reachOverviewStats = [
  { label: "可推送事项数量", value: "23", unit: "项", note: "已完成企业匹配，可进入推送", icon: Highlighter, color: "text-primary", bg: "bg-primary/10" },
  { label: "已推送事项数量", value: "32", unit: "家", note: "已成功送达企业端的事项数量", icon: Tag, color: "text-primary", bg: "bg-primary/10" },
  { label: "已推送企业数量", value: "3,286", unit: "家", note: "较上周提升 8.6%", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { label: "已推送次数", value: "9,842", unit: "次", note: "短信、站内信、专员触达", icon: Send, color: "text-blue-600", bg: "bg-blue-500/10" },
];

const REACH_LIST_PAGE_SIZE = 10;
const REACH_LIST_PAGE_SIZE_OPTIONS = [10, 20, 30] as const;

function PolicyItemCardBody({
  item,
  showChevron = false,
  showStats = true,
}: {
  item: PolicyItem;
  showChevron?: boolean;
  showStats?: boolean;
}) {
  const itemStatus = item.status;
  const statusMeta = ITEM_STATUS_META[itemStatus];
  const StatusIcon = statusMeta.icon;
  const pushStatusMeta = PUSH_STATUS_META[item.pushStatus];
  const isPendingPush = item.pushStatus === "待推送";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-start gap-2">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusMeta.className}`}
          >
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {itemStatus}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${pushStatusMeta.className}`}>
            {item.pushStatus}
          </span>
          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            相关政策：<span className="text-foreground">《{item.relatedPolicy}》</span>
          </p>
          <p>
            发布部门：<span className="text-foreground">{item.publishDepartment}</span>
          </p>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            兑现：{item.startDate} ~ {item.endDate}
          </span>
        </div>
      </div>

      {item.enterpriseTags && item.enterpriseTags.length > 0 && (
        <div className="shrink-0 lg:w-[280px]">
          <div className="flex flex-wrap gap-1.5">
            {item.enterpriseTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full items-center rounded-md border border-primary/15 bg-primary/[0.04] px-2 py-1 text-[11px] leading-snug text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          {isPendingPush && (
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">以上为模型匹配标签，仅供参考</p>
          )}
        </div>
      )}

      {showStats && (
        <div className="shrink-0 lg:w-[360px]">
          {isPendingPush ? (
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="text-[10px] text-muted-foreground">预计匹配</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {item.estimatedPushCount}
                <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">家企业</span>
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">以上为模型预估匹配结果，仅供参考</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              {[
                { label: "已推送", value: item.totalPushed, color: "text-primary" },
                { label: "成功推送", value: item.successfulPushCount, color: "text-emerald-600" },
              ].map((stat, index) => (
                <div key={stat.label} className={cn("px-3", index === 0 && "pl-0", index === 1 && "pr-0")}>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className={cn("mt-1 text-lg font-bold", stat.color)}>
                    {stat.value}
                    <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">家</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showChevron && <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />}
    </div>
  );
}

function PolicyList({ onSelect, initialSearch }: { onSelect: (item: PolicyItem) => void; initialSearch?: string }) {
  const [search, setSearch] = useState("");
  const [itemStatusFilter, setItemStatusFilter] = useState<ItemStatusFilter>("all");
  const [pushStatusFilter, setPushStatusFilter] = useState<PushStatusFilter>("all");

  useEffect(() => {
    setSearch(initialSearch ?? "");
  }, [initialSearch]);

  const filtered = useMemo(() => {
    return POLICY_ITEMS.filter((item) => {
      if (!isVisibleInReachList(item)) return false;
      const matchSearch = !search || item.title.includes(search) || item.department.includes(search);
      const matchItemStatus =
        itemStatusFilter === "all" ||
        (itemStatusFilter === "申报中" && !isReachItemDeadlinePassed(item)) ||
        (itemStatusFilter === "已截止" && isReachItemDeadlinePassed(item));
      const matchPushStatus = pushStatusFilter === "all" || item.pushStatus === pushStatusFilter;
      return matchSearch && matchItemStatus && matchPushStatus;
    }).sort(compareReachListItems);
  }, [itemStatusFilter, pushStatusFilter, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems,
  } = useTaskListPagination(filtered, `${search}-${itemStatusFilter}-${pushStatusFilter}`, {
    defaultPageSize: REACH_LIST_PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索事项名称"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={itemStatusFilter}
              onChange={(event) => setItemStatusFilter(event.target.value as ItemStatusFilter)}
              className="h-10 min-w-[110px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部兑现状态</option>
              <option value="申报中">申报中</option>
              <option value="已截止">已截止</option>
            </select>
            <select
              value={pushStatusFilter}
              onChange={(event) => setPushStatusFilter(event.target.value as PushStatusFilter)}
              className="h-10 min-w-[110px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部推送状态</option>
              <option value="已推送">已推送</option>
              <option value="待推送">待推送</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            共 <span className="font-semibold text-foreground">{totalItems}</span> 条事项
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        {pagedItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Search className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无匹配事项</p>
          </Card>
        ) : (
          pagedItems.map((item) => (
            <div key={item.id}>
              <Card
                className="cursor-pointer p-5 transition-all hover:-translate-y-px hover:border-primary/30 hover:shadow-md"
                onClick={() => onSelect(item)}
              >
                <PolicyItemCardBody item={item} showChevron />
              </Card>
            </div>
          ))
        )}
      </div>

      <TaskListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={REACH_LIST_PAGE_SIZE_OPTIONS}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

function PolicyDetail({
  item,
  onBack,
  initialSearch,
}: {
  item: PolicyItem;
  onBack: () => void;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setSearch(initialSearch ?? "");
  }, [initialSearch]);

  const companies = useMemo(() => PUSHED_COMPANIES.filter((company) => company.policyId === item.id), [item.id]);

  const filtered = useMemo(() => {
    const result = companies.filter((company) => {
      const matchSearch =
        !search || company.name.includes(search) || company.industry.includes(search) || company.registrationNo.includes(search);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "推送失败" && company.pushResult === "失败") ||
        (statusFilter === "已申报" &&
          company.pushResult !== "失败" &&
          (company.status === "已申报" || company.status === "已触达")) ||
        (statusFilter === "未响应" && company.pushResult !== "失败" && company.status === "未响应");
      return matchSearch && matchStatus;
    });

    if (item.pushStatus !== "已推送") return result;

    return [...result].sort((a, b) => {
      const aFailed = a.pushResult === "失败" ? 1 : 0;
      const bFailed = b.pushResult === "失败" ? 1 : 0;
      return aFailed - bFailed;
    });
  }, [companies, item.pushStatus, search, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      已申报: companies.filter((company) => company.status === "已申报" || company.status === "已触达").length,
      推送成功: companies.filter((company) => company.pushResult === "成功").length,
    }),
    [companies],
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems,
  } = useTaskListPagination(filtered, `${item.id}-${search}-${statusFilter}`, {
    defaultPageSize: REACH_LIST_PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div>
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          返回事项列表
        </button>

        <Card className="p-5">
          <PolicyItemCardBody item={item} showStats={false} />
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "推送总数", value: companies.length, icon: Send, color: "text-primary" },
          { label: "推送成功数量", value: statusCounts.推送成功, icon: CheckCircle, color: "text-emerald-600" },
          { label: "已申报", value: statusCounts.已申报, icon: BadgeCheck, color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索企业名称"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-w-[100px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="all">全部状态</option>
            <option value="已申报">已申报</option>
            <option value="未响应">未响应</option>
            <option value="推送失败">推送失败</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          共 <span className="font-semibold text-foreground">{totalItems}</span> 家企业
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {pagedItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground md:col-span-2">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无匹配企业</p>
          </Card>
        ) : (
          pagedItems.map((company) => {
            const displayStatus = company.status === "已触达" ? "已申报" : company.status;
            const statusMeta = STATUS_META[displayStatus];
            const isPushFailed = item.pushStatus === "已推送" && company.pushResult === "失败";

            return (
              <Card key={company.id} className="overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {company.name.slice(2, 4)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{company.name}</h4>
                      {isPushFailed ? (
                        <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                          <XCircle className="h-3 w-3" />
                          推送失败
                        </span>
                      ) : (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                          <statusMeta.icon className="h-3 w-3" />
                          {displayStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Factory className="h-3.5 w-3.5" />
                        {company.industry}
                      </span>
                      <span className={`font-medium ${SIZE_COLOR[company.size]}`}>{company.size}企业</span>
                      <span className="font-mono text-[11px]">{company.registrationNo}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <TaskListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={REACH_LIST_PAGE_SIZE_OPTIONS}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

export default function PolicyReach() {
  const [searchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<PolicyItem | null>(null);
  const assistantQuery = searchParams.get("q") ?? "";
  const assistantItemId = searchParams.get("itemId");
  useEffect(() => {
    if (assistantItemId) {
      const matchedItem = POLICY_ITEMS.find((item) => item.id === assistantItemId) ?? null;
      setSelectedItem(matchedItem);
      return;
    }

    if (assistantQuery) {
      setSelectedItem(null);
    }
  }, [assistantItemId, assistantQuery]);

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <PageHero
          title="政策触达"
          description="面向政策执行人员，实现政策与企业的精准匹配与高效触达。"
        />

        {!selectedItem && (
          <div className="space-y-3">
            <Card className="h-[156px] rounded-2xl border border-border bg-card px-5 py-4 flex items-center">
              <div className="w-full flex items-center justify-between gap-2 overflow-x-auto">
                {reachFlowSteps.map((step, i) => (
                  <div key={step.title} className="flex min-w-[200px] flex-1 items-center">
                    <div className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors",
                          step.variant === "accent"
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(230,0,50,0.24)]"
                            : "border-[#e7b8c8] bg-[#fceef2] text-[#c41e3a] shadow-sm",
                        )}
                      >
                        <step.icon
                          className={cn(
                            "h-5 w-5",
                            step.variant === "light" ? "text-[#c41e3a]" : "text-primary-foreground",
                          )}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs font-medium text-foreground transition-colors">
                        {step.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{step.tag}</span>
                    </div>
                    {i < reachFlowSteps.length - 1 && (
                      <ChevronsRight className="h-6 w-6 shrink-0 text-primary/40" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reachOverviewStats.map((stat) => (
                <Card key={stat.label} className="border border-border px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <div className="mt-3 flex items-end gap-1">
                        <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                        <span className="pb-1 text-sm text-muted-foreground">{stat.unit}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{stat.note}</p>
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedItem ? (
          <div>
              <PolicyDetail
                item={selectedItem}
                onBack={() => setSelectedItem(null)}
                initialSearch={assistantQuery}
              />
          </div>
        ) : (
          <div>
              <PolicyList onSelect={setSelectedItem} initialSearch={assistantQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
