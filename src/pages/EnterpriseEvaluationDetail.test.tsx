import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EnterpriseEvaluationDetail from "./EnterpriseEvaluationDetail";
import { defaultScoringCriteria, defaultScoringResults } from "@/data/enterpriseEvaluationData";

beforeEach(() => localStorage.clear());
function open(id: string) {
  return render(<MemoryRouter initialEntries={[`/evaluation/${id}`]}><Routes><Route path="/evaluation/:id" element={<EnterpriseEvaluationDetail />} /></Routes></MemoryRouter>);
}
describe("enterprise evaluation progress", () => {
  it("displays second-level scoring rules and original-file actions", () => {
    localStorage.setItem("enterprise-evaluation-archive:a", JSON.stringify({ criteria: defaultScoringCriteria, results: defaultScoringResults }));
    open("a");
    fireEvent.click(screen.getAllByRole("button", { name: "评分详情" })[0]);
    const count = defaultScoringCriteria.indicators.flatMap(indicator => indicator.children).length;
    expect(screen.getAllByText("评分标准：")).toHaveLength(count);
    expect(screen.getAllByRole("button", { name: "查看原文件" })).toHaveLength(count);
    expect(document.getElementById("scoring-modal")?.textContent).toContain(defaultScoringCriteria.indicators[0].children[0].rules);
  });
  it("restores the file per item and clears it before opening the replacement picker", () => {
    localStorage.setItem("enterprise-evaluation-progress:a", JSON.stringify({ criteriaUploaded: true, criteriaParsed: true, criteriaConfirmed: false, scoringCompleted: false, scoringInProgress: false, archived: false, uploadedFile: { name: "原标准.docx", size: "20 KB" }, criteria: defaultScoringCriteria, results: defaultScoringResults, scoringProgress: { index: 0, total: 0, name: "" } }));
    const view = open("a");
    fireEvent.click(screen.getByRole("button", { name: "上传标准" }));
    expect(screen.getByText("原标准.docx")).toBeInTheDocument();
    const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const picker = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "重新上传" }));
    expect(picker).toHaveBeenCalledOnce();
    expect(screen.queryByText("原标准.docx")).not.toBeInTheDocument();
    expect(input.value).toBe("");
    view.unmount();
    open("b");
    expect(screen.queryByText("原标准.docx")).not.toBeInTheDocument();
  });
});
