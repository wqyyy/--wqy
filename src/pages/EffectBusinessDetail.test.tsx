import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DEMO_RECORDS, effectRecordHref } from "@/lib/effectDrilldown";
import EffectBusinessDetail from "./EffectBusinessDetail";

function openDetail(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/effect-detail/:kind/:id" element={<EffectBusinessDetail />} /></Routes></MemoryRouter>);
}
describe("standalone effect business details", () => {
  const item = DEMO_RECORDS.find(r => r.kind === "item")!;
  const policy = DEMO_RECORDS.find(r => r.id === item.policyId)!;
  it("loads item content by URL without needing the source drawer", () => {
    openDetail(`/effect-detail/item/${item.id}`);
    expect(screen.getByRole("heading", { level: 1, name: item.name })).toBeInTheDocument();
    expect(screen.getByText(item.standard!)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: policy.name })).toHaveAttribute("href", effectRecordHref("policy", policy.id));
  });
  it("loads the corresponding policy and its related item", () => {
    openDetail(`/effect-detail/policy/${policy.id}`);
    expect(screen.getByRole("heading", { level: 1, name: policy.name })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "政策正文" }).nextElementSibling).toHaveTextContent(policy.content!.replace(/\s+/g, " "));
    expect(screen.getByRole("link", { name: item.name })).toHaveAttribute("href", effectRecordHref("item", item.id));
  });
  it("shows a missing-record state for invalid URLs", () => {
    openDetail("/effect-detail/item/missing-record");
    expect(screen.getByRole("heading", { name: "未找到事项详情" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "兑现效果看板" })).toBeInTheDocument();
  });
});
