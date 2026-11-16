import { afterEach, describe, expect, it } from "vitest";
import { draftingTaskProgress, taskProgressStep } from "./taskProgress";
import { POLICY_DRAFTING_TASKS } from "./policyDraftingTasks";

afterEach(() => localStorage.clear());
describe("saved task progress", () => {
  it("uses actual steps even when revisiting a completed task", () => {
    expect(taskProgressStep({ currentStep: 2, status: "已完成" }, 8)).toBe(2);
    expect(taskProgressStep({ currentStep: 5, status: "已归档" }, 8)).toBe(8);
    expect(taskProgressStep({ currentStep: 0, status: "进行中" }, 6)).toBe(1);
    expect(taskProgressStep({ currentStep: 99, status: "进行中" }, 6)).toBe(6);
  });
  it("reads drafting progress from its session, not a stale task card", () => {
    const task = { ...POLICY_DRAFTING_TASKS[0], status: "生成中" as const };
    localStorage.setItem(`policy-draft-session:${task.id}`, JSON.stringify({ currentStep: 2, maxReachedStep: 5, body: "正文" }));
    expect(draftingTaskProgress(task)).toBe(2);
    localStorage.setItem(`policy-draft-session:${task.id}`, JSON.stringify({ currentStep: 5, body: "正文" }));
    expect(draftingTaskProgress(task)).toBe(6);
    expect(draftingTaskProgress({ ...task, status: "已归档" })).toBe(6);
  });
  it("falls back safely when a session cannot be parsed", () => {
    const task = { ...POLICY_DRAFTING_TASKS[0], currentStep: 3 };
    localStorage.setItem(`policy-draft-session:${task.id}`, "invalid");
    expect(draftingTaskProgress(task)).toBe(3);
  });
});
