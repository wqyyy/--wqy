import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PolicyAnalysis from "./PolicyAnalysis";
import { getPolicyEvaluationTaskById, loadPolicyEvaluationTasks, resolveEvaluationEntryFromTask, savePolicyEvaluationTasks } from "@/lib/policyEvaluationTasks";

function openFlow() {
  return render(<MemoryRouter initialEntries={["/policy-analysis?policy=评价测试&taskId=test-eval"]}><PolicyAnalysis /></MemoryRouter>);
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollBy = vi.fn();
});
afterEach(() => { vi.useRealTimers(); });

describe("policy evaluation workflow", () => {
  it("locks pending nodes, completes in order and collapses finished thinking", async () => {
    openFlow();
    expect(screen.getByRole("button", { name: "内容逐条分析" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "归档" })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(screen.getByRole("button", { name: "整体情况分析" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "内容逐条分析" })).toHaveAttribute("aria-current", "step");
    const headers = screen.getAllByRole("button", { name: /整体情况分析/ });
    expect(headers.find(button => button.hasAttribute("aria-expanded"))).toHaveAttribute("aria-expanded", "false");
    expect(getPolicyEvaluationTaskById("test-eval")?.completedCount).toBe(1);
  });

  it("retains edited results when switching completed steps and reopening", async () => {
    const first = openFlow();
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(screen.getAllByRole("button", { name: "归档" }).at(-1)).toHaveClass("h-11", "flex-1", "gov-gradient", "hover:opacity-90");
    fireEvent.change(screen.getByRole("textbox", { name: "整体情况分析分析结果" }), { target: { value: "已保存的修改结果" } });
    fireEvent.click(screen.getByRole("button", { name: "整体情况分析" }));
    fireEvent.click(screen.getByRole("button", { name: "优化建议分析" }));
    expect(screen.getByRole("textbox", { name: "整体情况分析分析结果" })).toHaveValue("已保存的修改结果");
    first.unmount();
    openFlow();
    expect(screen.getByRole("textbox", { name: "整体情况分析分析结果" })).toHaveValue("已保存的修改结果");
    expect(getPolicyEvaluationTaskById("test-eval")?.completedCount).toBe(5);
  });

  it("archives only a complete task and keeps every node green and read-only", async () => {
    const first = openFlow();
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    fireEvent.click(screen.getAllByRole("button", { name: "归档" }).at(-1)!);
    expect(getPolicyEvaluationTaskById("test-eval")?.status).not.toBe("已归档");
    expect(screen.getByRole("alertdialog")).toHaveTextContent("归档后，任务中间过程将不可修改，且无法取消归档。请确认是否归档？");
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(getPolicyEvaluationTaskById("test-eval")?.status).not.toBe("已归档");
    fireEvent.click(screen.getAllByRole("button", { name: "归档" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: "确认归档" }));
    const saved = getPolicyEvaluationTaskById("test-eval")!;
    expect(saved.status).toBe("已归档");
    expect(saved.currentStep).toBe(6);
    expect(resolveEvaluationEntryFromTask(saved).directFinal).toBe(true);
    expect(screen.getAllByRole("textbox").every(input => input.hasAttribute("readonly"))).toBe(true);
    expect(screen.queryByRole("button", { name: "重新生成" })).not.toBeInTheDocument();
    expect(document.querySelectorAll("[aria-current=step]")).toHaveLength(0);
    first.unmount();
    openFlow();
    expect(screen.getByText("评价任务已归档")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已归档" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "已归档" })).toHaveClass("h-11", "flex-1", "bg-gray-100");
    expect(screen.getAllByRole("textbox").every(input => input.hasAttribute("readonly"))).toBe(true);
  });

  it("resumes unfinished generation without losing earlier edits", async () => {
    const first = openFlow();
    await act(async () => { await vi.advanceTimersByTimeAsync(2300); });
    fireEvent.change(screen.getByRole("textbox", { name: "整体情况分析分析结果" }), { target: { value: "继续生成时保留" } });
    fireEvent.click(screen.getByRole("button", { name: "整体情况分析" }));
    first.unmount();
    openFlow();
    expect(screen.getByRole("textbox", { name: "整体情况分析分析结果" })).toHaveValue("继续生成时保留");
    expect(screen.getByRole("button", { name: "实施效果分析" })).toHaveAttribute("aria-current", "step");
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(getPolicyEvaluationTaskById("test-eval")?.completedCount).toBe(3);
    expect(screen.getByRole("textbox", { name: "整体情况分析分析结果" })).toHaveValue("继续生成时保留");
  });

  it("pauses auto-follow on manual scrolling and can resume it", async () => {
    openFlow();
    const scrollContainer = document.querySelector(".h-full.min-h-0.w-full")!;
    fireEvent.wheel(scrollContainer);
    const scrollTo = HTMLElement.prototype.scrollTo;
    vi.mocked(scrollTo).mockClear();
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    expect(scrollTo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "跟随生成进度" }));
    expect(scrollTo).toHaveBeenCalled();
  });

  it("does not treat a stopped task or its pending steps as completed", async () => {
    openFlow();
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    fireEvent.click(screen.getByRole("button", { name: "停止生成" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(getPolicyEvaluationTaskById("test-eval")?.completedCount).toBe(1);
    expect(screen.getByRole("button", { name: "归档" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "存在问题分析" })).toBeDisabled();
  });

  it("keeps an empty task list empty and resumes a fifth-step task rather than treating it as complete", () => {
    savePolicyEvaluationTasks([]);
    expect(loadPolicyEvaluationTasks()).toEqual([]);
    expect(resolveEvaluationEntryFromTask({ id: "last-step", title: "测试", department: "", domain: "", status: "进行中", currentStep: 5, createdAt: "", updatedAt: "" }).directFinal).toBe(false);
  });
});
