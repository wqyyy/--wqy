import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PolicyCompareAnalysisTaskList from "./PolicyCompareAnalysisTaskList";
import PolicyEstimationTaskList from "./PolicyEstimationTaskList";
import PolicyDraftingTaskList from "./PolicyDraftingTaskList";
import PolicyPreAssessmentTaskList from "./PolicyPreAssessmentTaskList";
import PolicyEvaluationTaskList from "./PolicyEvaluationTaskList";
import { loadPolicyCompareAnalysisTasks, savePolicyCompareAnalysisTasks } from "@/lib/policyCompareAnalysisTasks";
import { TaskListSearchBar } from "@/components/TaskListSearchBar";

beforeEach(() => localStorage.clear());

describe("history task status filters", () => {
  it.each([
    ["对比分析", PolicyCompareAnalysisTaskList, "已分析完成"],
    ["政策测算", PolicyEstimationTaskList, "已完成"],
    ["政策起草", PolicyDraftingTaskList, "生成中"],
    ["政策前评估", PolicyPreAssessmentTaskList, "进行中"],
    ["政策评价", PolicyEvaluationTaskList, "进行中"],
  ] as const)("filters %s with keywords and resets both controls", (_, Page, status) => {
    render(<MemoryRouter><Page /></MemoryRouter>);
    const initialCount = screen.getAllByRole("heading", { level: 3 }).length;
    fireEvent.change(screen.getByLabelText("任务状态"), { target: { value: status } });
    const titles = screen.getAllByRole("heading", { level: 3 });
    for (const title of titles) expect(within(title.closest('[role="button"]')!).getByText(status)).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: titles[0].textContent } });
    fireEvent.click(screen.getByRole("button", { name: "查询", exact: true }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(screen.getByLabelText("任务状态")).toHaveValue(status);
    fireEvent.change(input, { target: { value: "无匹配的任务名称xyz" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重置", exact: true }));
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("任务状态")).toHaveValue("");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(initialCount);
  });

  it("returns to page one when status changes, even if multiple pages remain", () => {
    const base = loadPolicyCompareAnalysisTasks()[0];
    savePolicyCompareAnalysisTasks(Array.from({ length: 30 }, (_, index) => ({ ...base, id: `status-test-${index}`, title: `测试任务${index}`, status: index < 20 ? "已分析完成" : "已创建", currentStep: index < 20 ? 3 : 1 })));
    render(<MemoryRouter><PolicyCompareAnalysisTaskList /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByRole("button", { name: "上一页" })).toBeEnabled();
    fireEvent.change(screen.getByLabelText("任务状态"), { target: { value: "已分析完成" } });
    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();
    expect(screen.getByText("共 20 条")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("任务状态"), { target: { value: "分析中" } });
    expect(screen.queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText("暂无匹配的历史对比分析任务")).toBeInTheDocument();
  });

  it("does not add a status selector to other callers without opting in", () => {
    render(<TaskListSearchBar value="" onChange={() => {}} onSearch={() => {}} onReset={() => {}} placeholder="搜索" />);
    expect(screen.queryByLabelText("任务状态")).not.toBeInTheDocument();
  });
});
