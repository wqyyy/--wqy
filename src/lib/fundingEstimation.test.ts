import { describe, expect, it } from "vitest";
import { calculateFunding, ENABLED_FIELDS, FUNDING_COMPANIES, makeCondition, parseFundingConditions, validFundingSupport } from "./fundingEstimation";

describe("funding conditions and support calculations", () => {
  it("parses supported numeric comparisons and converts monetary units", () => {
    const conditions = parseFundingConditions("上年度营业收入超过1亿元，注册资本不少于100万元，专利达到10项。");
    expect(conditions.map(({ field, operator, value }) => ({ field, operator, value }))).toEqual(expect.arrayContaining([
      { field: "revenue", operator: ">", value: "10000" }, { field: "capital", operator: ">=", value: "100" }, { field: "patents", operator: ">=", value: "10" },
    ]));
  });
  it("does not invent conditions for disabled or unknown criteria", () => {
    expect(parseFundingConditions("研发费超过200万元，拥有语料库建设经验。")).toEqual([]);
    expect(ENABLED_FIELDS.some(field => field.label === "研发费")).toBe(false);
  });
  it("supports negative qualifications", () => {
    expect(parseFundingConditions("企业不得为失信主体").find(condition => condition.field === "失信主体")?.value).toBe("false");
  });
  it("uses an intersection for lower and upper bounds and sums fixed support", () => {
    const conditions = [{ ...makeCondition("revenue"), operator: ">=" as const, value: "8000" }, { ...makeCondition("revenue"), operator: "<=" as const, value: "20000" }];
    const result = calculateFunding(conditions, { mode: "fixed", amount: "30", metric: "", ratio: "", cap: "" });
    expect(result.companies).toHaveLength(5);
    expect(result.total).toBe(150);
    expect(result.amounts.every(item => item.amount === 30)).toBe(true);
  });
  it("applies ratio and cap to each company before summing", () => {
    const result = calculateFunding([], { mode: "ratio", amount: "", metric: "investment", ratio: "20", cap: "250" });
    expect(result.amounts.map(item => item.amount)).toEqual([100, 200, 250, 250, 250, 250, 250, 250]);
    expect(result.total).toBe(1800);
  });
  it("handles no matches without static fallback counts", () => {
    const result = calculateFunding([{ ...makeCondition("capital"), operator: ">", value: "999999999" }], { mode: "fixed", amount: "30", metric: "", ratio: "", cap: "" });
    expect(result.companies).toEqual([]);
    expect(result.total).toBe(0);
    expect(FUNDING_COMPANIES).toHaveLength(8);
  });
  it("rejects empty, negative and invalid amounts or ratios", () => {
    expect(validFundingSupport({ mode: "fixed", amount: "", metric: "", ratio: "", cap: "" })).toBe(false);
    expect(validFundingSupport({ mode: "ratio", amount: "", metric: "capital", ratio: "101", cap: "" })).toBe(false);
    expect(() => calculateFunding([{ ...makeCondition("capital"), value: "-1" }], { mode: "fixed", amount: "10", metric: "", ratio: "", cap: "" })).toThrow();
  });
});
