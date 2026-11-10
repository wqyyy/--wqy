import { describe, expect, it } from "vitest";
import { EFFECT_DEPARTMENTS } from "@/data/effectPublicationCounts";
import { EFFECT_FUND_DEPARTMENTS, EFFECT_FUND_METHODS } from "@/data/effectFundingAmounts";
import { EFFECT_OFFICIAL_RECORDS } from "@/data/effectOfficialRecords";
import { summarizeEnterpriseCategories } from "./effectDrilldown";
import { DEMO_RECORDS, DEMO_APPLICATIONS, REFERENCE_RECORDS, csvCell, effectRecordHref, filterRecords, resolveDrill, summarizeRecords, type BusinessRecord } from "./effectDrilldown";

describe("effect dashboard business drill-down", () => {
  it("matches dashboard funding amounts by department and redemption method", () => {
    const toCents = (value: number) => Math.round(value * 100);
    const total = EFFECT_FUND_DEPARTMENTS.reduce((sum, d) => sum + toCents(d.amount), 0);
    for (const department of EFFECT_FUND_DEPARTMENTS) {
      const paid = filterRecords(DEMO_RECORDS, "fund", { department: department.name }).filter(r => r.status === "已拨付");
      expect(paid.reduce((sum, r) => sum + toCents(r.amount ?? 0), 0)).toBe(toCents(department.amount));
    }
    for (const method of EFFECT_FUND_METHODS) {
      const paid = filterRecords(DEMO_RECORDS, "fund", { method: method.name }).filter(r => r.status === "已拨付");
      expect(Math.abs(paid.reduce((sum, r) => sum + toCents(r.amount ?? 0), 0) - Math.round(total * method.value / 100))).toBeLessThanOrEqual(1);
    }
  });
  it("provides item classification fields and defaults missing demo payout progress to not started", () => {
    const items = filterRecords(DEMO_RECORDS, "item", {});
    for (const item of items) {
      for (const key of ["itemType", "method", "field", "redemptionStatus"] as const) expect(item[key]?.trim()).toBeTruthy();
      if (item.sourceUrl) {
        expect(item.redemptionStatus).toBe("未开始");
        expect(item.method).toBe("未知");
      }
    }
    expect(items).toHaveLength(606);
    expect(filterRecords(DEMO_RECORDS, "item", { redemptionStatus: "已拨付" })).toHaveLength(424);
  });
  it("counts enterprise categories once per credit code and includes missing categories", () => {
    const rows: BusinessRecord[] = [
      { id: "a", kind: "enterprise", name: "甲", creditCode: "A", scale: "小型企业", field: "信息技术" },
      { id: "a-duplicate", kind: "enterprise", name: "甲", creditCode: "A", scale: "小型企业", field: "信息技术" },
      { id: "b", kind: "enterprise", name: "乙", creditCode: "B", scale: "小型企业", field: "生物医药" },
      { id: "c", kind: "enterprise", name: "丙", creditCode: "C" },
      { id: "fund", kind: "fund", name: "拨付", creditCode: "A" },
    ];
    const summary = summarizeEnterpriseCategories(rows);
    expect(summary.total).toBe(3);
    expect(summary.scales).toEqual([{ name: "小型企业", count: 2 }, { name: "未标注规模", count: 1 }]);
    expect(summary.industries.reduce((sum, group) => sum + group.count, 0)).toBe(3);
    expect(summary.industries).toContainEqual({ name: "未标注产业", count: 1 });
    expect(summarizeEnterpriseCategories([])).toEqual({ total: 0, scales: [], industries: [] });
  });
  it("maps flow-card labels to visible redemption status without an additional hidden legacy filter", () => {
    for (const [label, status] of [["已确认扶持结果", "已确定扶持结果"], ["已兑现", "已拨付"]]) {
      const request = { title: `${label}事项`, dimension: "事项状态", rows: [{ name: label, value: 1, unit: "项", metric: "数量" }] };
      const scope = resolveDrill(request);
      expect(scope).toEqual({ kind: "item", filters: { redemptionStatus: status } });
      expect(resolveDrill({ ...request, ...scope })).toEqual(scope);
    }
  });
  it("filters the five redemption statuses without treating unknown official data as unstarted or zero", () => {
    const records: BusinessRecord[] = [
      { id: "paid", kind: "item", name: "已拨付事项", confirmed: true },
      { id: "zero", kind: "item", name: "零拨付事项" },
      { id: "confirmed", kind: "item", name: "已确定事项", confirmed: true },
      { id: "processing", kind: "item", name: "流程中事项" },
      { id: "pending", kind: "item", name: "未开始事项", redemptionStatus: "未开始", applicationStatus: "未开始" },
      { id: "unknown", kind: "item", name: "未知事项", sourceUrl: "https://www.beijing.gov.cn/" },
      { id: "p1", kind: "fund", name: "款项", itemId: "paid", amount: 10, status: "已拨付" },
      { id: "p2", kind: "fund", name: "款项", itemId: "zero", amount: 0, status: "已拨付" },
      { id: "p3", kind: "fund", name: "款项", itemId: "processing", amount: 5, status: "审批中" },
    ];
    for (const [status, id] of [["已拨付", "paid"], ["零拨付", "zero"], ["已确定扶持结果", "confirmed"], ["兑现流程中", "processing"], ["未开始", "pending"]]) expect(filterRecords(records, "item", { redemptionStatus: status }).map(r => r.id)).toEqual([id]);
    expect(filterRecords(records, "item", { applicationStatus: "未开始", redemptionStatus: "未开始" }).map(r => r.id)).toEqual(["pending"]);
  });
  it("includes verified official examples without inventing their business records", () => {
    expect(EFFECT_OFFICIAL_RECORDS.filter(r => r.kind === "policy")).toHaveLength(16);
    expect(EFFECT_OFFICIAL_RECORDS.filter(r => r.kind === "item")).toHaveLength(12);
    for (const record of EFFECT_OFFICIAL_RECORDS) {
      if (record.kind !== "interpretation") expect(effectRecordHref(record.kind as "item" | "policy", record.id)).toBe(record.sourceUrl);
      expect(new URL(record.sourceUrl!).hostname).toMatch(/(?:gov\.cn|chinatax\.gov\.cn)$/);
      if (record.kind === "item") {
        expect(DEMO_APPLICATIONS.filter(r => r.itemId === record.id)).toHaveLength(0);
        expect(filterRecords(DEMO_RECORDS, "fund", { itemId: record.id })).toHaveLength(0);
        expect(DEMO_RECORDS.find(r => r.id === record.policyId)?.sourceUrl).toBe(record.sourceUrl);
      }
    }
  });
  it("matches every department's original publication counts, including zero", () => {
    for (const d of EFFECT_DEPARTMENTS) {
      expect(filterRecords(DEMO_RECORDS, "policy", { department: d.name })).toHaveLength(d.published);
      expect(filterRecords(DEMO_RECORDS, "item", { department: d.name })).toHaveLength(d.items);
    }
  });
  it("routes the six business objects without treating approval as payment", () => {
    for (const [title, kind] of [["政策发布", "policy"], ["政策解读", "interpretation"], ["事项发布", "item"], ["已拨付资金", "fund"], ["扶持企业数", "enterprise"]]) {
      expect(resolveDrill({ title, dimension: "范围", rows: [] }).kind).toBe(kind);
    }
    expect(resolveDrill({ title: "扶持结果", kind: "result", dimension: "范围", rows: [] }).kind).toBe("result");
  });
  it("carries the level, department, year, category and progress filters", () => {
    expect(resolveDrill({ title: "国家政策发布数量", dimension: "政策层级", rows: [{ name: "国家", value: 94, unit: "条", metric: "发布" }] }).filters.level).toBe("国家");
    expect(resolveDrill({ title: "部门事项发布情况", dimension: "发文单位", selected: "信息技术产业局", rows: [] }).filters.department).toBe("信息技术产业局");
    expect(resolveDrill({ title: "已兑现事项分析年度统计", dimension: "年度", selected: "2025", rows: [] }).filters).toEqual({ year: "2025", fulfillment: "已兑现" });
    expect(resolveDrill({ title: "扶持企业规模分布", dimension: "分类", selected: "2 微型企业", rows: [] }).filters.scale).toBe("微型企业");
    expect(resolveDrill({ title: "已兑现事项类型分布", dimension: "分类", selected: "未知", rows: [] }).filters.itemType).toBe("未知");
  });
  it("keeps application state independent of confirmation and payment", () => {
    const paid = filterRecords(DEMO_RECORDS, "item", { fulfillment: "已兑现" });
    const confirmed = filterRecords(DEMO_RECORDS, "item", { fulfillment: "已确认扶持结果" });
    expect(paid.length).toBeGreaterThan(0);
    expect(confirmed.length).toBeGreaterThanOrEqual(paid.length);
    expect(paid.every(item => confirmed.some(r => r.id === item.id))).toBe(true);
  });
  it("filters paid items by actual payment time, not publication date", () => {
    const records: BusinessRecord[] = [
      { id: "item-a", kind: "item", name: "事项", date: "2025-01-01", redeemed: true },
      { id: "fund-a", kind: "fund", name: "拨付", itemId: "item-a", date: "2026-04-10", status: "已拨付", amount: 10 },
    ];
    expect(filterRecords(records, "item", { fulfillment: "已兑现", month: "2026-04" }).map(r => r.id)).toContain("item-a");
    expect(filterRecords(records, "item", { fulfillment: "已兑现", month: "2025-01" })).toEqual([]);
  });
  it("deduplicates enterprises within a range but not their actual payments", () => {
    const enterprises = filterRecords(DEMO_RECORDS, "enterprise", {});
    const payments = filterRecords(DEMO_RECORDS, "fund", {});
    expect(enterprises.length).toBe(new Set(payments.map(r => r.creditCode)).size);
    expect(payments.length).toBeGreaterThan(enterprises.length);
    expect(summarizeRecords(payments).paidAmount).toBe(payments.reduce((sum, r) => sum + r.amount!, 0));
  });
  it("counts only successful actual payments, never approved amounts", () => {
    const rows: BusinessRecord[] = [
      { id: "1", name: "成功", kind: "fund", status: "已拨付", amount: 20, approvedAmount: 100, creditCode: "A" },
      { id: "2", name: "失败", kind: "fund", status: "拨付失败", amount: 50, creditCode: "A" },
    ];
    expect(summarizeRecords(rows)).toMatchObject({ paidAmount: 20, paymentCount: 1, enterprises: 1 });
  });
  it("provides multiple fictional associated items for national and Beijing policies", () => {
    for (const level of ["国家", "北京市"]) {
      const policies = DEMO_RECORDS.filter(r => r.kind === "policy" && r.level === level && !r.sourceUrl).slice(0, 12);
      expect(policies).toHaveLength(12);
      for (const policy of policies) {
        const items = filterRecords(DEMO_RECORDS, "item", { policyId: policy.id });
        expect(items).toHaveLength(2);
        expect(items.every(item => item.policyName === policy.name && !item.sourceUrl)).toBe(true);
      }
    }
  });
  it("matches the board's sixteen confirmed support items without paid funds", () => {
    expect(filterRecords(DEMO_RECORDS, "item", { applicationStatus: "申报中" })).toHaveLength(16);
    expect(filterRecords(DEMO_RECORDS, "item", { applicationStatus: "申报已截止" })).toHaveLength(590);
    expect(filterRecords(DEMO_RECORDS, "item", { redemptionStatus: "已拨付" })).toHaveLength(424);
    const items = filterRecords(DEMO_RECORDS, "item", { redemptionStatus: "已确定扶持结果" });
    expect(items).toHaveLength(16);
    for (const item of items) {
      expect(item.sourceUrl).toBeUndefined();
      expect(item.confirmed).toBe(true);
      expect(item.redeemed).toBe(false);
      expect(filterRecords(DEMO_RECORDS, "result", { itemId: item.id })).toHaveLength(2);
      expect(filterRecords(DEMO_RECORDS, "fund", { itemId: item.id }).some(r => r.status === "已拨付")).toBe(false);
    }
    expect(filterRecords(DEMO_RECORDS, "item", {})).toHaveLength(606);
  });
  it("filters enterprise capital using nonoverlapping numeric ranges", () => {
    const records: BusinessRecord[] = [undefined, 0, 100, 200, 500, 1000, 2000, 5000].map((capital, i) => ({ id: String(i), kind: "enterprise", name: String(i), capital }));
    for (const [band, expected] of [["注册资本未知", "0"], ["100万以下", "1"], ["100–200万", "2"], ["200–500万", "3"], ["500–1000万", "4"], ["1000–2000万", "5"], ["2000–5000万", "6"], ["5000万以上", "7"]]) {
      expect(filterRecords(records, "enterprise", { capitalBand: band }).map(r => r.id)).toEqual([expected]);
    }
  });
  it("supports policy-item-enterprise-payment linkage", () => {
    const payment = DEMO_RECORDS.find(r => r.kind === "fund")!;
    expect(filterRecords(DEMO_RECORDS, "policy", { policyId: payment.policyId })).toHaveLength(1);
    expect(filterRecords(DEMO_RECORDS, "item", { itemId: payment.itemId })).toHaveLength(1);
    const enterprises = filterRecords(DEMO_RECORDS, "enterprise", { itemId: payment.itemId });
    expect(enterprises).toHaveLength(2);
    expect(enterprises.some(r => r.enterpriseId === payment.enterpriseId)).toBe(true);
    expect(filterRecords(DEMO_RECORDS, "fund", { enterpriseId: payment.enterpriseId }).length).toBeGreaterThan(0);
    expect(filterRecords(DEMO_RECORDS, "item", { enterpriseId: payment.enterpriseId }).length).toBeGreaterThan(0);
  });
  it("never fills reference data with synthetic payments or interpretations", () => {
    expect(REFERENCE_RECORDS.length).toBeGreaterThan(0);
    expect(REFERENCE_RECORDS.every(r => r.kind === "policy" && r.sourceUrl)).toBe(true);
    expect(filterRecords(REFERENCE_RECORDS, "fund", {})).toEqual([]);
    expect(filterRecords(DEMO_RECORDS, "fund", { month: "1999-01" })).toEqual([]);
  });
  it("escapes spreadsheet formulas and CSV quotes", () => {
    expect(csvCell("=SUM(A1)" )).toBe('"\'=SUM(A1)"');
    expect(csvCell('a"b')).toBe('"a""b"');
  });
  it("populates all six templates with paginatable and clearly fictional records", () => {
    for (const kind of ["policy", "interpretation", "item", "result", "fund", "enterprise"] as const) {
      const rows = filterRecords(DEMO_RECORDS, kind, {});
      expect(rows.length).toBeGreaterThan(20);
      expect(rows.every(r => r.sourceUrl || r.name.includes("模拟"))).toBe(true);
    }
    const policies = filterRecords(DEMO_RECORDS, "policy", {});
    expect(new Set(policies.map(r => r.level))).toEqual(new Set(["国家", "北京市", "经开区"]));
    expect(new Set(policies.map(r => r.date?.slice(0, 4))).size).toBe(6);
    expect(DEMO_RECORDS.filter(r => r.kind === "fund").every(r => r.amount! <= r.approvedAmount! && r.creditCode?.startsWith("MOCK-"))).toBe(true);
  });
});
