import { describe, expect, it } from "vitest";
import { fundingTaskProgress, type FundingTask } from "./fundingTasks";

const legacy: FundingTask = { id: "old", title: "旧任务", createdAt: "", updatedAt: "", clause: "", conditions: [], support: { mode: "fixed", amount: "30", metric: "", ratio: "", cap: "" }, result: null, step: 2, maximum: 2, archived: false };
const result: NonNullable<FundingTask["result"]> = { companies: [], amounts: [], total: 0 };
describe("funding task three-step progress", () => {
  it("moves the old support page to the combined conditions page", () => {
    expect(fundingTaskProgress(legacy)).toEqual({ step: 1, maximum: 1 });
  });
  it("moves old results to the second step", () => {
    expect(fundingTaskProgress({ ...legacy, step: 3, maximum: 3, result })).toEqual({ step: 2, maximum: 2 });
  });
  it("keeps archived old tasks on results with all steps complete", () => {
    expect(fundingTaskProgress({ ...legacy, archived: true, result })).toEqual({ step: 2, maximum: 3 });
  });
  it("restores the new result step without interpreting it as the old support page", () => {
    expect(fundingTaskProgress({ ...legacy, flowVersion: 2, result })).toEqual({ step: 2, maximum: 2 });
  });
});
