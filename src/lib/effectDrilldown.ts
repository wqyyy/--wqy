import clauses from "@/data/kaifaClauseMaterials.json";
import { alignEffectFundingAmounts } from "@/data/effectFundingAmounts";
import { withOfficialEffectRecords } from "@/data/effectOfficialRecords";
import { addMockConfirmedItems, addMockPolicyItemAssociations, alignEffectPublicationRecords, generateEffectMockApplications, generateEffectMockRecords } from "@/data/effectMockRecords";

export type DetailKind = "policy" | "interpretation" | "item" | "result" | "fund" | "enterprise";
export type DetailFilters = Partial<Record<"department" | "level" | "applicationStatus" | "redemptionStatus" | "fulfillment" | "itemType" | "method" | "field" | "scale" | "capitalBand" | "year" | "month" | "policyId" | "itemId" | "enterpriseId", string>>;
export type SummaryRow = { name: string; value: number; unit: string; metric: string };
export type DrillDetail = { title: string; dimension: string; rows: SummaryRow[]; selected?: string; kind?: DetailKind; filters?: DetailFilters; nameFilter?: string };
export type BusinessRecord = {
  id: string; kind: DetailKind; name: string; date?: string; department?: string; publisher?: string; level?: string;
  policyId?: string; policyName?: string; code?: string; status?: string; applicationStatus?: string; fulfillment?: string; redemptionStatus?: string;
  itemType?: string; method?: string; field?: string; startDate?: string; endDate?: string; standard?: string; target?: string;
  itemId?: string; itemName?: string; enterpriseId?: string; enterpriseName?: string; creditCode?: string; amount?: number;
  approvedAmount?: number; batch?: string; scale?: string; capital?: number; capitalBand?: string; region?: string;
  content?: string; sourceUrl?: string; interpretationType?: string; confirmed?: boolean; redeemed?: boolean;
  supportCount?: number; paidAmount?: number; supportedCount?: number; lastPaidDate?: string;
};
type Column = { key: keyof BusinessRecord; label: string };
export const ITEM_APPLICATION_STATUSES = ["申报中", "申报已截止", "未开始"] as const;
export const ITEM_REDEMPTION_STATUSES = ["已确定扶持结果", "已拨付", "兑现流程中", "未开始", "零拨付"] as const;
export const ENTERPRISE_CAPITAL_RANGES = [
  { label: "注册资本未知", min: undefined, max: undefined },
  { label: "100万以下", min: 0, max: 100 },
  { label: "100–200万", min: 100, max: 200 },
  { label: "200–500万", min: 200, max: 500 },
  { label: "500–1000万", min: 500, max: 1000 },
  { label: "1000–2000万", min: 1000, max: 2000 },
  { label: "2000–5000万", min: 2000, max: 5000 },
  { label: "5000万以上", min: 5000, max: Infinity },
] as const;

export function itemRedemptionStatus(item: BusinessRecord, records: BusinessRecord[]): string | undefined {
  if (item.redemptionStatus) return item.redemptionStatus;
  if (ITEM_REDEMPTION_STATUSES.some(status => status === item.fulfillment)) return item.fulfillment;
  const payments = records.filter(r => r.kind === "fund" && r.itemId === item.id);
  const successful = payments.filter(r => r.status === "已拨付");
  if (successful.some(r => (r.amount ?? 0) > 0)) return "已拨付";
  if (successful.length && successful.every(r => r.amount === 0)) return "零拨付";
  if (item.redeemed || item.fulfillment === "已兑现") return "已拨付";
  if (item.confirmed || item.fulfillment === "已确认扶持结果" || records.some(r => r.kind === "result" && r.itemId === item.id && r.status === "已确认")) return "已确定扶持结果";
  if (payments.length) return "兑现流程中";
  if (item.confirmed === false && item.redeemed === false) return "未开始";
  return undefined;
}
export type ItemListQuery = { name: string; startFrom: string; startTo: string; endFrom: string; endTo: string };
export const EMPTY_ITEM_QUERY: ItemListQuery = { name: "", startFrom: "", startTo: "", endFrom: "", endTo: "" };
export function filterItemListRecords(records: BusinessRecord[], query: ItemListQuery) {
  const name = query.name.trim().toLowerCase();
  return records.filter(r => (!name || r.name.toLowerCase().includes(name)) &&
    (!query.startFrom || !!r.startDate && r.startDate >= query.startFrom) &&
    (!query.startTo || !!r.startDate && r.startDate <= query.startTo) &&
    (!query.endFrom || !!r.endDate && r.endDate >= query.endFrom) &&
    (!query.endTo || !!r.endDate && r.endDate <= query.endTo));
}
export const DETAIL_CONFIG: Record<DetailKind, { title: string; columns: Column[]; dateLabel: string }> = {
  policy: { title: "政策文件明细", dateLabel: "发布日期", columns: [{ key: "name", label: "政策名称" }, { key: "level", label: "政策级别" }, { key: "department", label: "发文部门" }, { key: "code", label: "政策文号" }, { key: "date", label: "发布日期" }, { key: "status", label: "政策状态" }] },
  interpretation: { title: "政策解读明细", dateLabel: "解读发布日期", columns: [{ key: "name", label: "解读标题" }, { key: "policyName", label: "关联政策" }, { key: "department", label: "发布部门" }, { key: "date", label: "发布日期" }] },
  item: { title: "政策事项明细", dateLabel: "事项发布时间", columns: [{ key: "name", label: "事项名称" }, { key: "policyName", label: "关联政策" }, { key: "department", label: "主管部门" }, { key: "itemType", label: "事项类型" }, { key: "method", label: "兑现方式" }, { key: "field", label: "扶持领域" }, { key: "startDate", label: "申报开始时间" }, { key: "endDate", label: "申报截止时间" }, { key: "applicationStatus", label: "申报状态" }, { key: "redemptionStatus", label: "兑现状态" }] },
  result: { title: "扶持结果明细", dateLabel: "结果确认时间", columns: [{ key: "enterpriseName", label: "企业名称" }, { key: "itemName", label: "事项名称" }, { key: "department", label: "主管部门" }, { key: "approvedAmount", label: "核定金额（元）" }, { key: "date", label: "确认时间" }, { key: "status", label: "扶持结果状态" }] },
  fund: { title: "兑现资金明细", dateLabel: "实际拨付日期", columns: [{ key: "enterpriseName", label: "企业名称" }, { key: "creditCode", label: "统一社会信用代码" }, { key: "itemName", label: "兑现事项" }, { key: "department", label: "主管部门" }, { key: "method", label: "兑现方式" }, { key: "field", label: "扶持领域" }, { key: "amount", label: "实际拨付（元）" }, { key: "date", label: "兑现时间" }] },
  enterprise: { title: "扶持企业明细", dateLabel: "获得扶持时间", columns: [{ key: "name", label: "企业名称" }, { key: "creditCode", label: "统一社会信用代码" }, { key: "scale", label: "企业规模" }, { key: "field", label: "所属产业" }, { key: "capital", label: "注册资本（万元）" }, { key: "supportCount", label: "扶持事项数" }, { key: "paidAmount", label: "累计实际兑现（元）" }] },
};
export const FILTER_LABELS: Record<keyof DetailFilters, string> = { department: "部门", level: "政策级别", applicationStatus: "申报状态", redemptionStatus: "兑现状态", fulfillment: "办理进度", itemType: "事项类型", method: "兑现方式", field: "扶持领域", scale: "企业规模", capitalBand: "注册资本区间", year: "年度", month: "月份", policyId: "关联政策", itemId: "关联事项", enterpriseId: "关联企业" };

export function normalizeDepartment(value: string) {
  return value.replace(/^北京经济技术开发区/, "").replace(/^(北京市)?经开区/, "").trim();
}

// Compatibility bridge for chart requests; explicit chart filters take precedence.
export function resolveDrill(detail: DrillDetail): { kind: DetailKind; filters: DetailFilters } {
  const title = detail.title;
  const kind = detail.kind ?? (title.includes("企业") ? "enterprise" : title.includes("资金") ? "fund" : title.includes("解读") ? "interpretation" : title.includes("事项") || title.includes("部门发布情况") ? "item" : "policy");
  const filters: DetailFilters = { ...detail.filters };
  const selected = detail.selected ?? (detail.rows.length === 1 ? detail.rows[0].name : undefined);
  if (selected) {
    if (detail.dimension === "年度") filters.year = selected;
    if (detail.dimension === "拨付单位" || detail.dimension === "发文单位") filters.department = selected;
    if (detail.dimension === "政策层级") filters.level = selected;
    if (detail.dimension === "事项状态") {
      if (["申报中", "申报已截止"].includes(selected)) filters.applicationStatus = selected;
      else if (["已确认扶持结果", "已确定扶持结果", "已兑现", "已拨付"].includes(selected)) {
        filters.redemptionStatus = ["已确认扶持结果", "已确定扶持结果"].includes(selected) ? "已确定扶持结果" : "已拨付";
        delete filters.fulfillment;
      }
      else filters.fulfillment = selected;
    }
    if (detail.selected && title.includes("类型分布")) filters.itemType = selected;
    if (detail.selected && title.includes("方式分布")) filters.method = selected;
    if (detail.selected && title.includes("规模分布")) filters.scale = selected.replace(/^\d+\s*/, "");
    if (detail.selected && (title.includes("行业分布") || title.includes("扶持领域"))) filters.field = selected;
    if (detail.selected && title.includes("注册资本")) filters.capitalBand = selected;
  }
  if (kind === "item" && title.startsWith("已兑现") && !filters.redemptionStatus) filters.fulfillment = "已兑现";
  return { kind, filters };
}

export function filterRecords(records: BusinessRecord[], kind: DetailKind, filters: DetailFilters, query = ""): BusinessRecord[] {
  const q = query.trim().toLowerCase();
  const unique = new Map<string, BusinessRecord>();
  const enterpriseItems = kind === "item" && filters.enterpriseId ? new Set(records.filter(link => link.enterpriseId === filters.enterpriseId).map(link => link.itemId)) : null;
  const paidItems = kind === "item" && filters.fulfillment === "已兑现" && (filters.year || filters.month) ? new Set(records.filter(link => link.kind === "fund" && link.status === "已拨付" && (!filters.year || link.date?.slice(0, 4) === filters.year) && (!filters.month || link.date?.slice(0, 7) === filters.month)).map(link => link.itemId)) : null;
  const ordered = kind === "enterprise" ? [...records].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")) : records;
  for (const r of ordered) {
    if (r.kind !== kind) continue;
    if (!Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if ((key === "year" || key === "month") && kind === "item" && filters.fulfillment === "已兑现") {
        return paidItems?.has(r.id) ?? false;
      }
      if (key === "year") return r.date?.slice(0, 4) === value;
      if (key === "month") return r.date?.slice(0, 7) === value;
      if (key === "capitalBand") {
        const range = ENTERPRISE_CAPITAL_RANGES.find(range => range.label === value);
        if (range) return range.min === undefined ? r.capital == null || !Number.isFinite(r.capital) : r.capital != null && r.capital >= range.min && r.capital < range.max;
      }
      if (key === "department") return normalizeDepartment(r.department ?? "") === normalizeDepartment(value) || normalizeDepartment(r.publisher ?? "") === normalizeDepartment(value);
      if (key === "level" && kind !== "policy") return records.some(policy => policy.kind === "policy" && policy.id === r.policyId && policy.level === value);
      if (key === "policyId" && kind === "policy") return r.id === value;
      if (key === "itemId" && kind === "item") return r.id === value;
      if (key === "enterpriseId" && kind === "item") return enterpriseItems?.has(r.id) ?? false;
      if (key === "fulfillment") return value === "已兑现" ? r.redeemed === true : value === "已确认扶持结果" ? r.confirmed === true : r.fulfillment === value;
      if (key === "redemptionStatus" && kind === "item") return itemRedemptionStatus(r, records) === value;
      return r[key as keyof BusinessRecord] === value;
    })) continue;
    if (q && !Object.values(r).join(" ").toLowerCase().includes(q)) continue;
    const key = kind === "enterprise" ? r.creditCode || r.enterpriseId || r.id : r.id;
    if (!unique.has(key)) unique.set(key, r);
  }
  const output = [...unique.values()];
  if (kind !== "enterprise" && kind !== "item") return output;
  const paymentScope = Object.fromEntries(Object.entries(filters).filter(([key]) => ["month", "year", "department", "policyId", "itemId", "method", "enterpriseId"].includes(key)));
  const groupedPayments = new Map<string, BusinessRecord[]>();
  for (const payment of filterRecords(records, "fund", paymentScope).filter(p => p.status === "已拨付")) {
    const key = kind === "item" ? payment.itemId : payment.enterpriseId || payment.creditCode;
    if (key) groupedPayments.set(key, [...(groupedPayments.get(key) ?? []), payment]);
  }
  return output.map(r => {
    const payments = groupedPayments.get(kind === "item" ? r.id : r.enterpriseId || r.creditCode || "") ?? [];
    return { ...r, ...(kind === "item" ? { redemptionStatus: itemRedemptionStatus(r, records) } : {}), supportCount: new Set(payments.map(p => p.itemId)).size, supportedCount: new Set(payments.map(p => p.creditCode || p.enterpriseId)).size, paidAmount: payments.reduce((sum, p) => sum + (p.amount ?? 0), 0), lastPaidDate: payments.map(p => p.date ?? "").sort().at(-1) };
  });
}

export function summarizeRecords(records: BusinessRecord[]) {
  const successful = records.filter(r => r.kind === "fund" && r.status === "已拨付");
  return {
    count: records.length,
    paidAmount: successful.reduce((sum, r) => sum + (r.amount ?? 0), 0),
    paymentCount: successful.length,
    enterprises: new Set((records.every(r => r.kind === "fund") ? successful : records).map(r => r.creditCode || r.enterpriseId).filter(Boolean)).size,
    approvedAmount: records.filter(r => r.kind === "result" && r.status === "已确认").reduce((sum, r) => sum + (r.approvedAmount ?? 0), 0),
  };
}

export function summarizeEnterpriseCategories(records: BusinessRecord[]) {
  const companies = new Map<string, BusinessRecord>();
  for (const record of records) if (record.kind === "enterprise") {
    const key = record.creditCode || record.enterpriseId || record.id;
    if (!companies.has(key)) companies.set(key, record);
  }
  const group = (key: "scale" | "field", fallback: string) => {
    const counts = new Map<string, number>();
    for (const record of companies.values()) {
      const name = record[key]?.trim() || fallback;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts].map(([name, count]) => ({ name, count }));
  };
  return { total: companies.size, scales: group("scale", "未标注规模"), industries: group("field", "未标注产业") };
}

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
}

const referencePolicies = new Map<string, BusinessRecord>();
for (const c of clauses) {
  const previous = referencePolicies.get(c.policyTitle);
  if (previous) { previous.content += `\n\n${c.content}`; continue; }
  referencePolicies.set(c.policyTitle, {
    id: `reference-policy-${referencePolicies.size + 1}`, kind: "policy", name: c.policyTitle, department: c.department,
    level: c.department.includes("经济技术开发区") ? "经开区" : c.department.includes("北京市") ? "北京市" : "国家",
    date: c.publishDate, content: c.content, sourceUrl: c.sourceUrl,
  });
}
export const REFERENCE_RECORDS: BusinessRecord[] = [...referencePolicies.values()];

export function createDemoRecords(): BusinessRecord[] {
  return alignEffectFundingAmounts(addMockConfirmedItems(addMockPolicyItemAssociations(withOfficialEffectRecords(alignEffectPublicationRecords(generateEffectMockRecords())))));
}
export const DEMO_RECORDS = createDemoRecords();
export const DEMO_APPLICATIONS = generateEffectMockApplications(DEMO_RECORDS);

export function effectRecordHref(kind: "policy" | "item", id: string) {
  const record = DEMO_RECORDS.find(r => r.kind === kind && r.id === id);
  if (record?.sourceUrl?.startsWith("https://")) return record.sourceUrl;
  return `#/effect-detail/${kind}/${encodeURIComponent(id)}`;
}

export function effectEnterpriseApplicationsHref(creditCode: string) {
  return `#/effect-enterprise-applications/${encodeURIComponent(creditCode)}`;
}
