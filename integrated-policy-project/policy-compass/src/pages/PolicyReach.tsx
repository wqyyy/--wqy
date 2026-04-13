import { useState, useMemo, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Calendar, Building2, Send, ChevronRight, X,
  ArrowLeft, CheckCircle, Clock, AlertCircle, Users, FileText,
  Tag, TrendingUp, BadgeCheck, Phone, Factory,
} from "lucide-react";
import {
  POLICY_ITEMS, PUSHED_COMPANIES, DEPARTMENTS,
  type PolicyItem, type PushedCompany,
} from "@/data/policyReachData";

// ─── 類型標籤樣式 ──────────────────────────────────────────
const TYPE_META: Record<string, { bg: string; text: string }> = {
  补贴: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
  奖励: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" },
  减免: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
  服务: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  融资: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300" },
};

const STATUS_META: Record<PushedCompany["status"], { icon: ElementType; color: string; bg: string }> = {
  已触达: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  已申报: { icon: BadgeCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  未响应: { icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
};

const SIZE_COLOR: Record<string, string> = {
  大型: "text-primary",
  中型: "text-blue-600 dark:text-blue-400",
  小型: "text-amber-600 dark:text-amber-400",
  微型: "text-muted-foreground",
};

// ─── 事項列表頁 ──────────────────────────────────────────
function PolicyList({ onSelect }: { onSelect: (item: PolicyItem) => void }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    return POLICY_ITEMS.filter(p => {
      const matchSearch = !search || p.title.includes(search) || p.department.includes(search);
      const matchDept = deptFilter === "all" || p.department === deptFilter;
      const matchStart = !startFilter || p.startDate >= startFilter;
      const matchEnd = !endFilter || p.endDate <= endFilter;
      return matchSearch && matchDept && matchStart && matchEnd;
    });
  }, [search, deptFilter, startFilter, endFilter]);

  const activeFilterCount = [
    deptFilter !== "all",
    !!startFilter,
    !!endFilter,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setDeptFilter("all");
    setStartFilter("");
    setEndFilter("");
  };

  const isDeadlineSoon = (endDate: string) => {
    const diff = (new Date(endDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  };
  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <div className="flex flex-col h-full">
      {/* 搜索與篩選欄 */}
      <div className="shrink-0 space-y-3 mb-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索事项名称或部门..."
              className="w-full h-10 pl-9 pr-4 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-colors ${
              showFilter || activeFilterCount > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <Filter className="h-4 w-4" />
            筛选
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 篩選面板 */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 部門 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />主管部门
                    </label>
                    <select
                      value={deptFilter}
                      onChange={e => setDeptFilter(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="all">全部部门</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {/* 兌現開始 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />兑现开始（不早于）
                    </label>
                    <input
                      type="date"
                      value={startFilter}
                      onChange={e => setStartFilter(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {/* 兌現截止 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />兑现截止（不晚于）
                    </label>
                    <input
                      type="date"
                      value={endFilter}
                      onChange={e => setEndFilter(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end">
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                      <X className="h-3 w-3" />清除所有筛选
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 結果計數 */}
        <p className="text-xs text-muted-foreground">
          共 <span className="font-semibold text-foreground">{filtered.length}</span> 条事项
          {search && <>，搜索「<span className="text-primary">{search}</span>」</>}
        </p>
      </div>

      {/* 事項列表 */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Search className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无匹配事项</p>
          </div>
        ) : filtered.map((item, i) => {
          const expired = isExpired(item.endDate);
          const soon = isDeadlineSoon(item.endDate);
          const typeMeta = TYPE_META[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              onClick={() => onSelect(item)}
              className={`group rounded-xl border bg-card p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-px ${
                expired ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* 標題行 */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${typeMeta.bg} ${typeMeta.text}`}>
                      {item.type}
                    </span>
                    {soon && !expired && (
                      <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1">
                        <Clock className="h-3 w-3" />即将截止
                      </span>
                    )}
                    {expired && (
                      <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        已结束
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* 摘要 */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.summary}</p>

                  {/* 元資訊行 */}
                  <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />{item.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      兑现：{item.startDate} ~ {item.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      发布：{item.publishDate}
                    </span>
                  </div>
                </div>

                {/* 右側：已推送數 + 箭頭 */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{item.totalPushed}</p>
                    <p className="text-[10px] text-muted-foreground">已推送企业</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 事項詳情頁：已推送企業名單 ──────────────────────────
function PolicyDetail({ item, onBack }: { item: PolicyItem; onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const companies = useMemo(
    () => PUSHED_COMPANIES.filter(c => c.policyId === item.id),
    [item.id]
  );

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const matchSearch = !search || c.name.includes(search) || c.industry.includes(search) || c.registrationNo.includes(search);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSize = sizeFilter === "all" || c.size === sizeFilter;
      return matchSearch && matchStatus && matchSize;
    });
  }, [companies, search, statusFilter, sizeFilter]);

  const statusCounts = useMemo(() => ({
    已触达: companies.filter(c => c.status === "已触达").length,
    已申报: companies.filter(c => c.status === "已申报").length,
    未响应: companies.filter(c => c.status === "未响应").length,
  }), [companies]);

  const typeMeta = TYPE_META[item.type];

  return (
    <div className="flex flex-col h-full">
      {/* 頂部導航 */}
      <div className="shrink-0 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />返回事项列表
        </button>

        {/* 事項資訊卡 */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${typeMeta.bg} ${typeMeta.text}`}>{item.type}</span>
                <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{item.department}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />兑现期：{item.startDate} ~ {item.endDate}</span>
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />发布日期：{item.publishDate}</span>
          </div>
        </div>
      </div>

      {/* 統計卡 */}
      <div className="grid grid-cols-3 gap-3 shrink-0 mb-5">
        {[
          { label: "推送总数", value: companies.length, icon: Send, color: "text-primary" },
          { label: "已申报", value: statusCounts["已申报"], icon: BadgeCheck, color: "text-blue-600 dark:text-blue-400" },
          { label: "未响应", value: statusCounts["未响应"], icon: AlertCircle, color: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <Icon className={`h-5 w-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 搜索 + 篩選 */}
      <div className="flex gap-2 shrink-0 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索企业名称、统一社会信用代码、行业..."
            className="w-full h-9 pl-9 pr-4 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none appearance-none cursor-pointer min-w-[100px]"
        >
          <option value="all">全部状态</option>
          <option value="已申报">已申报</option>
          <option value="未响应">未响应</option>
        </select>
        <select
          value={sizeFilter}
          onChange={e => setSizeFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none appearance-none cursor-pointer min-w-[90px]"
        >
          <option value="all">全部规模</option>
          <option value="大型">大型</option>
          <option value="中型">中型</option>
          <option value="小型">小型</option>
          <option value="微型">微型</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground shrink-0 mb-3">
        共 <span className="font-semibold text-foreground">{filtered.length}</span> 家企业
      </p>

      {/* 企業卡片列表 */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">暂无匹配企业</p>
          </div>
        ) : filtered.map((company, i) => {
          const displayStatus = company.status === "已触达" ? "已申报" : company.status;
          const sMeta = STATUS_META[displayStatus];
          const isExpanded = expandedId === company.id;
          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* 卡片頭部：點擊展開 */}
              <div
                className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : company.id)}
              >
                {/* 企業首字 Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                  {company.name.slice(2, 4)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* 企業名 + 狀態 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-foreground">{company.name}</h4>
                    <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${sMeta.bg} ${sMeta.color}`}>
                      <sMeta.icon className="h-3 w-3" />{displayStatus}
                    </span>
                  </div>

                  {/* 基本資訊行 */}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Factory className="h-3.5 w-3.5 shrink-0" />{company.industry}
                    </span>
                    <span className={`font-medium ${SIZE_COLOR[company.size]}`}>{company.size}企业</span>
                    <span>成立于 {company.establishedYear} 年</span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 shrink-0" />联系人：{company.contact}
                    </span>
                    <span className="font-mono text-[11px]">{company.registrationNo}</span>
                  </div>

                  {/* 符合點：前兩個標籤 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {company.matchPoints.slice(0, 2).map((pt, pi) => (
                      <span key={pi} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-primary/8 text-primary border border-primary/15">
                        <CheckCircle className="h-3 w-3 shrink-0" />{pt}
                      </span>
                    ))}
                    {company.matchPoints.length > 2 && (
                      <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                        +{company.matchPoints.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{company.pushTime.split(" ")[0]}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* 展開詳情 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-4">
                      {/* 全部符合條件 */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-primary" />
                          符合事项要求的条件
                        </p>
                        <ul className="space-y-1.5">
                          {company.matchPoints.map((pt, pi) => (
                            <li key={pi} className="flex items-start gap-2 text-xs text-foreground">
                              <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 推送原因 */}
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          推送原因
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed bg-background rounded-lg border border-border px-3 py-2.5">
                          {company.pushReason}
                        </p>
                      </div>

                      {/* 推送時間 */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />推送时间：{company.pushTime}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${STATUS_META[company.status].color}`}>
                          <sMeta.icon className="h-3.5 w-3.5" />{displayStatus}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 主頁面（含側欄） ──────────────────────────────────────
export default function PolicyReach() {
  const [selectedItem, setSelectedItem] = useState<PolicyItem | null>(null);

  return (
    <div className="h-full flex w-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 flex items-center border-b px-4 bg-card shrink-0">
          <h1 className="text-base font-semibold text-foreground">政策触达</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto min-h-0 flex flex-col">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <PolicyDetail item={selectedItem} onBack={() => setSelectedItem(null)} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <PolicyList onSelect={setSelectedItem} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
