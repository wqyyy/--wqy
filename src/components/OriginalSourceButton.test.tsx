import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OriginalSourceButton } from "./OriginalSourceButton";

describe("original document action", () => {
  it("opens a verified original in a new page with the shared red styling", () => {
    const url = "https://www.beijing.gov.cn/zhengce/zhengcefagui/202603/t20260330_4569992.html";
    render(<OriginalSourceButton url={url} />);
    const link = screen.getByRole("link", { name: "查看原文" });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("text-primary", "bg-primary/5", "border-primary/40");
    expect(link.parentElement).toHaveClass("flex", "w-full", "justify-start");
  });
  it("does not provide a fabricated original link for a missing source", () => {
    render(<OriginalSourceButton />);
    expect(screen.getByRole("button", { name: "查看原文" })).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
