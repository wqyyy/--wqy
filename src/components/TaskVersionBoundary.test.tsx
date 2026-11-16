import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TaskHistoryButton, TaskVersionNotice, TaskVersionBoundary } from "./TaskVersionBoundary";
import { archiveTaskVersion, readTaskVersions, recordTaskVersion } from "@/lib/taskVersions";
import type { TaskKind } from "@/lib/taskVersions";
import { useTaskVersionView } from "@/lib/taskVersionView";
import { Input } from "./ui/input";
beforeEach(() => localStorage.clear());
function OriginalDetail() {
  const view = useTaskVersionView();
  return <div data-testid="original-detail"><h1>{view.version?.task.title ?? "当前任务"}</h1><p>{view.version?.extra?.content as string}</p><p>{(view.version?.extra?.results as string[] | undefined)?.join("\n")}</p><Input aria-label="最新内容" defaultValue="可以编辑" /></div>;
}
function show(search: string) {
  return render(<MemoryRouter initialEntries={[`/policy-analysis?mode=evaluation&taskId=a${search}`]}><TaskVersionBoundary><OriginalDetail /><TaskVersionNotice /><TaskHistoryButton /></TaskVersionBoundary></MemoryRouter>);
}
describe("task version entry", () => {
  it.each([
    ["preAssessment", "/policy-writing/pre-evaluation?taskId=a"],
    ["evaluation", "/policy-analysis?mode=evaluation&taskId=a"],
  ])("allows editing only the archived version and prevents every rerun in %s", (kind, route) => {
    recordTaskVersion(kind as TaskKind, { id: "a", title: "成功旧版", status: "已完成" });
    recordTaskVersion(kind as TaskKind, { id: "a", title: "失败旧版", status: "失败", error: "执行超时" });
    const current = recordTaskVersion(kind as TaskKind, { id: "a", title: "归档版", status: "已完成" })!;
    const archived = archiveTaskVersion(kind as TaskKind, "a", current.id);
    render(<MemoryRouter initialEntries={[`${route}&taskVersion=${archived.id}`]}><TaskVersionBoundary><OriginalDetail /><TaskHistoryButton /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.getByLabelText("最新内容")).not.toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.queryByRole("button", { name: "编辑", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载", exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "归档", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "基于此版本重跑" })).not.toBeInTheDocument();
  });
  it.each([
    ["preAssessment", "/policy-writing/pre-evaluation?taskId=a"],
    ["evaluation", "/policy-analysis?mode=evaluation&taskId=a"],
  ])("places the %s archive notice locally and removes the version download", (kind, route) => {
    const old = recordTaskVersion(kind as TaskKind, { id: "a", title: "旧版本", status: "已完成" })!;
    const latest = recordTaskVersion(kind as TaskKind, { id: "a", title: "新版本", status: "已完成" })!;
    archiveTaskVersion(kind as TaskKind, "a", latest.id);
    render(<MemoryRouter initialEntries={[`${route}&taskVersion=${old.id}`]}><TaskVersionBoundary><div data-testid="flow">评估流程</div><div data-testid="local-notice"><TaskVersionNotice /></div><OriginalDetail /><TaskHistoryButton /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "下载此版本" })).not.toBeInTheDocument();
    expect(screen.queryByText(/第\s*1\s*版\s*·\s*版本详情/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByTestId("local-notice")).toContainElement(screen.getByRole("status"));
    expect(screen.getByRole("button", { name: "前往第2版" })).toBeInTheDocument();
  });
  it.each([
    ["preAssessment", "/policy-writing/pre-evaluation?taskId=a"],
    ["evaluation", "/policy-analysis?mode=evaluation&taskId=a"],
  ])("shows only detail and delete actions before archival in %s", (kind, route) => {
    recordTaskVersion(kind as TaskKind, { id: "a", title: "成功版本", status: "已完成" });
    recordTaskVersion(kind as TaskKind, { id: "a", title: "失败版本", status: "失败" });
    render(<MemoryRouter initialEntries={[route]}><TaskVersionBoundary><OriginalDetail /><TaskHistoryButton /></TaskVersionBoundary></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.queryByRole("button", { name: "归档", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "基于此版本重跑" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "编辑", exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "查看详情" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "下载", exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "删除", exact: true })).toHaveLength(2);
  });
  it.each([
    ["compare", "/policy-analysis?mode=compare&taskId=a"],
    ["funding", "/policy-writing/model-estimation?taskId=a"],
  ])("hides the version entry for %s without removing detail content", (kind, route) => {
    recordTaskVersion(kind as TaskKind, { id: "a", title: "任务", status: "进行中" });
    render(<MemoryRouter initialEntries={[route]}><TaskVersionBoundary><OriginalDetail /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "版本管理" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "历史版本" })).not.toBeInTheDocument();
    expect(screen.getByTestId("original-detail")).toBeInTheDocument();
  });
  it("deletes a historical version only after confirmation", () => {
    recordTaskVersion("evaluation", { id: "a", title: "第一版", status: "已完成" });
    recordTaskVersion("evaluation", { id: "a", title: "第二版", status: "已完成" });
    show("");
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.queryByRole("button", { name: "下载", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "编辑", exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "删除" })[0]);
    expect(screen.getByRole("alertdialog")).toHaveTextContent("删除后无法恢复");
    expect(readTaskVersions("evaluation", "a")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(readTaskVersions("evaluation", "a")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "删除" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));
    expect(readTaskVersions("evaluation", "a")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
  });
  it("keeps archived drafting in its original page while other versions stay read-only", () => {
    const old = recordTaskVersion("drafting", { id: "a", title: "起草任务", status: "已完成" }, { session: { body: "归档正文", currentStep: 5 } })!;
    const archived = archiveTaskVersion("drafting", "a", old.id);
    render(<MemoryRouter initialEntries={[`/policy-writing/drafting?taskId=a&taskVersion=${archived.id}`]}><TaskVersionBoundary><div>原起草编辑页面</div><TaskHistoryButton /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.getByText("原起草编辑页面")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("创建时间");
    expect(dialog).toHaveTextContent("修改时间");
    expect(dialog).toHaveTextContent("已归档");
    expect(screen.queryByRole("button", { name: "编辑" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "基于此版本重跑" })).not.toBeInTheDocument();
  });
  it("places the drafting history entry in the local action row without a duplicate toolbar", () => {
    recordTaskVersion("drafting", { id: "a", title: "起草任务", status: "已完成" });
    render(<MemoryRouter initialEntries={["/policy-writing/drafting?taskId=a"]}><TaskVersionBoundary><div aria-label="起草操作"><TaskHistoryButton /></div></TaskVersionBoundary></MemoryRouter>);
    expect(screen.getAllByRole("button", { name: "版本管理" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("第 1 版");
  });
  it.each([
    ["drafting", "/policy-writing/drafting?taskId=a"],
    ["compare", "/policy-analysis?mode=compare&taskId=a"],
    ["funding", "/policy-writing/model-estimation?taskId=a"],
    ["preAssessment", "/policy-writing/pre-evaluation?taskId=a"],
    ["evaluation", "/policy-analysis?taskId=a"],
    ["report", "/policy-report/a?"],
  ])("reloads saved content on the %s detail route", (kind, route) => {
    const version = recordTaskVersion(kind as TaskKind, { id: "a", title: "已保存版本", status: "进行中" }, { content: "该版本独立内容" })!;
    render(<MemoryRouter initialEntries={[`${route}&taskVersion=${version.id}`]}><TaskVersionBoundary><OriginalDetail /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.getByText("该版本独立内容")).toBeInTheDocument();
    expect(screen.getByTestId("original-detail")).toBeInTheDocument();
    expect(screen.getByLabelText("最新内容")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "返回最新版本" })).not.toBeInTheDocument();
  });
  it("shows history and keeps current editing available before archival", () => {
    recordTaskVersion("evaluation", { id: "a", title: "任务", status: "进行中" });
    show("");
    expect(screen.getByLabelText("最新内容")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("第 1 版");
  });
  it("renders the chosen version using the original detail component in read-only mode", () => {
    const old = recordTaskVersion("evaluation", { id: "a", title: "旧版本任务", status: "已完成" }, { results: ["仅此旧结果"] })!;
    recordTaskVersion("evaluation", { id: "a", title: "最新任务", status: "进行中" }, { results: ["最新结果"] });
    show(`&taskVersion=${old.id}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("旧版本任务");
    expect(screen.getByText("仅此旧结果")).toBeInTheDocument();
    expect(screen.getByLabelText("最新内容")).toHaveAttribute("readonly");
    expect(screen.queryByText("最新结果")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下载此版本" })).not.toBeInTheDocument();
  });
  it("shows the archived-version warning and locks another version", () => {
    const old = recordTaskVersion("evaluation", { id: "a", title: "版本一", status: "进行中" })!;
    recordTaskVersion("evaluation", { id: "a", title: "版本二", status: "已归档" });
    show(`&taskVersion=${old.id}`);
    expect(screen.getByRole("status")).toHaveTextContent("该任务的第2版已归档，当前版本仅支持查看和下载。如需继续编辑，请前往已归档版本进行操作。");
    expect(screen.getByRole("button", { name: "前往第2版" })).toBeInTheDocument();
    expect(screen.getByLabelText("最新内容")).toHaveAttribute("readonly");
  });
});
