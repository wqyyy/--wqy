import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import EffectDashboard from "./EffectDashboard";
import { summarizeEnterpriseCategories } from "@/lib/effectDrilldown";
import { EffectDetailDrawer } from "@/components/EffectDetailDrawer";
import { DEMO_RECORDS, DETAIL_CONFIG, filterRecords, type DetailKind } from "@/lib/effectDrilldown";

vi.mock("recharts", async importOriginal => ({ ...await importOriginal<typeof import("recharts")>(), ResponsiveContainer: () => null }));
function renderBoard(focus = "publish") {
  return render(<MemoryRouter initialEntries={[`/effect-dashboard?focus=${focus}`]}><EffectDashboard /></MemoryRouter>);
}
describe("unified dashboard detail drawer", () => {
  it("filters funding by support field and updates the paid total", () => {
    render(<EffectDetailDrawer detail={{ title: "资金明细", kind: "fund", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    expect(screen.getByRole("columnheader", { name: "扶持领域" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("扶持领域"), { target: { value: "科技创新" } });
    const expected = filterRecords(DEMO_RECORDS, "fund", { field: "科技创新" });
    expect(screen.getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    const total = expected.filter(r => r.status === "已拨付").reduce((sum, r) => sum + (r.amount ?? 0), 0);
    expect(screen.getByRole("status", { name: "资金兑现总额统计" })).toHaveTextContent(total.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("扶持领域")).toHaveValue("");
  });
  it("filters item details by support field and resets the selection", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    expect(screen.getByRole("columnheader", { name: "扶持领域" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("扶持领域"), { target: { value: "科技创新" } });
    const expected = filterRecords(DEMO_RECORDS, "item", { field: "科技创新" });
    expect(screen.getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    const index = DETAIL_CONFIG.item.columns.findIndex(c => c.key === "field");
    for (const row of screen.getAllByRole("row").slice(1)) expect(within(row).getAllByRole("cell")[index]).toHaveTextContent("科技创新");
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("扶持领域")).toHaveValue("");
    expect(screen.getByText("共 606 条业务记录")).toBeInTheDocument();
  });
  it("omits the enterprise industry distribution caption from enterprise details", () => {
    render(<EffectDetailDrawer detail={{ title: "扶持企业行业分布", kind: "enterprise", dimension: "所属产业", rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByText("扶持企业行业分布", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "扶持企业明细" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "扶持企业数量统计" })).toBeInTheDocument();
  });
  it("shows only item details for redeemed-item analysis without a funding tab", () => {
    render(<EffectDetailDrawer detail={{ title: "已兑现事项类型分布", kind: "item", dimension: "事项类型", filters: { fulfillment: "已兑现" }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "兑现资金明细" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist", { name: "事项关联明细" })).not.toBeInTheDocument();
  });
  it("highlights interpretation counts for the entire filtered result, including empty results and reset", () => {
    render(<EffectDetailDrawer detail={{ title: "政策解读", kind: "interpretation", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const summary = () => screen.getByRole("status", { name: "政策解读数量统计" });
    expect(screen.queryByText("政策解读", { exact: true })).not.toBeInTheDocument();
    expect(summary()).toHaveClass("border-l-4", "border-primary", "bg-red-50");
    expect(within(summary()).getByText("209")).toHaveClass("text-4xl", "text-primary");
    fireEvent.change(screen.getByLabelText("解读标题"), { target: { value: "电子商务" } });
    expect(within(summary()).getByText("1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("发布日期起"), { target: { value: "2030-01-01" } });
    expect(within(summary()).getByText("0")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(within(summary()).getByText("209")).toBeInTheDocument();
  });
  it.each([
    ["年度", "2023", "2023-01-01", "2023-12-31"],
    ["月份", "2024-02", "2024-02-01", "2024-02-29"],
  ])("initializes funding payment dates from the selected %s", (dimension, selected, from, to) => {
    render(<EffectDetailDrawer detail={{ title: "已兑现资金年度统计", kind: "fund", dimension, selected, filters: dimension === "月份" ? { month: selected } : { year: selected }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.getByLabelText("兑现时间起")).toHaveValue(from);
    expect(screen.getByLabelText("兑现时间止")).toHaveValue(to);
    for (const row of screen.getAllByRole("row").slice(1)) {
      const date = within(row).getAllByRole("cell").at(-1)!.textContent!;
      expect(date >= from && date <= to).toBe(true);
    }
  });
  it("opens applications from an enterprise name and preserves the enterprise filters when returning", () => {
    const company = filterRecords(DEMO_RECORDS, "enterprise", {})[0];
    render(<EffectDetailDrawer detail={{ title: "企业", kind: "enterprise", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByRole("columnheader", { name: "最近扶持时间" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "企业扶持档案" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("企业名称"), { target: { value: company.name } });
    fireEvent.change(screen.getByLabelText("企业规模"), { target: { value: company.scale } });
    fireEvent.click(screen.getByRole("button", { name: company.name, exact: true }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "企业申报明细" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: company.name })).toBeInTheDocument();
    for (const name of ["事项名称", "累计兑现（万元）", "资金拨付时间", "兑现时间"]) expect(screen.getByRole("columnheader", { name, exact: true })).toBeInTheDocument();
    const row = screen.getAllByRole("row")[1];
    const cells = within(row).getAllByRole("cell");
    const itemButton = within(cells[0]).getAllByRole("button")[0];
    const itemName = itemButton.textContent!;
    const policyName = within(cells[1]).getAllByRole("button")[0].textContent!;
    fireEvent.click(itemButton);
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("事项名称")).toHaveValue(itemName);
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "企业申报明细" })).toBeInTheDocument();
    fireEvent.click(within(screen.getAllByRole("row")[1]).getByRole("button", { name: policyName, exact: true }));
    expect(screen.getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("政策名称")).toHaveValue(policyName);
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "企业申报明细" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "扶持企业明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("企业名称")).toHaveValue(company.name);
    expect(screen.getByLabelText("企业规模")).toHaveValue(company.scale);
  });
  it("combines enterprise name, scale and industry filters and updates all category totals", () => {
    const company = filterRecords(DEMO_RECORDS, "enterprise", {})[0];
    render(<EffectDetailDrawer detail={{ title: "企业", kind: "enterprise", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    for (const [label, value] of [["企业名称", company.name], ["企业规模", company.scale], ["所属产业", company.field]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.getByText(/^1 \/ /)).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "扶持企业数量统计" }).querySelector("strong")).toHaveTextContent("1");
    expect(screen.queryByText("企业规模统计")).not.toBeInTheDocument();
    expect(screen.queryByText("所属产业统计")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("企业名称"), { target: { value: "无匹配企业xyz" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("企业名称")).toHaveValue("");
    expect(screen.getByLabelText("企业规模")).toHaveValue("");
    expect(screen.getByLabelText("所属产业")).toHaveValue("");
    expect(screen.getByText(`共 ${filterRecords(DEMO_RECORDS, "enterprise", {}).length} 条业务记录`)).toBeInTheDocument();
  });
  it.each(["查看扶持企业情况明细", "查看扶持企业数明细"])("shows full enterprise distributions through %s", label => {
    renderBoard("funds");
    fireEvent.click(screen.getByRole("button", { name: label, exact: true }));
    expect(screen.getByRole("heading", { name: "扶持企业明细" })).toBeInTheDocument();
    const expected = summarizeEnterpriseCategories(filterRecords(DEMO_RECORDS, "enterprise", {}));
    const total = screen.getByRole("status", { name: "扶持企业数量统计" });
    expect(total.querySelector("strong")).toHaveTextContent(String(expected.total));
    expect(screen.queryByRole("region", { name: "扶持企业分类统计" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(total.querySelector("strong")).toHaveTextContent(String(expected.total));
  });
  it("uses the inherited month and scale when grouping enterprises", () => {
    const filters = { month: "2025-02", scale: "小型企业" };
    render(<EffectDetailDrawer detail={{ title: "企业", kind: "enterprise", dimension: "范围", filters, rows: [] }} onClose={vi.fn()} />);
    const expected = summarizeEnterpriseCategories(filterRecords(DEMO_RECORDS, "enterprise", filters));
    expect(screen.getByRole("status", { name: "扶持企业数量统计" }).querySelector("strong")).toHaveTextContent(String(expected.total));
    expect(screen.getByLabelText("企业规模")).toHaveValue("小型企业");
  });
  it("combines fund method and inclusive payment-date filters with existing queries and resets them", () => {
    const fund = DEMO_RECORDS.find(r => r.kind === "fund" && r.department === "商务金融局")!;
    render(<EffectDetailDrawer detail={{ title: "资金明细", kind: "fund", dimension: "范围", filters: { department: fund.department }, rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["兑现事项", fund.itemName], ["企业名称", fund.enterpriseName], ["兑现方式", fund.method], ["兑现时间起", fund.date], ["兑现时间止", fund.date]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    const expected = filterRecords(DEMO_RECORDS, "fund", { department: fund.department, method: fund.method }).filter(r => r.date === fund.date && r.itemName?.includes(fund.itemName!) && r.enterpriseName?.includes(fund.enterpriseName!));
    expect(screen.getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    const total = expected.reduce((sum, r) => sum + (r.amount ?? 0), 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    expect(screen.getByRole("status", { name: "资金兑现总额统计" }).querySelector("strong")).toHaveTextContent(total);
    fireEvent.change(screen.getByLabelText("兑现时间起"), { target: { value: "2030-01-01" } });
    expect(screen.getByRole("alert")).toHaveTextContent("起始日期不能晚于结束日期");
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("兑现方式")).toHaveValue("");
    expect(screen.getByLabelText("兑现时间起")).toHaveValue("");
    expect(screen.getByLabelText("兑现时间止")).toHaveValue("");
    expect(screen.getByLabelText("主管部门")).toHaveValue(fund.department);
    expect(screen.getByText(`共 ${filterRecords(DEMO_RECORDS, "fund", { department: fund.department }).length} 条业务记录`)).toBeInTheDocument();
  });
  it("adds original-source actions beside policy titles and disables unverified demo originals", () => {
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const sourcePolicy = DEMO_RECORDS.find(r => r.id === "official-policy-bda-ai-talent")!;
    const title = screen.getByText(sourcePolicy.name, { exact: true });
    const titleCell = title.closest("td")!;
    const original = within(titleCell).getByRole("link", { name: "查看原文" });
    expect(original).toHaveAttribute("href", sourcePolicy.sourceUrl);
    expect(original).toHaveAttribute("target", "_blank");
    expect(original).toHaveClass("text-primary", "border-primary/40", "bg-primary/5", "hover:bg-primary/10");
    fireEvent.change(screen.getByLabelText("政策名称"), { target: { value: "模拟" } });
    const demoCell = within(screen.getAllByRole("row")[1]).getAllByRole("cell")[0];
    expect(within(demoCell).getByRole("button", { name: "查看原文" })).toBeDisabled();
    expect(within(demoCell).getByRole("button", { name: "查看原文" })).toHaveClass("disabled:text-primary/40");
    expect(within(demoCell).queryByRole("link", { name: "查看原文" })).not.toBeInTheDocument();
  });
  it("highlights the department's paid total across pages and updates it with all three fund filters", () => {
    renderBoard("funds");
    fireEvent.click(screen.getByRole("button", { name: "查看商务金融局已拨付资金明细" }));
    const departmentRows = filterRecords(DEMO_RECORDS, "fund", { department: "商务金融局" });
    const total = departmentRows.filter(r => r.status === "已拨付").reduce((sum, r) => sum + (r.amount ?? 0), 0);
    const format = (value: number) => value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const summary = screen.getByRole("status", { name: "资金兑现总额统计" });
    expect(summary).toHaveTextContent("商务金融局资金兑现总额");
    expect(summary.querySelector("strong")).toHaveTextContent(format(total));
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(summary.querySelector("strong")).toHaveTextContent(format(total));
    const fund = departmentRows[0];
    fireEvent.change(screen.getByLabelText("兑现事项"), { target: { value: fund.itemName } });
    fireEvent.change(screen.getByLabelText("企业名称"), { target: { value: fund.enterpriseName } });
    fireEvent.change(screen.getByLabelText("主管部门"), { target: { value: fund.department } });
    const matching = departmentRows.filter(r => r.itemName?.includes(fund.itemName!) && r.enterpriseName?.includes(fund.enterpriseName!));
    expect(screen.getByText(`共 ${matching.length} 条业务记录`)).toBeInTheDocument();
    expect(summary.querySelector("strong")).toHaveTextContent(format(matching.reduce((sum, r) => sum + (r.amount ?? 0), 0)));
    expect(screen.getByText(/^1 \/ /)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("主管部门"), { target: { value: "组织人事部" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(summary).toHaveTextContent("组织人事部资金兑现总额");
    expect(summary.querySelector("strong")).toHaveTextContent("0.00");
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("主管部门")).toHaveValue("商务金融局");
    expect(screen.getByText(`共 ${departmentRows.length} 条业务记录`)).toBeInTheDocument();
    expect(summary.querySelector("strong")).toHaveTextContent(format(total));
  });
  it("provides the requested fixed application and redemption options and combines them", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    expect(within(screen.getByLabelText("申报状态")).getAllByRole("option").map(o => o.textContent)).toEqual(["不限", "申报中", "申报已截止", "未开始"]);
    expect(within(screen.getByLabelText("兑现状态")).getAllByRole("option").map(o => o.textContent)).toEqual(["不限", "已确定扶持结果", "已拨付", "兑现流程中", "未开始", "零拨付"]);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    fireEvent.change(screen.getByLabelText("兑现状态"), { target: { value: "已拨付" } });
    expect(screen.getByText(/^1 \/ /)).toBeInTheDocument();
    const expected = filterRecords(DEMO_RECORDS, "item", { redemptionStatus: "已拨付" });
    expect(screen.getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "兑现状态" })).toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "已拨付", exact: true })).toHaveLength(Math.min(20, expected.length));
    fireEvent.change(screen.getByLabelText("申报状态"), { target: { value: "未开始" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("兑现状态")).toHaveValue("");
    expect(screen.getByLabelText("申报状态")).toHaveValue("");
    expect(screen.getByText("共 606 条业务记录")).toBeInTheDocument();
  });
  it("keeps policy filtering but removes the operation column and its buttons", () => {
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "查看事项详情" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "关联事项" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("政策名称"), { target: { value: "无匹配文件xyz" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByText("暂无符合条件的政策文件明细。").closest("td")).toHaveAttribute("colspan", "7");
  });
  it("keeps the related-items placeholder for a policy without items", () => {
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", filters: { policyId: "official-policy-national-rd" }, rows: [] }} onClose={vi.fn()} />);
    const cells = within(screen.getAllByRole("row")[1]).getAllByRole("cell");
    expect(cells).toHaveLength(7);
    expect(cells.at(-1)).toHaveTextContent("—");
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
  });
  it("filters interpretations and opens the interpretation and policy originals separately", () => {
    const record = DEMO_RECORDS.find(r => r.id === "official-interpretation-beijing-ecommerce")!;
    const policy = DEMO_RECORDS.find(r => r.id === record.policyId)!;
    render(<EffectDetailDrawer detail={{ title: "政策解读", kind: "interpretation", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["解读标题", "电子商务"], ["关联政策名称", policy.name], ["发布部门", record.department], ["发布日期起", record.date], ["发布日期止", record.date]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "解读类型" })).not.toBeInTheDocument();
    expect(screen.getByText(record.name, { exact: true }).tagName).toBe("SPAN");
    expect(screen.queryByRole("link", { name: record.name })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看原文" })).toHaveAttribute("href", record.sourceUrl);
    expect(screen.getByRole("link", { name: "查看原文" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "查看原文" }).parentElement).toHaveClass("flex", "justify-start", "w-full");
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "查看政策详情", exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: policy.name, exact: true }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.getByText(policy.name, { exact: true }).tagName).toBe("SPAN");
    expect(screen.getByLabelText("政策名称")).toHaveValue(policy.name);
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 375 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "政策解读明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("解读标题")).toHaveValue("电子商务");
    expect(screen.getByLabelText("发布日期起")).toHaveValue(record.date);
    fireEvent.change(screen.getByLabelText("解读标题"), { target: { value: "无匹配解读" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 209 条业务记录")).toBeInTheDocument();
  });
  it("keeps every linked item without the policy operation column", () => {
    const policy = DEMO_RECORDS.find(p => p.kind === "policy" && DEMO_RECORDS.filter(r => r.kind === "item" && r.policyId === p.id).length > 1)!;
    const items = DEMO_RECORDS.filter(r => r.kind === "item" && r.policyId === policy.id);
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", filters: { policyId: policy.id }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "查看事项详情" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    expect(within(screen.getAllByRole("row")[1]).queryByRole("link", { name: policy.name, exact: true })).not.toBeInTheDocument();
    for (const item of items) {
      expect(screen.getByRole("button", { name: item.name, exact: true })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: items[0].name, exact: true }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("事项名称")).toHaveValue(items[0].name);
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
  });
  it("combines policy filters and resets them to the inherited scope", () => {
    const policy = DEMO_RECORDS.find(r => r.id === "official-policy-bda-energy")!;
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", filters: { level: "经开区" }, rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["政策名称", policy.name], ["政策级别", policy.level], ["发文部门", policy.department], ["发布日期起", policy.date], ["发布日期止", policy.date], ["政策状态", policy.status]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.getByText(policy.name, { exact: true }).tagName).toBe("SPAN");
    fireEvent.change(screen.getByLabelText("发布日期起"), { target: { value: "2030-01-01" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByLabelText("政策级别")).toHaveValue("经开区");
    expect(screen.getByText("共 115 条业务记录")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "发布部门" })).not.toBeInTheDocument();
  });
  it("keeps the original board totals and matches the underlying detail dataset", () => {
    renderBoard();
    for (const [title, kind, count] of [["政策发布", "policy", 375], ["政策解读", "interpretation", 209], ["事项发布", "item", 606]] as const) {
      expect(screen.getByRole("button", { name: `查看${title}明细` }).querySelector("strong")).toHaveTextContent(String(count));
      expect(filterRecords(DEMO_RECORDS, kind, {})).toHaveLength(count);
    }
    for (const [level, count] of [["国家", 94], ["北京市", 166], ["经开区", 115]] as const) {
      expect(screen.getByRole("button", { name: `查看${level}政策发布数量明细` }).querySelector("strong")).toHaveTextContent(String(count));
      expect(filterRecords(DEMO_RECORDS, "policy", { level })).toHaveLength(count);
    }
  });
  it("opens policy records directly without view switch buttons", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "查看政策发布明细" }));
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(within(drawer).queryByText(/非完整统计底账/)).not.toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    expect(within(drawer).getByRole("columnheader", { name: "关联事项" })).toBeInTheDocument();
  });
  it("preserves global month and drill level filters", () => {
    renderBoard();
    fireEvent.change(screen.getByLabelText("选择月份"), { target: { value: "2025-04" } });
    fireEvent.click(screen.getByRole("button", { name: "查看北京市政策发布数量明细" }));
    const drawer = screen.getByRole("dialog");
    const expected = filterRecords(DEMO_RECORDS, "policy", { month: "2025-04", level: "北京市" });
    expect(within(drawer).getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    expect(within(drawer).getAllByRole("row")).toHaveLength(Math.min(20, expected.length) + 1);
    expect(within(drawer).queryByLabelText("当前筛选条件")).not.toBeInTheDocument();
  });
  it.each([["已确认扶持结果", "已确定扶持结果"], ["已兑现", "已拨付"]])("opens %s flow items with the matching redemption filter", (label, status) => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: `查看${label}事项明细` }));
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
    expect(within(drawer).getByLabelText("兑现状态")).toHaveValue(status);
    const expected = filterRecords(DEMO_RECORDS, "item", { redemptionStatus: status });
    expect(within(drawer).getByText(`共 ${expected.length} 条业务记录`)).toBeInTheDocument();
    if (expected.length) expect(within(drawer).getAllByRole("cell", { name: status, exact: true })).toHaveLength(Math.min(20, expected.length));
    expect(within(drawer).queryByRole("tablist")).not.toBeInTheDocument();
    expect(within(drawer).queryByLabelText("数据来源")).not.toBeInTheDocument();
    expect(within(drawer).queryByText(/可切换交互演示/)).not.toBeInTheDocument();
    fireEvent.change(within(drawer).getByLabelText("兑现状态"), { target: { value: "" } });
    expect(within(drawer).getByText("共 606 条业务记录")).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "重置筛选" }));
    expect(within(drawer).getByLabelText("兑现状态")).toHaveValue(status);
  });
  it("preserves the inherited department filter while paginating without filter controls", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", filters: { department: "科技和产业促进局" }, rows: [] }} onClose={vi.fn()} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("共 91 条业务记录")).toBeInTheDocument();
    fireEvent.click(within(drawer).getByRole("button", { name: "下一页" }));
    expect(within(drawer).getByText("2 / 5")).toBeInTheDocument();
    expect(within(drawer).getByText("共 91 条业务记录")).toBeInTheDocument();
  });
  it.each(Object.keys(DETAIL_CONFIG) as DetailKind[])("removes the screenshot section from %s details", kind => {
    render(<EffectDetailDrawer detail={{ title: "数据下钻", kind, dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: DETAIL_CONFIG[kind].title })).toBeInTheDocument();
    expect(within(drawer).queryByRole("tab", { name: "业务明细" })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole("tab", { name: "原图统计（展示数据）" })).not.toBeInTheDocument();
    for (const label of ["数据来源", "明细类型", "当前筛选条件"]) expect(within(drawer).queryByLabelText(label)).not.toBeInTheDocument();
    expect(within(drawer).queryByText(/当前已接入记录|当前演示记录|实际成功拨付|成功拨付记录|涉及企业（去重）|核定扶持金额/)).not.toBeInTheDocument();
    expect(within(drawer).queryByLabelText("关键词")).not.toBeInTheDocument();
    expect(within(drawer).queryByPlaceholderText("搜索名称、政策、企业或信用代码")).not.toBeInTheDocument();
    for (const label of ["部门", "统计月份", "统计年度", "注册资本区间"]) expect(within(drawer).queryByLabelText(label)).not.toBeInTheDocument();
    if (kind !== "item" && kind !== "fund") expect(within(drawer).queryByLabelText("扶持领域")).not.toBeInTheDocument();
    if (kind === "item") {
      expect(within(drawer).queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
      expect(within(drawer).queryByRole("button", { name: "兑现详情" })).not.toBeInTheDocument();
      for (const label of ["事项名称", "主管部门", "申报状态", "事项类型", "兑现方式", "申报开始时间起", "申报开始时间止", "申报截止时间起", "申报截止时间止"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
    } else if (kind === "policy") {
      for (const label of ["政策名称", "政策级别", "发文部门", "发布日期起", "发布日期止", "政策状态"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
      expect(within(drawer).queryByRole("columnheader", { name: "发布部门" })).not.toBeInTheDocument();
    } else if (kind === "interpretation") {
      for (const label of ["解读标题", "关联政策名称", "发布部门", "发布日期起", "发布日期止"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
      expect(within(drawer).queryByRole("columnheader", { name: "解读类型" })).not.toBeInTheDocument();
    } else if (kind === "fund") {
      for (const label of ["兑现事项", "企业名称", "主管部门"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
      expect(within(drawer).queryByRole("columnheader", { name: "拨付批次" })).not.toBeInTheDocument();
    } else if (kind === "enterprise") {
      for (const label of ["企业名称", "企业规模", "所属产业"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
    } else {
      expect(within(drawer).queryByRole("textbox")).not.toBeInTheDocument();
      expect(within(drawer).queryByRole("region", { name: "事项明细筛选" })).not.toBeInTheDocument();
    }
    expect(within(drawer).queryByRole("button", { name: "重置" })).not.toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "导出当前结果" })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "导出当前结果" })).toBeEnabled();
    expect(within(drawer).getByRole("button", { name: "下一页" })).toBeEnabled();
  });
  it.each(["policy", "item"] as const)("highlights the filtered overall count for %s, not the page size", kind => {
    render(<EffectDetailDrawer detail={{ title: "数据下钻", kind, dimension: "范围", filters: { department: "商务金融局" }, rows: [] }} onClose={vi.fn()} />);
    const summary = screen.getByRole("status", { name: kind === "policy" ? "政策文件数量统计" : "政策事项数量统计" });
    expect(screen.queryByText(/模拟数据/)).not.toBeInTheDocument();
    expect(within(summary).getByText(`商务金融局${kind === "policy" ? "政策" : "事项"}发布情况`)).toBeInTheDocument();
    const total = kind === "policy" ? "12" : "99";
    expect(within(summary).getByText(total)).toBeInTheDocument();
    if (kind === "item") fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(within(summary).getByText(total)).toBeInTheDocument();
  });
  it("opens item redemption details and the policy-scoped document list inside the drawer", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const row = screen.getAllByRole("row")[1];
    const itemName = within(row).getAllByRole("button")[0].textContent!;
    const item = DEMO_RECORDS.find(r => r.kind === "item" && r.name === itemName)!;
    const sourceLinks = within(row).getAllByRole("link", { name: "查看原文" });
    expect(sourceLinks).toHaveLength(2);
    for (const link of sourceLinks) {
      expect(link).toHaveAttribute("href", item.sourceUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    fireEvent.click(within(row).getByRole("button", { name: item.name, exact: true }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: item.name, exact: true })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "申报企业明细" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    const restoredRow = screen.getAllByRole("row")[1];
    fireEvent.click(within(restoredRow).getByRole("button", { name: item.policyName!, exact: true }));
    expect(screen.getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.getByText(item.policyName!, { exact: true }).tagName).toBe("SPAN");
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
  });
  it("returns from item details and preserves the original list page", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", filters: { department: "科技和产业促进局" }, rows: [] }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    fireEvent.click(within(screen.getAllByRole("row")[1]).getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("共 91 条业务记录")).toBeInTheDocument();
  });
  it("opens enterprise applications in the same drawer and restores funding filters and pagination", () => {
    render(<EffectDetailDrawer detail={{ title: "资金明细", kind: "fund", dimension: "范围", filters: { department: "商务金融局" }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "详情", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "申报记录", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "申报记录", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("企业名称"), { target: { value: "示例" } });
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    const row = screen.getAllByRole("row")[1];
    const cells = within(row).getAllByRole("cell");
    const company = cells[0].textContent!;
    const creditCode = cells[1].textContent!;
    fireEvent.click(within(row).getByRole("button", { name: company, exact: true }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "企业申报明细" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: company })).toBeInTheDocument();
    expect(screen.getByText(`统一社会信用代码：${creditCode}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "兑现资金明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("企业名称")).toHaveValue("示例");
    expect(screen.getByLabelText("主管部门")).toHaveValue("商务金融局");
    expect(screen.getByText(/^2 \/ /)).toBeInTheDocument();
    const restoredRow = screen.getAllByRole("row")[1];
    const itemName = within(restoredRow).getAllByRole("cell")[2].textContent!;
    expect(within(restoredRow).queryByRole("link", { name: itemName, exact: true })).not.toBeInTheDocument();
    fireEvent.click(within(restoredRow).getByRole("button", { name: itemName, exact: true }));
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("事项名称")).toHaveValue(itemName);
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "兑现资金明细" })).toBeInTheDocument();
    expect(screen.getByLabelText("企业名称")).toHaveValue("示例");
    expect(screen.getByText(/^2 \/ /)).toBeInTheDocument();
  });
  it("combines all seven item filters and resets them without changing other detail templates", () => {
    const item = DEMO_RECORDS.find(r => r.kind === "item" && r.department === "商务金融局" && r.date === "2026-12-04")!;
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["事项名称", item.name], ["主管部门", item.department], ["事项类型", item.itemType], ["兑现方式", item.method], ["申报状态", item.applicationStatus], ["申报开始时间起", item.startDate], ["申报开始时间止", item.startDate], ["申报截止时间起", item.endDate], ["申报截止时间止", item.endDate]]) {
      fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    }
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(within(screen.getByRole("status")).getByText("1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("事项名称"), { target: { value: "无匹配事项" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 606 条业务记录")).toBeInTheDocument();
  });
  it("removes the duplicate description and enterprise hint from item lists", () => {
    const title = "高端汽车和新能源产业局事项发布情况";
    render(<EffectDetailDrawer detail={{ title, kind: "item", dimension: "范围", filters: { department: "高端汽车和新能源产业局" }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.getAllByText(title)).toHaveLength(1);
    expect(screen.queryByText("企业按信用代码去重。")).not.toBeInTheDocument();
    expect(within(screen.getByRole("status")).getByText("40")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeInTheDocument();
  });
  it("shows item applications with paid status without payment records or enterprise button", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const row = screen.getAllByRole("row").find(r => r.textContent?.includes("模拟"))!;
    const name = within(row).getAllByRole("button")[0].textContent;
    fireEvent.click(within(row).getAllByRole("button")[0]);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: name! })).toBeInTheDocument();
    expect(within(screen.getByRole("status", { name: "申报企业数" })).getByText("3")).toBeInTheDocument();
    expect(within(screen.getByRole("status", { name: "兑现企业数" })).getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "累计兑现金额" })).toHaveTextContent("万元");
    const item = DEMO_RECORDS.find(r => r.kind === "item" && r.name === name)!;
    expect(screen.getByRole("button", { name: "查看原文" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: item.policyName!, exact: true }));
    expect(screen.getByRole("heading", { name: "政策文件明细" })).toBeInTheDocument();
    expect(screen.getByText(item.policyName!, { exact: true }).tagName).toBe("SPAN");
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { level: 2, name: name! })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "申报企业明细" })).getAllByRole("row")).toHaveLength(4);
    const enterpriseButtons = within(screen.getByRole("region", { name: "申报企业明细" })).getAllByRole("row").slice(1).map(row => within(within(row).getAllByRole("cell")[0]).getByRole("button"));
    expect(enterpriseButtons).toHaveLength(3);
    expect(within(screen.getByRole("region", { name: "申报企业明细" })).queryByRole("button", { name: "申报记录" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "申报企业明细" })).queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(enterpriseButtons.every(button => !button.hasAttribute("href"))).toBe(true);
    expect(screen.queryByRole("region", { name: "兑现记录" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "扶持企业" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "已拨付", exact: true })).toHaveLength(2);
    expect(screen.queryByRole("cell", { name: "已兑现", exact: true })).not.toBeInTheDocument();
    fireEvent.click(enterpriseButtons[2]);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "企业申报明细" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "审核中" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { level: 2, name: name! })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
  });
  it("keeps policy titles noninteractive and provides a separate original link", () => {
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const official = DEMO_RECORDS.find(r => r.id === "official-policy-bda-xr")!;
    expect(screen.queryByRole("link", { name: official.name })).not.toBeInTheDocument();
    expect(screen.getByText(official.name, { exact: true }).tagName).toBe("SPAN");
    expect(screen.queryByText("政策发布", { exact: true })).not.toBeInTheDocument();
  });
  it("does not display fictional application or payment statistics for official items", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const row = screen.getAllByRole("row")[1];
    fireEvent.click(within(row).getAllByRole("button")[0]);
    const title = screen.getByRole("heading", { level: 2 });
    expect(within(title).getByRole("link")).toHaveAttribute("href", expect.stringContaining("https://kfqgw.beijing.gov.cn/"));
    expect(screen.getByRole("status", { name: "申报企业数" })).toHaveTextContent("—");
    expect(screen.getByText("暂无申报企业")).toBeInTheDocument();
    expect(screen.queryByText(/MOCK-/)).not.toBeInTheDocument();
  });
});
