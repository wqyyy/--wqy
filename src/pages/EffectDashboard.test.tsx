import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import EffectDashboard from "./EffectDashboard";
import { EXTERNAL_ENTERPRISE_DETAIL } from "@/lib/fundingEstimation";
import { EffectDetailDrawer } from "@/components/EffectDetailDrawer";
import { DEMO_RECORDS, DETAIL_CONFIG, filterRecords, type DetailKind } from "@/lib/effectDrilldown";

vi.mock("recharts", async importOriginal => ({ ...await importOriginal<typeof import("recharts")>(), ResponsiveContainer: () => null }));
function renderBoard(focus = "publish") {
  return render(<MemoryRouter initialEntries={[`/effect-dashboard?focus=${focus}`]}><EffectDashboard /></MemoryRouter>);
}
describe("unified dashboard detail drawer", () => {
  it("filters interpretations and opens the interpretation and policy originals separately", () => {
    const record = DEMO_RECORDS.find(r => r.id === "official-interpretation-beijing-ecommerce")!;
    const policy = DEMO_RECORDS.find(r => r.id === record.policyId)!;
    render(<EffectDetailDrawer detail={{ title: "政策解读", kind: "interpretation", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["解读标题", "电子商务"], ["关联政策名称", policy.name], ["发布部门", record.department], ["发布日期起", record.date], ["发布日期止", record.date]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "解读类型" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: record.name })).toHaveAttribute("href", record.sourceUrl);
    expect(screen.getByRole("link", { name: policy.name, exact: true })).toHaveAttribute("href", policy.sourceUrl);
    expect(screen.getByRole("link", { name: record.name })).toHaveAttribute("target", "_blank");
    fireEvent.change(screen.getByLabelText("解读标题"), { target: { value: "无匹配解读" } });
    expect(screen.getByText("共 0 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出当前结果" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 209 条业务记录")).toBeInTheDocument();
  });
  it("replaces policy operations with every linked item, not only one or the current item page", () => {
    const policy = DEMO_RECORDS.find(p => p.kind === "policy" && DEMO_RECORDS.filter(r => r.kind === "item" && r.policyId === p.id).length > 1)!;
    const items = DEMO_RECORDS.filter(r => r.kind === "item" && r.policyId === policy.id);
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", filters: { policyId: policy.id }, rows: [] }} onClose={vi.fn()} />);
    expect(screen.queryByRole("columnheader", { name: "操作" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "详情" })).not.toBeInTheDocument();
    const links = within(screen.getAllByRole("row")[1]).getAllByRole("link");
    expect(links).toHaveLength(items.length + 1);
    for (const item of items) {
      const link = screen.getByRole("link", { name: item.name, exact: true });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("href", `#/effect-detail/item/${item.id}`);
    }
  });
  it("combines policy filters and resets them to the inherited scope", () => {
    const policy = DEMO_RECORDS.find(r => r.id === "official-policy-bda-energy")!;
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", filters: { level: "经开区" }, rows: [] }} onClose={vi.fn()} />);
    for (const [label, value] of [["政策名称", policy.name], ["政策级别", policy.level], ["发文部门", policy.department], ["发布日期起", policy.date], ["发布日期止", policy.date], ["政策状态", policy.status]]) fireEvent.change(screen.getByLabelText(label!), { target: { value } });
    expect(screen.getByText("共 1 条业务记录")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: policy.name })).toHaveAttribute("href", policy.sourceUrl);
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
  it("keeps progress-specific related tabs without the removed selectors", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "查看已确认扶持结果事项明细" }));
    const drawer = screen.getByRole("dialog");
    fireEvent.click(within(drawer).getByRole("tab", { name: "扶持结果明细" }));
    expect(within(drawer).getAllByRole("button", { name: "详情" })).toHaveLength(20);
    expect(within(drawer).queryByLabelText("数据来源")).not.toBeInTheDocument();
    expect(within(drawer).queryByText(/可切换交互演示/)).not.toBeInTheDocument();
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
    for (const label of ["部门", "统计月份", "统计年度", "扶持领域", "企业规模", "注册资本区间"]) expect(within(drawer).queryByLabelText(label)).not.toBeInTheDocument();
    if (kind === "item") {
      for (const label of ["事项名称", "主管部门", "申报状态", "事项类型", "兑现方式", "申报开始时间起", "申报开始时间止", "申报截止时间起", "申报截止时间止"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
    } else if (kind === "policy") {
      for (const label of ["政策名称", "政策级别", "发文部门", "发布日期起", "发布日期止", "政策状态"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
      expect(within(drawer).queryByRole("columnheader", { name: "发布部门" })).not.toBeInTheDocument();
    } else if (kind === "interpretation") {
      for (const label of ["解读标题", "关联政策名称", "发布部门", "发布日期起", "发布日期止"]) expect(within(drawer).getByLabelText(label)).toBeInTheDocument();
      expect(within(drawer).queryByRole("columnheader", { name: "解读类型" })).not.toBeInTheDocument();
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
  it("opens item names and related policy names as new-page links", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const row = screen.getAllByRole("row")[1];
    const links = within(row).getAllByRole("link");
    expect(links).toHaveLength(2);
    const official = DEMO_RECORDS.find(r => r.kind === "item" && r.name === links[0].textContent)!;
    expect(links[0]).toHaveAttribute("href", official.sourceUrl);
    expect(links[1]).toHaveAttribute("href", official.sourceUrl);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
  it("returns from item details and preserves the original list page", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", filters: { department: "科技和产业促进局" }, rows: [] }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    fireEvent.click(screen.getAllByRole("button", { name: "详情" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("共 91 条业务记录")).toBeInTheDocument();
  });
  it("returns from a linked policy to the previous funding record", () => {
    render(<EffectDetailDrawer detail={{ title: "资金明细", kind: "fund", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button", { name: "详情" })[0]);
    const title = within(screen.getAllByRole("dialog").at(-1)!).getByRole("heading").textContent;
    fireEvent.click(screen.getByRole("button", { name: "查看关联政策" }));
    fireEvent.click(within(screen.getAllByRole("dialog").at(-1)!).getByRole("button", { name: "返回上一页" }));
    expect(within(screen.getAllByRole("dialog").at(-1)!).getByRole("heading").textContent).toBe(title);
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
    const name = within(row).getAllByRole("link")[0].textContent;
    fireEvent.click(within(row).getByRole("button", { name: "详情" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: name! })).toBeInTheDocument();
    expect(within(screen.getByRole("status", { name: "申报企业数" })).getByText("3")).toBeInTheDocument();
    expect(within(screen.getByRole("status", { name: "兑现企业数" })).getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "累计兑现金额" })).toHaveTextContent("万元");
    expect(within(screen.getByRole("region", { name: "申报企业明细" })).getAllByRole("row")).toHaveLength(4);
    const enterpriseLinks = within(screen.getByRole("region", { name: "申报企业明细" })).getAllByRole("link");
    expect(enterpriseLinks).toHaveLength(3);
    for (const link of enterpriseLinks) {
      expect(link).toHaveAttribute("href", EXTERNAL_ENTERPRISE_DETAIL);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.queryByRole("region", { name: "兑现记录" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "扶持企业" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("cell", { name: "已拨付", exact: true })).toHaveLength(2);
    expect(screen.queryByRole("cell", { name: "已兑现", exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回上一页" }));
    expect(screen.getByRole("heading", { name: "政策事项明细" })).toBeInTheDocument();
  });
  it("links official policy titles directly to the official original", () => {
    render(<EffectDetailDrawer detail={{ title: "政策发布", kind: "policy", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const official = DEMO_RECORDS.find(r => r.id === "official-policy-bda-xr")!;
    expect(screen.getByRole("link", { name: official.name })).toHaveAttribute("href", official.sourceUrl);
  });
  it("does not display fictional application or payment statistics for official items", () => {
    render(<EffectDetailDrawer detail={{ title: "事项发布", kind: "item", dimension: "范围", rows: [] }} onClose={vi.fn()} />);
    const row = screen.getAllByRole("row")[1];
    fireEvent.click(within(row).getByRole("button", { name: "详情" }));
    expect(screen.getByRole("status", { name: "申报企业数" })).toHaveTextContent("—");
    expect(screen.getByText("暂无申报企业")).toBeInTheDocument();
    expect(screen.queryByText(/MOCK-/)).not.toBeInTheDocument();
  });
});
