import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DraftFlowSteps } from "./DraftFlowSteps";

afterEach(cleanup);
const iconClass = (name: string) => screen.getByRole("button", { name }).querySelector("span")!.className;

describe("draft flow node states", () => {
  it("keeps completed later steps green when revisiting an earlier step", () => {
    render(<DraftFlowSteps current={2} maximum={4} completedSteps={[4]} bodyReady={false} archived={false} onSelect={() => {}} />);
    expect(iconClass("检索相似政策")).toContain("bg-primary");
    expect(iconClass("确定政策方向")).toContain("text-emerald-600");
    expect(iconClass("生成核心要素")).toContain("text-emerald-600");
    expect(iconClass("生成政策大纲")).toContain("text-emerald-600");
    expect(iconClass("生成政策正文")).toContain("text-muted-foreground");
    expect(iconClass("归档")).toContain("text-muted-foreground");
  });
  it("clears downstream completion when regeneration resets progress", () => {
    render(<DraftFlowSteps current={3} maximum={3} bodyReady={false} archived={false} onSelect={() => {}} />);
    expect(iconClass("生成核心要素")).toContain("bg-primary");
    expect(iconClass("生成政策大纲")).toContain("text-muted-foreground");
  });
  it("shows every archived step as complete", () => {
    render(<DraftFlowSteps current={6} maximum={5} bodyReady archived onSelect={() => {}} />);
    expect(iconClass("归档")).toContain("text-emerald-600");
  });
});
