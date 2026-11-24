import { describe, expect, it } from "vitest";
import { buildPolicyDemoAnswer } from "./policyDemoAnswer";
describe("policy question demo", () => {
  it("labels answers and gives relevant AI support directions without creating tasks", () => {
    const answer = buildPolicyDemoAnswer("有哪些人工智能公司的奖励");
    expect(answer).toContain("非实时模型");
    expect(answer).toContain("算力与数据应用");
    expect(answer).not.toContain("已创建");
  });
  it("uses previous user questions to interpret a followup", () => {
    const answer = buildPolicyDemoAnswer("需要什么材料", [{ role: "user", content: "北京经开区人工智能企业有哪些奖励" }]);
    expect(answer).toContain("北京经开区人工智能企业");
    expect(answer).toContain("付款凭证");
  });
  it("does not invent funding amounts and bounds unsupported topics", () => {
    expect(buildPolicyDemoAnswer("补贴额度是多少")).toContain("不提供虚构奖励金额");
    expect(buildPolicyDemoAnswer("给我讲个笑话")).toContain("超出预设");
  });
});
