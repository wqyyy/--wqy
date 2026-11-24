export async function requestPolicyAnswer(input: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch(import.meta.env.VITE_POLICY_CHAT_API_URL || "/api/policy-chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, history }), signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok || typeof payload.reply !== "string") throw new Error(payload.error || "模型服务响应异常");
    return payload.reply;
  } catch (error) {
    throw new Error(error instanceof SyntaxError ? "模型接口不可用，请检查服务端部署" : error instanceof Error ? error.message : "模型连接失败，请重试");
  } finally { clearTimeout(timer); }
}
