import { afterEach, describe, expect, it } from "vitest";
import { compareAnalysisTaskStatus, loadPolicyCompareAnalysisTasks } from "./policyCompareAnalysisTasks";

afterEach(() => localStorage.clear());
describe("comparison task statuses", () => {
  it("maps the four lifecycle states", () => {
    expect(compareAnalysisTaskStatus(false, false, false)).toBe("已创建");
    expect(compareAnalysisTaskStatus(false, true, false)).toBe("分析中");
    expect(compareAnalysisTaskStatus(false, false, true)).toBe("已分析完成");
    expect(compareAnalysisTaskStatus(true, false, true)).toBe("已归档");
  });
  it("prioritizes active analysis over old completed results", () => {
    expect(compareAnalysisTaskStatus(false, true, true)).toBe("分析中");
  });
  it("migrates legacy status values", () => {
    localStorage.setItem("policy-compare-analysis-tasks", JSON.stringify([
      { id: "created", status: "进行中", currentStep: 2 },
      { id: "analyzing", status: "进行中", currentStep: 3, snapshot: { results: [] } },
      { id: "completed", status: "已完成" },
      { id: "archived", status: "进行中", archived: true },
      { id: "failed", status: "失败" },
    ]));
    expect(loadPolicyCompareAnalysisTasks().map(task => task.status)).toEqual(["已创建", "分析中", "已分析完成", "已归档", "已创建"]);
  });
});
