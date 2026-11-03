import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArchiveConfirmButton } from "./ArchiveConfirmButton";

describe("archive confirmation", () => {
  it("requires confirmation and does nothing when cancelled", () => {
    const archive = vi.fn();
    render(<ArchiveConfirmButton onConfirm={archive}>归档</ArchiveConfirmButton>);
    fireEvent.click(screen.getByRole("button", { name: "归档", exact: true }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("归档后，任务中间过程将不可修改，且无法取消归档。请确认是否归档？");
    expect(archive).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(archive).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "归档", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "确认归档" }));
    expect(archive).toHaveBeenCalledTimes(1);
  });

  it("does not archive when dismissed with Escape", () => {
    const archive = vi.fn();
    render(<ArchiveConfirmButton onConfirm={archive}>归档</ArchiveConfirmButton>);
    fireEvent.click(screen.getByRole("button", { name: "归档", exact: true }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(archive).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("preserves the disabled archived state", () => {
    const archive = vi.fn();
    render(<ArchiveConfirmButton disabled onConfirm={archive}>已归档</ArchiveConfirmButton>);
    fireEvent.click(screen.getByRole("button", { name: "已归档" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(archive).not.toHaveBeenCalled();
  });
});
