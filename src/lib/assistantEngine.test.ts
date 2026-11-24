import { describe, expect, it, vi } from "vitest";
import { getAssistantPlan, isPolicyQuestion } from "./assistantEngine";
describe("policy consultation intent", () => {
  it.each(["有哪些人工智能公司的奖励", "人工智能企业能享受什么政策", "人才补贴怎么申请", "关于人工智能的政策有哪些", "如何起草政策？"])("treats %s as consultation", input => {
    expect(isPolicyQuestion(input)).toBe(true);
  });
  it.each(["帮我起草人工智能政策", "写一篇人工智能奖励政策", "请撰写人才支持措施"])("preserves explicit drafting: %s", input => {
    expect(isPolicyQuestion(input)).toBe(false);
  });
  it("does not create tasks or navigate for the reported question", async () => {
    vi.stubEnv("VITE_OPENAI_API_KEY", "");
    const plan = await getAssistantPlan({ key: "writing", prompt: "", placeholder: "", suggestions: [] } as Parameters<typeof getAssistantPlan>[0], "有哪些人工智能公司的奖励", []);
    expect(plan.action?.kind).toBe("none");
    expect(plan.reply).not.toContain("已根据");
    vi.unstubAllEnvs();
  });
});
