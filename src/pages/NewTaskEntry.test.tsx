import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { TaskVersionBoundary } from "@/components/TaskVersionBoundary";
import { recordTaskVersion } from "@/lib/taskVersions";
import PolicyDraftingPage from "./PolicyDraftingPage";
import PolicyPreEvaluationPage from "./PolicyPreEvaluationPage";
import PolicyEvaluation from "./PolicyEvaluation";

function CurrentRoute() {
  const location = useLocation();
  return <div data-testid="route">{location.pathname}{location.search}</div>;
}
beforeEach(() => localStorage.clear());

describe("new task entry", () => {
  it("starts a separate draft instead of the active archived draft", () => {
    localStorage.setItem("policy-draft-active-session", "old-draft");
    localStorage.setItem("policy-draft-session:old-draft", JSON.stringify({ currentStep: 5, maxReachedStep: 5, direction: "旧任务方向", title: "旧任务标题", body: "旧任务正文", archived: true }));
    recordTaskVersion("drafting", { id: "old-draft", title: "旧任务标题", status: "已归档" });
    render(<MemoryRouter initialEntries={["/policy-writing/drafting?new=1"]}><TaskVersionBoundary><PolicyDraftingPage /></TaskVersionBoundary><CurrentRoute /></MemoryRouter>);
    expect(screen.getByLabelText(/确定政策方向/)).not.toHaveValue("旧任务方向");
    expect(screen.queryByText("旧任务正文")).not.toBeInTheDocument();
    expect(screen.getByTestId("route")).not.toHaveTextContent("old-draft");
    expect(screen.getByTestId("route")).toHaveTextContent("taskId=draft-");
    expect(JSON.parse(localStorage.getItem("policy-draft-session:old-draft")!).body).toBe("旧任务正文");
  });

  it.each(["", "?new=1"])("opens the pre-assessment selection page without restoring the latest task (%s)", query => {
    localStorage.setItem("policy-pre-assessment-tasks", JSON.stringify([{ id: "old-pre", title: "旧评估任务", status: "已完成", currentStep: 8, createdAt: "2026-11-17", reportText: "旧评估内容" }]));
    recordTaskVersion("preAssessment", { id: "old-pre", title: "旧评估任务", status: "已归档" });
    render(<MemoryRouter initialEntries={[`/policy-writing/pre-evaluation${query}`]}><TaskVersionBoundary><PolicyPreEvaluationPage /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "选择待评估政策" })).toBeInTheDocument();
    expect(screen.queryByText("旧评估内容")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "版本管理" })).toBeDisabled();
  });

  it("opens policy selection for a new evaluation instead of archived version details", () => {
    recordTaskVersion("evaluation", { id: "old-eval", title: "旧评价任务", status: "已归档" });
    render(<MemoryRouter initialEntries={["/policy-evaluation?new=1"]}><TaskVersionBoundary><PolicyEvaluation /></TaskVersionBoundary></MemoryRouter>);
    expect(screen.queryByText("旧评价任务")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /前往第/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始评估" })).toBeDisabled();
  });
});
