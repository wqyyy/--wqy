import { afterEach, describe, expect, it, vi } from "vitest";
import { requestPolicyAnswer } from "./policyChat";
afterEach(() => vi.unstubAllGlobals());
describe("real policy model requests", () => {
  it("sends history to the server and returns model text", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: "模型回答" }) });
    vi.stubGlobal("fetch", fetcher);
    expect(await requestPolicyAnswer("奖励有哪些", [{ role: "user", content: "北京" }])).toBe("模型回答");
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.history[0].content).toBe("北京");
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
  it("reports missing configuration instead of producing mock answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "模型服务尚未配置" }) }));
    await expect(requestPolicyAnswer("问题", [])).rejects.toThrow("尚未配置");
  });
});
