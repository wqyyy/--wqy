import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { archiveTaskVersion, archivedTaskVersion, deleteTaskVersion, editTaskVersion, rerunTaskVersion, saveViewedTaskVersion, taskFromVersion, versionProgress, versionPermissions, versionStatus, readTaskVersions, recordTaskCollection, recordTaskVersion, type TaskKind } from "./taskVersions";
beforeEach(() => localStorage.clear());
afterEach(() => { window.location.hash = ""; });
describe("task version snapshots", () => {
  it("deletes archived snapshots without unlocking other versions or reusing numbers", () => {
    const first = recordTaskVersion("evaluation", { id: "a", title: "第一版", status: "已完成" })!;
    expect(() => deleteTaskVersion("evaluation", "a", first.id)).toThrow("至少保留");
    const second = recordTaskVersion("evaluation", { id: "a", title: "第二版", status: "已完成" })!;
    deleteTaskVersion("evaluation", "a", second.id);
    const third = recordTaskVersion("evaluation", { id: "a", title: "第三版", status: "已完成" })!;
    expect(third.number).toBe(3);
    archiveTaskVersion("evaluation", "a", first.id);
    const remaining = deleteTaskVersion("evaluation", "a", first.id);
    expect(remaining).toHaveLength(1);
    expect(versionPermissions(remaining[0], remaining)).toMatchObject({ edit: false, archive: false, rerun: false });
    expect(() => deleteTaskVersion("evaluation", "a", third.id)).toThrow("至少保留");
    expect(() => archiveTaskVersion("evaluation", "a", third.id)).toThrow("已归档");
  });
  it("reads progress from each snapshot instead of the live drafting session", () => {
    const first = recordTaskVersion("drafting", { id: "p", title: "任务", currentStep: 2 }, { session: { currentStep: 2 } })!;
    const second = recordTaskVersion("drafting", { id: "p", title: "任务", status: "已完成", currentStep: 4 }, { session: { currentStep: 4 } })!;
    localStorage.setItem("policy-draft-session:p", JSON.stringify({ currentStep: 5, body: "最新正文" }));
    expect(versionProgress("drafting", first)).toBe("第 2 / 6 步");
    expect(versionProgress("drafting", second)).toBe("第 4 / 6 步");
    expect(versionProgress("drafting", archiveTaskVersion("drafting", "p", second.id))).toBe("第 6 / 6 步");
  });
  it("removes the duplicate sixth archive while preserving the fifth", () => {
    const fifth = { id: "v5", number: 5, savedAt: "2026-11-16", task: { id: "a", title: "第五版", status: "已归档" } };
    const sixth = { ...fifth, id: "v6", number: 6 };
    localStorage.setItem("task-versions:v1:drafting:a", JSON.stringify([fifth, sixth]));
    expect(deleteTaskVersion("drafting", "a", "v6")).toEqual([expect.objectContaining({ id: "v5", number: 5 })]);
    recordTaskVersion("drafting", { ...fifth.task, title: "归档后保存" });
    expect(readTaskVersions("drafting", "a").map(v => v.number)).toEqual([5]);
  });
  it("loads selected historical data for the original detail page without overwriting the live task", () => {
    const old = recordTaskVersion("evaluation", { id: "a", title: "旧标题", status: "已完成", results: ["旧结果"] })!;
    const current = { id: "a", title: "新标题", status: "已完成", results: ["新结果"] };
    recordTaskVersion("evaluation", current);
    window.location.hash = "/policy-analysis?taskId=a&taskVersion=" + old.id;
    expect(taskFromVersion("evaluation", "a", current)).toMatchObject({ title: "旧标题", results: ["旧结果"] });
    expect(saveViewedTaskVersion("evaluation", [{ ...current, title: "意外自动保存" }])).toBe(true);
    expect(readTaskVersions("evaluation", "a")).toHaveLength(2);
    expect(readTaskVersions("evaluation", "a")[0].task.title).toBe("旧标题");
  });
  it("allows only one archived version per task, including repeated archive calls", () => {
    const first = recordTaskVersion("evaluation", { id: "one", title: "第一版", status: "已完成" })!;
    const second = recordTaskVersion("evaluation", { id: "one", title: "第二版", status: "已完成" })!;
    archiveTaskVersion("evaluation", "one", first.id);
    expect(() => archiveTaskVersion("evaluation", "one", second.id)).toThrow("每个任务只能有一个已归档版本");
    expect(() => archiveTaskVersion("evaluation", "one", first.id)).toThrow("每个任务只能有一个已归档版本");
    editTaskVersion("evaluation", "one", first.id, { ...first.task, title: "修改归档正文" });
    expect(readTaskVersions("evaluation", "one").filter(v => v.task.status === "已归档")).toHaveLength(1);
  });
  it("does not allow editing to bypass the archive confirmation", () => {
    const first = recordTaskVersion("evaluation", { id: "one", title: "第一版", status: "已完成" })!;
    expect(() => editTaskVersion("evaluation", "one", first.id, { ...first.task, status: "已归档" })).toThrow("请通过归档操作");
    expect(readTaskVersions("evaluation", "one")[0].task.status).toBe("已完成");
  });
  it("enforces the success, failure and stopped operation matrix before and after archival", () => {
    const success = recordTaskVersion("evaluation", { id: "a", title: "成功版本", status: "已完成" })!;
    const failed = recordTaskVersion("evaluation", { id: "a", title: "失败版本", status: "失败", error: "调用超时" })!;
    const stopped = recordTaskVersion("evaluation", { id: "a", title: "停止版本", stopped: true, status: "进行中" })!;
    let versions = readTaskVersions("evaluation", "a");
    expect(versionStatus(stopped)).toBe("已停止");
    expect(versionPermissions(success, versions)).toMatchObject({ edit: true, download: true, archive: true, rerun: true });
    for (const version of [failed, stopped]) expect(versionPermissions(version, versions)).toMatchObject({ view: true, edit: false, download: false, archive: false, rerun: true });
    archiveTaskVersion("evaluation", "a", success.id);
    versions = readTaskVersions("evaluation", "a");
    expect(versionPermissions(versions[0], versions)).toMatchObject({ edit: true, download: true, archive: false, rerun: false });
    for (const version of versions.slice(1)) {
      expect(versionPermissions(version, versions)).toMatchObject({ edit: false, archive: false, rerun: false });
      expect(() => rerunTaskVersion("evaluation", "a", version.id)).toThrow();
      expect(() => editTaskVersion("evaluation", "a", version.id, version.task)).toThrow();
    }
    const edited = editTaskVersion("evaluation", "a", success.id, { ...success.task, title: "已编辑的归档版本" });
    expect(edited.task.status).toBe("已归档");
    expect(edited.createdAt).toBe(success.createdAt);
    expect(readTaskVersions("evaluation", "a")).toHaveLength(3);
  });
  it("reruns from selected saved inputs without changing the source version", () => {
    const old = recordTaskVersion("compare", { id: "a", title: "版本一", status: "已完成", snapshot: { clauses: [{ content: "旧条款" }], results: ["旧结果"] } })!;
    recordTaskVersion("compare", { id: "a", title: "版本二", status: "已完成", snapshot: { clauses: [{ content: "新条款" }], results: ["新结果"] } });
    rerunTaskVersion("compare", "a", old.id);
    const task = JSON.parse(localStorage.getItem("policy-compare-analysis-tasks")!)[0];
    expect(task.snapshot).toEqual({ clauses: [{ content: "旧条款" }], results: [] });
    expect(task.status).toBe("分析中");
    expect(task.sourceVersionId).toBe(old.id);
    expect(readTaskVersions("compare", "a")[0]).toMatchObject({ task: { snapshot: { results: ["旧结果"] } } });
  });
  it.each(["drafting", "compare", "funding", "preAssessment", "evaluation", "report"] as TaskKind[])("captures immutable versions for %s without duplicating timestamp-only saves", kind => {
    const first = { id: "task", title: "任务", status: "进行中", updatedAt: "a", results: ["旧结果"] };
    recordTaskVersion(kind, first);
    recordTaskVersion(kind, { ...first, updatedAt: "b" });
    expect(readTaskVersions(kind, first.id)).toHaveLength(1);
    recordTaskVersion(kind, { ...first, results: ["新结果"] });
    const versions = readTaskVersions(kind, first.id);
    expect(versions).toHaveLength(2);
    expect(versions[0].task).toMatchObject({ results: ["旧结果"] });
    expect(versions[1].task).toMatchObject({ results: ["新结果"] });
    expect(versions.map(v => v.number)).toEqual([1, 2]);
  });
  it("preserves pre-edit data on first collection save and ignores unchanged siblings", () => {
    const first = { id: "a", title: "旧标题" }, sibling = { id: "b", title: "其他任务" };
    localStorage.setItem("tasks", JSON.stringify([first, sibling]));
    recordTaskCollection("compare", "tasks", [{ ...first, title: "新标题" }, sibling]);
    expect(readTaskVersions("compare", "a").map(v => v.task.title)).toEqual(["旧标题", "新标题"]);
    expect(readTaskVersions("compare", "b")).toEqual([]);
    expect(JSON.parse(localStorage.getItem("tasks")!)[0].title).toBe("旧标题");
  });
  it("isolates task types and IDs and finds the archived version", () => {
    recordTaskVersion("evaluation", { id: "a", title: "版本一", status: "进行中" });
    recordTaskVersion("evaluation", { id: "a", title: "版本二", status: "已归档" });
    recordTaskVersion("evaluation", { id: "a", title: "版本三", status: "进行中" });
    expect(archivedTaskVersion(readTaskVersions("evaluation", "a"))?.number).toBe(2);
    expect(readTaskVersions("compare", "a")).toEqual([]);
    expect(readTaskVersions("evaluation", "b")).toEqual([]);
  });
  it("saves independent drafting text and keeps it after the current session changes", () => {
    localStorage.setItem("policy-draft-session:a", JSON.stringify({ body: "旧正文", currentStep: 5 }));
    recordTaskVersion("drafting", { id: "a", title: "草稿" });
    localStorage.setItem("policy-draft-session:a", JSON.stringify({ body: "新正文", currentStep: 5 }));
    recordTaskVersion("drafting", { id: "a", title: "草稿" });
    expect(readTaskVersions("drafting", "a")[0].extra?.session).toMatchObject({ body: "旧正文" });
  });
});
