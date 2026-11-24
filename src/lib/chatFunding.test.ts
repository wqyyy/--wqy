import { describe, expect, it } from "vitest";
import { parseSupportRules, estimateSupport } from "./chatFunding";
describe("enterprise support estimates", () => {
  it("calculates percentages with caps in yuan", () => {
    const [rule] = parseSupportRules("对研发投入按30%给予补贴，每家企业最高100万元。");
    expect(estimateSupport(rule, "5000000")).toBe(1000000);
    expect(estimateSupport(rule, "100000")).toBe(30000);
    expect(estimateSupport(rule, "")).toBeNull();
    expect(estimateSupport(rule, "-1")).toBeNull();
  });
  it("handles fixed support without mistaking caps for fixed grants", () => {
    expect(estimateSupport(parseSupportRules("给予20万元奖励")[0], "")).toBe(200000);
    expect(estimateSupport(parseSupportRules("最高支持100万元")[0], "")).toBeNull();
  });
  it("leaves tiered and recurring support for review", () => {
    expect(estimateSupport(parseSupportRules("分别给予10万元、20万元奖励")[0], "")).toBeNull();
    expect(estimateSupport(parseSupportRules("每年给予10万元补贴，连续3年")[0], "")).toBeNull();
  });
});
