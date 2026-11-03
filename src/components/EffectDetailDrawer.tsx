import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowLeft, ChevronLeft, ChevronRight, Download, ExternalLink, FileSearch } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EffectItemDetail } from "@/components/EffectItemDetail";
import { DEMO_RECORDS, DETAIL_CONFIG, EMPTY_ITEM_QUERY, csvCell, effectRecordHref, filterItemListRecords, filterRecords, resolveDrill, summarizeRecords, type ItemListQuery, type BusinessRecord, type DetailFilters, type DetailKind, type DrillDetail } from "@/lib/effectDrilldown";

const SELECT_CLASS = "h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm";
type ArchiveTab = DetailKind | "annual";
type RecordHistoryEntry = { record: BusinessRecord; tab: ArchiveTab };
type PolicyQuery = { name: string; policyName: string; from: string; to: string; status: string };
const EMPTY_POLICY_QUERY: PolicyQuery = { name: "", policyName: "", from: "", to: "", status: "" };
type DrillSnapshot = { kind: DetailKind; filters: DetailFilters; itemQuery: ItemListQuery; policyQuery: PolicyQuery; page: number; pageSize: number; sort: { key: keyof BusinessRecord; ascending: boolean }; record: BusinessRecord | null; archiveTab: ArchiveTab; recordHistory: RecordHistoryEntry[] };
function display(record: BusinessRecord, key: keyof BusinessRecord) {
  const value = record[key];
  if (value === undefined || value === "") return "—";
  return typeof value === "number" ? value.toLocaleString("zh-CN", { minimumFractionDigits: ["amount", "approvedAmount", "paidAmount"].includes(key) ? 2 : 0, maximumFractionDigits: 2 }) : String(value);
}
function publicationLink(record: BusinessRecord, key: keyof BusinessRecord) {
  if (key === "name" && record.kind === "interpretation" && record.sourceUrl?.startsWith("https://")) return record.sourceUrl;
  if (key === "name" && (record.kind === "policy" || record.kind === "item")) return effectRecordHref(record.kind, record.id);
  if (key === "policyName" && record.policyId) return effectRecordHref("policy", record.policyId);
  if (key === "itemName" && record.itemId) return effectRecordHref("item", record.itemId);
  return null;
}

export function EffectDetailDrawer({ detail, onClose }: { detail: DrillDetail | null; onClose: () => void }) {
  const scope = detail ? resolveDrill(detail) : { kind: "policy" as const, filters: {} };
  const [kind, setKind] = useState<DetailKind>(scope.kind);
  const [filters, setFilters] = useState<DetailFilters>(scope.filters);
  const [itemQuery, setItemQuery] = useState<ItemListQuery>({ ...EMPTY_ITEM_QUERY });
  const [policyQuery, setPolicyQuery] = useState<PolicyQuery>({ ...EMPTY_POLICY_QUERY });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<{ key: keyof BusinessRecord; ascending: boolean }>({ key: "date", ascending: false });
  const [record, setRecord] = useState<BusinessRecord | null>(null);
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("item");
  const [recordHistory, setRecordHistory] = useState<RecordHistoryEntry[]>([]);
  const [drillHistory, setDrillHistory] = useState<DrillSnapshot[]>([]);
  const openRecord = (next: BusinessRecord) => {
    setRecordHistory(previous => record ? [...previous, { record, tab: archiveTab }] : []);
    setRecord(next);
    setArchiveTab("item");
  };
  const closeRecord = () => { setRecord(null); setRecordHistory([]); };
  const backRecord = () => {
    const previous = recordHistory.at(-1);
    if (!previous) { closeRecord(); return; }
    setRecord(previous.record); setArchiveTab(previous.tab); setRecordHistory(history => history.slice(0, -1));
  };
  const backDrill = () => {
    const previous = drillHistory.at(-1);
    if (!previous) return;
    setKind(previous.kind); setFilters(previous.filters); setPage(previous.page); setPageSize(previous.pageSize); setSort(previous.sort);
    setItemQuery(previous.itemQuery); setPolicyQuery(previous.policyQuery);
    setRecord(previous.record); setArchiveTab(previous.archiveTab); setRecordHistory(previous.recordHistory);
    setDrillHistory(history => history.slice(0, -1));
  };
  const dataset = DEMO_RECORDS;
  const policyItems = useMemo(() => {
    const groups = new Map<string, BusinessRecord[]>();
    for (const item of dataset) if (item.kind === "item" && item.policyId) groups.set(item.policyId, [...(groups.get(item.policyId) ?? []), item]);
    return groups;
  }, [dataset]);
  const rows = useMemo(() => {
    let records = filterRecords(dataset, kind, filters);
    if (kind === "interpretation") records = records.filter(r => (!policyQuery.name.trim() || r.name.toLowerCase().includes(policyQuery.name.trim().toLowerCase())) && (!policyQuery.policyName.trim() || r.policyName?.toLowerCase().includes(policyQuery.policyName.trim().toLowerCase())) && (!policyQuery.from || !!r.date && r.date >= policyQuery.from) && (!policyQuery.to || !!r.date && r.date <= policyQuery.to));
    if (kind === "policy") records = records.filter(r => (!policyQuery.name.trim() || r.name.toLowerCase().includes(policyQuery.name.trim().toLowerCase())) && (!policyQuery.from || !!r.date && r.date >= policyQuery.from) && (!policyQuery.to || !!r.date && r.date <= policyQuery.to) && (!policyQuery.status || r.status === policyQuery.status));
    return (kind === "item" ? filterItemListRecords(records, itemQuery) : records).sort((a, b) => {
    if (["policy", "item", "interpretation"].includes(kind) && sort.key === "date" && !sort.ascending && !!a.sourceUrl !== !!b.sourceUrl) return a.sourceUrl ? -1 : 1;
    const av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
    return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "zh-CN")) * (sort.ascending ? 1 : -1);
    });
  }, [dataset, kind, filters, itemQuery, policyQuery, sort]);
  const config = DETAIL_CONFIG[kind];
  const selectedDepartment = filters.department?.trim();
  const publicationHeading = `${selectedDepartment === "None" ? "未提供部门" : selectedDepartment || "全部部门"}${kind === "policy" ? "政策" : "事项"}发布情况`;
  const count = rows.length;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(page, pages);
  const relatedTabs: DetailKind[] = scope.filters.fulfillment === "已兑现" ? ["item", "fund"] : scope.filters.fulfillment === "已确认扶持结果" ? ["item", "result"] : [scope.kind];
  const exportData = () => {
    const columns = config.columns;
    const data = [[...columns.map(c => c.label), ...(kind === "policy" ? ["关联事项"] : [])], ...rows.map(r => [...columns.map(c => r[c.key] ?? ""), ...(kind === "policy" ? [(policyItems.get(r.id) ?? []).map(item => item.name).join("；")] : [])])];
    const csv = data.map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${config.title}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const drill = (nextKind: DetailKind, nextFilters: DetailFilters) => {
    setDrillHistory(previous => [...previous, { kind, filters, itemQuery, policyQuery, page, pageSize, sort, record, archiveTab, recordHistory }]);
    closeRecord();
    const carried = Object.fromEntries(Object.entries(filters).filter(([key]) => ["month", "year", "department", "level"].includes(key)));
    setKind(nextKind); setFilters({ ...carried, ...nextFilters }); setPage(1);
    setItemQuery({ ...EMPTY_ITEM_QUERY }); setPolicyQuery({ ...EMPTY_POLICY_QUERY });
  };
  const linkedFilters: DetailFilters = record?.kind === "enterprise" ? { enterpriseId: record.enterpriseId } : record?.kind === "policy" ? { policyId: record.id } : record?.kind === "item" ? { itemId: record.id } : {};
  const linkedRecords = record ? filterRecords(dataset, archiveTab === "annual" ? "fund" : archiveTab, linkedFilters) : [];
  const allEnterpriseFunds = record?.kind === "enterprise" ? filterRecords(dataset, "fund", { enterpriseId: record.enterpriseId }) : [];
  const enterpriseStats = summarizeRecords(allEnterpriseFunds);
  const annual = [...new Set(allEnterpriseFunds.map(r => r.date?.slice(0, 4)))].filter(Boolean).sort().map(year => ({ year, ...summarizeRecords(allEnterpriseFunds.filter(r => r.date?.startsWith(year!))) }));
  const extraColumns = [{ key: "policyName", label: "关联政策" }, { key: "itemName", label: "关联事项" }, { key: "field", label: "扶持领域" }, { key: "status", label: "业务状态" }, { key: "region", label: "所属地区" }, { key: "target", label: "支持对象" }, { key: "standard", label: "扶持标准" }, { key: "supportCount", label: "享受扶持事项数" }, { key: "supportedCount", label: "扶持企业数" }, { key: "paidAmount", label: "累计实际兑现（万元）" }, { key: "lastPaidDate", label: "最近兑现日期" }] as const;
  const recordColumns = record ? [...DETAIL_CONFIG[record.kind].columns, ...extraColumns.filter(c => record[c.key] !== undefined && !DETAIL_CONFIG[record.kind].columns.some(column => column.key === c.key))] : [];

  if (record?.kind === "item") return <Sheet open={!!detail} onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="right" className="w-full sm:w-[74vw] sm:max-w-none p-0 flex flex-col gap-0 overflow-hidden"><EffectItemDetail item={record} records={dataset} onBack={backRecord} /></SheetContent></Sheet>;

  return <Sheet open={!!detail} onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="right" className="w-full sm:w-[74vw] sm:max-w-none p-0 flex flex-col gap-0 overflow-hidden [&_label]:whitespace-nowrap [&_td]:leading-6 [&_input]:min-w-0">
    <SheetHeader className="border-b p-5 pr-12 text-left">
      {drillHistory.length > 0 && <Button variant="ghost" size="sm" className="w-fit gap-1.5 px-0 text-muted-foreground" onClick={backDrill}><ArrowLeft className="h-4 w-4" />返回上一页</Button>}
      <SheetTitle>{config.title}</SheetTitle>
      {(kind === "policy" || kind === "item") && <div role="status" aria-live="polite" aria-label={kind === "policy" ? "政策文件数量统计" : "政策事项数量统计"} className="mt-3 border-l-4 border-primary bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-foreground break-words">{publicationHeading}</p>
        <p className="mt-1 flex items-baseline gap-2"><strong className="text-4xl font-bold tabular-nums leading-tight text-primary">{rows.length.toLocaleString("zh-CN")}</strong><span className="text-sm text-muted-foreground">{kind === "policy" ? "条" : "项"}</span></p>
      </div>}
      <SheetDescription className={kind === "item" ? "sr-only" : undefined}>{kind === "item" ? "事项数据明细" : detail?.title}</SheetDescription>
    </SheetHeader>
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
      {kind === "interpretation" && <section aria-label="政策解读筛选" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {([{ key: "name", label: "解读标题" }, { key: "policyName", label: "关联政策名称" }] as const).map(({ key, label }) => <label key={key} className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">{label}</span><Input className="min-w-0 flex-1" aria-label={label} placeholder={`请输入${label}`} value={policyQuery[key]} onChange={e => { setPolicyQuery(q => ({ ...q, [key]: e.target.value })); setPage(1); }} /></label>)}
        <label className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">发布部门</span><select aria-label="发布部门" className={`${SELECT_CLASS} w-0 flex-1`} value={filters.department ?? ""} onChange={e => { setFilters(f => ({ ...f, department: e.target.value || undefined })); setPage(1); }}><option value="">全部</option>{[...new Set([...dataset.filter(r => r.kind === "interpretation").map(r => r.department), filters.department].filter(Boolean))].map(value => <option key={value} value={value}>{value === "None" ? "未提供部门" : value}</option>)}</select></label>
        <div className="min-w-0 text-xs sm:col-span-2"><div className="flex min-w-0 items-center gap-2"><p className="w-[84px] shrink-0 whitespace-nowrap">发布日期</p><div className="flex min-w-0 flex-1 items-center gap-1"><Input aria-label="发布日期起" type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" max={policyQuery.to || undefined} value={policyQuery.from} onChange={e => { setPolicyQuery(q => ({ ...q, from: e.target.value })); setPage(1); }} /><span className="text-muted-foreground">至</span><Input aria-label="发布日期止" type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" min={policyQuery.from || undefined} value={policyQuery.to} onChange={e => { setPolicyQuery(q => ({ ...q, to: e.target.value })); setPage(1); }} /></div></div>{policyQuery.from && policyQuery.to && policyQuery.from > policyQuery.to && <p role="alert" className="text-destructive">起始日期不能晚于结束日期</p>}</div>
        <div className="flex items-end"><Button size="sm" variant="outline" onClick={() => { setPolicyQuery({ ...EMPTY_POLICY_QUERY }); setFilters(f => ({ ...f, department: scope.filters.department })); setPage(1); }}>重置筛选</Button></div>
      </section>}
      {kind === "policy" && <section aria-label="政策文件筛选" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">政策名称</span><Input className="min-w-0 flex-1" aria-label="政策名称" placeholder="请输入政策名称" value={policyQuery.name} onChange={e => { setPolicyQuery(q => ({ ...q, name: e.target.value })); setPage(1); }} /></label>
        {([{ key: "level", label: "政策级别" }, { key: "department", label: "发文部门" }] as const).map(({ key, label }) => <label key={key} className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">{label}</span><select aria-label={label} className={`${SELECT_CLASS} w-0 flex-1`} value={filters[key] ?? ""} onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value || undefined })); setPage(1); }}><option value="">全部</option>{[...new Set([...dataset.filter(r => r.kind === "policy").map(r => r[key]), filters[key]].filter(Boolean))].map(value => <option key={value} value={value}>{value === "None" ? "未提供部门" : value}</option>)}</select></label>)}
        <label className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">政策状态</span><select aria-label="政策状态" className={`${SELECT_CLASS} w-0 flex-1`} value={policyQuery.status} onChange={e => { setPolicyQuery(q => ({ ...q, status: e.target.value })); setPage(1); }}><option value="">全部</option>{[...new Set(dataset.filter(r => r.kind === "policy" && r.status).map(r => r.status!))].map(status => <option key={status} value={status}>{status}</option>)}</select></label>
        <div className="min-w-0 text-xs sm:col-span-2"><div className="flex min-w-0 items-center gap-2"><p className="w-[84px] shrink-0 whitespace-nowrap">发布日期</p><div className="flex min-w-0 flex-1 items-center gap-1"><Input aria-label="发布日期起" type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" max={policyQuery.to || undefined} value={policyQuery.from} onChange={e => { setPolicyQuery(q => ({ ...q, from: e.target.value })); setPage(1); }} /><span className="text-muted-foreground">至</span><Input aria-label="发布日期止" type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" min={policyQuery.from || undefined} value={policyQuery.to} onChange={e => { setPolicyQuery(q => ({ ...q, to: e.target.value })); setPage(1); }} /></div></div>{policyQuery.from && policyQuery.to && policyQuery.from > policyQuery.to && <p role="alert" className="text-destructive">起始日期不能晚于结束日期</p>}</div>
        <div className="flex items-end"><Button size="sm" variant="outline" onClick={() => { setPolicyQuery({ ...EMPTY_POLICY_QUERY }); setFilters(f => ({ ...f, department: scope.filters.department, level: scope.filters.level })); setPage(1); }}>重置筛选</Button></div>
      </section>}
      {kind === "item" && <section aria-label="事项明细筛选" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">事项名称</span><Input className="min-w-0 flex-1" aria-label="事项名称" placeholder="请输入事项名称" value={itemQuery.name} onChange={e => { setItemQuery(q => ({ ...q, name: e.target.value })); setPage(1); }} /></label>
        {([{ key: "department", label: "主管部门" }, { key: "itemType", label: "事项类型" }, { key: "method", label: "兑现方式" }, { key: "applicationStatus", label: "申报状态" }] as const).map(({ key, label }) => <label key={key} className="flex min-w-0 items-center gap-2 text-xs"><span className="w-[84px] shrink-0 whitespace-nowrap">{label}</span><select aria-label={label} className={`${SELECT_CLASS} w-0 flex-1`} value={filters[key] ?? ""} onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value || undefined })); setPage(1); }}><option value="">全部</option>{[...new Set([...dataset.filter(r => r.kind === "item").map(r => r[key]), filters[key]].filter(Boolean))].map(value => <option key={value} value={value}>{value === "None" ? "未提供部门" : value}</option>)}</select></label>)}
        {([{ prefix: "start", label: "申报开始时间" }, { prefix: "end", label: "申报截止时间" }] as const).map(({ prefix, label }) => {
          const fromKey = `${prefix}From` as const, toKey = `${prefix}To` as const;
          const invalid = !!itemQuery[fromKey] && !!itemQuery[toKey] && itemQuery[fromKey] > itemQuery[toKey];
          return <div key={prefix} className="min-w-0 text-xs sm:col-span-2"><div className="flex min-w-0 items-center gap-2"><p className="w-[84px] shrink-0 whitespace-nowrap">{label}</p><div className="flex min-w-0 flex-1 items-center gap-1"><Input aria-label={`${label}起`} type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" max={itemQuery[toKey] || undefined} aria-invalid={invalid} value={itemQuery[fromKey]} onChange={e => { setItemQuery(q => ({ ...q, [fromKey]: e.target.value })); setPage(1); }} /><span className="text-muted-foreground">至</span><Input aria-label={`${label}止`} type="date" className="w-0 min-w-0 flex-1 px-1 text-xs" min={itemQuery[fromKey] || undefined} aria-invalid={invalid} value={itemQuery[toKey]} onChange={e => { setItemQuery(q => ({ ...q, [toKey]: e.target.value })); setPage(1); }} /></div></div>{invalid && <p role="alert" className="text-destructive">起始日期不能晚于结束日期</p>}</div>;
        })}
        <div className="flex items-end"><Button size="sm" variant="outline" onClick={() => { setItemQuery({ ...EMPTY_ITEM_QUERY }); setFilters(f => ({ ...f, department: scope.filters.department, itemType: scope.filters.itemType, method: scope.filters.method, applicationStatus: scope.filters.applicationStatus })); setPage(1); }}>重置筛选</Button></div>
      </section>}
      {relatedTabs.length > 1 && <div className="flex border-b gap-5" role="tablist" aria-label="事项关联明细">{relatedTabs.map(k => <button key={k} role="tab" aria-selected={kind === k} className={`pb-2 text-sm ${kind === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`} onClick={() => { setKind(k); setPage(1); }}>{k === "item" ? "事项明细" : DETAIL_CONFIG[k].title}</button>)}</div>}
      <div className="flex flex-wrap justify-between gap-2">{kind !== "item" && <span className="text-xs text-muted-foreground self-center">企业按信用代码去重。</span>}<div className="ml-auto flex gap-2"><Button size="sm" variant="outline" disabled={!count} onClick={exportData}><Download className="h-4 w-4 mr-1" />导出当前结果</Button></div></div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-xs">
          <thead className="bg-red-50"><tr>
            {config.columns.map(c => <th key={c.key} className="whitespace-nowrap p-3"><button className="flex items-center gap-1" onClick={() => setSort({ key: c.key, ascending: sort.key === c.key ? !sort.ascending : true })}>{c.label}{sort.key === c.key ? sort.ascending ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : null}</button></th>)}
            <th className="p-3 whitespace-nowrap">{kind === "policy" ? "关联事项" : "操作"}</th>
          </tr></thead>
          <tbody>
            {rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(r => <tr key={r.id} className="border-t hover:bg-red-50/40">
              {config.columns.map((c, i) => <td key={c.key} className="p-3"><div className={i === 0 || c.key === "policyName" || c.key === "itemName" ? "min-w-40 max-w-72" : "min-w-20"}>{publicationLink(r, c.key) ? <a href={publicationLink(r, c.key)!} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title="查看原文或详情">{display(r, c.key)}</a> : i === 0 ? <button className="text-primary text-left hover:underline" onClick={() => { openRecord(r); }}>{display(r, c.key)}</button> : display(r, c.key)}</div></td>)}
              <td className="p-3">{kind === "policy" ? <div className="min-w-48 max-w-80 space-y-2">{(policyItems.get(r.id) ?? []).length ? (policyItems.get(r.id) ?? []).map(item => <a key={item.id} href={effectRecordHref("item", item.id)} target="_blank" rel="noopener noreferrer" className="block break-words text-primary hover:underline">{item.name}</a>) : <span className="text-muted-foreground">—</span>}</div> : <button className="whitespace-nowrap text-primary hover:underline" onClick={() => { openRecord(r); }}>{kind === "enterprise" ? "企业扶持档案" : "详情"}</button>}</td>
            </tr>)}
            {!count && <tr><td className="py-14 text-center text-muted-foreground" colSpan={config.columns.length + 1}><FileSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />暂无符合条件的{config.title}。</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <div className="border-t p-4 flex flex-wrap justify-between gap-3 items-center text-xs"><span>共 {count} 条业务记录</span><div className="flex items-center gap-2"><select aria-label="每页条数" className={SELECT_CLASS} value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[10, 20, 50].map(n => <option key={n} value={n}>{n} 条/页</option>)}</select><Button variant="outline" size="icon" aria-label="上一页" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></Button>{currentPage} / {pages}<Button variant="outline" size="icon" aria-label="下一页" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></Button></div></div>

    <Dialog open={!!record} onOpenChange={open => { if (!open) closeRecord(); }}><DialogContent className="max-w-4xl w-[calc(100%-32px)] max-h-[85vh] overflow-y-auto"><Button variant="ghost" size="sm" className="w-fit gap-1.5 px-0 text-muted-foreground" onClick={backRecord}><ArrowLeft className="h-4 w-4" />返回上一页</Button><DialogHeader><DialogTitle>{record?.kind === "enterprise" ? "企业扶持档案" : "业务详情"}：{record?.name}</DialogTitle><DialogDescription>业务记录详情</DialogDescription></DialogHeader>
      {record && <><dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{recordColumns.map(c => <div key={c.key}><dt className="text-xs text-muted-foreground">{c.label}</dt><dd className="mt-1 break-words">{display(record, c.key)}</dd></div>)}</dl>
        {record.content && <div className="border-t pt-4 text-sm leading-7 whitespace-pre-wrap">{record.content}</div>}
        {record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 text-sm text-primary items-center">查看政策原文<ExternalLink size={14} /></a>}
        <div className="flex flex-wrap gap-2 border-t pt-4">{record.kind === "policy" && <Button variant="outline" size="sm" onClick={() => drill("item", { policyId: record.id })}>关联政策事项</Button>}{record.policyId && <Button variant="outline" size="sm" onClick={() => { const policy = dataset.find(p => p.kind === "policy" && p.id === record.policyId); if (policy) openRecord(policy); else drill("policy", { policyId: record.policyId }); }}>查看关联政策</Button>}{["item", "result", "fund"].includes(record.kind) && <><Button variant="outline" size="sm" onClick={() => drill("enterprise", { itemId: record.itemId ?? record.id })}>扶持企业</Button><Button variant="outline" size="sm" onClick={() => drill("result", { itemId: record.itemId ?? record.id })}>扶持结果</Button><Button variant="outline" size="sm" onClick={() => drill("fund", { itemId: record.itemId ?? record.id })}>兑现记录</Button></>}</div>
        {record.kind === "enterprise" && <><div className="grid grid-cols-3 gap-2 border-y py-4 text-sm"><div>享受扶持事项<p className="text-primary text-xl">{new Set(allEnterpriseFunds.map(r => r.itemId)).size} 项</p></div><div>累计实际兑现<p className="text-primary text-xl">{enterpriseStats.paidAmount.toFixed(2)} 万元</p></div><div>最近扶持年度<p className="text-primary text-xl">{annual.at(-1)?.year ?? "—"}</p></div></div><div role="tablist" className="flex gap-3 flex-wrap">{([["item", "享受政策事项"], ["fund", "资金兑现记录"], ["annual", "年度扶持情况"]] as const).map(([k, label]) => <Button key={k} role="tab" aria-selected={archiveTab === k} variant={archiveTab === k ? "default" : "outline"} size="sm" onClick={() => setArchiveTab(k)}>{label}</Button>)}</div>{archiveTab === "annual" ? <div className="space-y-2 text-sm">{annual.map(a => <p key={a.year}>{a.year} 年：{a.paymentCount} 笔，实拨 {a.paidAmount.toFixed(2)} 万元</p>)}{!annual.length && <p>暂无年度扶持记录</p>}</div> : <div className="space-y-2 text-sm">{linkedRecords.map(r => <button className="w-full border-b py-2 text-left text-primary" key={r.id} onClick={() => openRecord(r)}>{r.name} {r.amount !== undefined ? `${r.amount.toFixed(2)} 万元` : ""}</button>)}{!linkedRecords.length && <p>暂无关联记录</p>}</div>}</>}
      </>}
    </DialogContent></Dialog>
  </SheetContent></Sheet>;
}
