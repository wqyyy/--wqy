import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import EffectEnterpriseApplications from "./EffectEnterpriseApplications";
import { EXTERNAL_ENTERPRISE_DETAIL } from "@/lib/fundingEstimation";
import { DEMO_APPLICATIONS, DEMO_RECORDS, effectEnterpriseApplicationsHref } from "@/lib/effectDrilldown";

function openPage(creditCode: string) {
  return render(<MemoryRouter initialEntries={[`/effect-enterprise-applications/${encodeURIComponent(creditCode)}`]}><Routes><Route path="/effect-enterprise-applications/:creditCode" element={<EffectEnterpriseApplications />} /></Routes></MemoryRouter>);
}

describe("enterprise application history", () => {
  it("loads only the selected enterprise's records from the URL, including on refresh", () => {
    const application = DEMO_APPLICATIONS.find(r => !r.creditCode.startsWith("MOCK-APP-") && DEMO_APPLICATIONS.filter(a => a.creditCode === r.creditCode).length > 1)!;
    const expected = DEMO_APPLICATIONS.filter(r => r.creditCode === application.creditCode);
    const view = openPage(application.creditCode);
    const summary = screen.getByRole("status", { name: "企业申报数量统计" });
    const title = screen.getByRole("heading", { name: "企业申报明细" });
    const company = screen.getByRole("heading", { name: application.enterpriseName });
    expect(title.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary.compareDocumentPosition(company) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary).toHaveClass("border-l-4", "border-primary", "bg-red-50");
    expect(within(summary).getByText(expected.length.toLocaleString("zh-CN"))).toHaveClass("text-4xl", "text-primary");
    expect(screen.getByRole("heading", { name: application.enterpriseName })).toBeInTheDocument();
    const detailLink = screen.getByRole("link", { name: "查看企业详情" });
    expect(detailLink).toHaveAttribute("href", EXTERNAL_ENTERPRISE_DETAIL);
    expect(detailLink).toHaveAttribute("target", "_blank");
    expect(detailLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(`统一社会信用代码：${application.creditCode}`)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(Math.min(20, expected.length) + 1);
    for (const row of screen.getAllByRole("row").slice(1)) {
      const itemLink = within(row).getAllByRole("button")[0];
      const item = DEMO_RECORDS.find(r => r.kind === "item" && r.name === itemLink.textContent)!;
      expect(expected.some(r => r.itemId === item.id)).toBe(true);
      expect(itemLink).not.toHaveAttribute("href");
      const payments = DEMO_RECORDS.filter(r => r.kind === "fund" && r.itemId === item.id && r.creditCode === application.creditCode && r.status === "已拨付");
      const cells = within(row).getAllByRole("cell");
      expect(within(cells[0]).getByRole("button", { name: "查看原文" })).toBeDisabled();
      expect(within(cells[1]).getByRole("button", { name: "查看原文" })).toBeDisabled();
      expect(cells[6]).toHaveTextContent(payments.reduce((sum, r) => sum + (r.amount ?? 0), 0).toFixed(2));
      for (const payment of payments) if (payment.date) {
        expect(cells[7]).toHaveTextContent(payment.date);
        expect(cells[8]).toHaveTextContent(payment.date);
      }
    }
    view.unmount();
    openPage(application.creditCode);
    expect(screen.getByRole("heading", { name: application.enterpriseName })).toBeInTheDocument();
  });

  it("supports applicants without any payment or enterprise archive", () => {
    const applicant = DEMO_APPLICATIONS.find(r => r.creditCode.startsWith("MOCK-APP-"))!;
    openPage(applicant.creditCode);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("cell", { name: "审核中" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "未兑现" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "0.00" })).toBeInTheDocument();
    expect(effectEnterpriseApplicationsHref(applicant.creditCode)).toBe(`#/effect-enterprise-applications/${encodeURIComponent(applicant.creditCode)}`);
  });

  it("does not show other enterprises when the URL does not match", () => {
    openPage("unknown-company");
    expect(screen.getByText("未找到该企业的申报记录")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看企业详情" })).not.toBeInTheDocument();
  });
});
