import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickDraftProgress } from "./QuickDraftProgress";

vi.mock("@/lib/policyDraftApi", () => ({
  searchPolicies: vi.fn(() => new Promise(() => {})),
  analyzePolicies: vi.fn(),
  generateCoreElementsFromPolicies: vi.fn(),
  generateOutline: vi.fn(),
}));

describe("quick drafting step labels", () => {
  it("uses the same four labels as the drafting flow", () => {
    render(<QuickDraftProgress policyTitle="测试政策" coreElements="" onComplete={vi.fn()} />);
    for (const label of ["检索相似政策", "生成核心要素", "生成政策大纲", "生成政策正文"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    for (const label of ["政策检索", "核心要素生成", "政策编辑"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
