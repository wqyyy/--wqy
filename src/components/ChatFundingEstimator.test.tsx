import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatFundingEstimator } from "./ChatFundingEstimator";
describe("chat funding estimates", () => {
  it("requires actual amounts and eligibility before displaying a total", () => {
    render(<ChatFundingEstimator onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("政策资金条款"), { target: { value: "按30%给予补贴，最高100万元。" } });
    fireEvent.click(screen.getByRole("button", { name: "解析资金条款" }));
    expect(screen.getByText(/预计总支持金额/)).toHaveTextContent("待全部事项");
    fireEvent.change(screen.getByLabelText("事项1实际金额"), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText(/预计总支持金额/)).toHaveTextContent("30000 元");
  });
});
