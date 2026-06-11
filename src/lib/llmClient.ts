/**
 * OpenAI 兼容 Chat Completions（也适用于多数国产大模型网关）。
 *
 * 配置（.env，需 VITE_ 前缀以便前端构建注入）：
 * - VITE_POLICY_LLM_BASE_URL  如 https://api.openai.com/v1 或自建网关根路径
 * - VITE_POLICY_LLM_API_KEY
 * - VITE_POLICY_LLM_MODEL     可选，默认 gpt-4o-mini
 */

function trimEnv(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function isPolicyLlmConfigured(): boolean {
  return Boolean(trimEnv(import.meta.env.VITE_POLICY_LLM_BASE_URL) && trimEnv(import.meta.env.VITE_POLICY_LLM_API_KEY));
}

export type PolicyLlmChatParams = {
  system: string;
  user: string;
  temperature?: number;
  max_tokens?: number;
};

export async function policyLlmChat(params: PolicyLlmChatParams): Promise<string> {
  const base = trimEnv(import.meta.env.VITE_POLICY_LLM_BASE_URL).replace(/\/$/, "");
  const key = trimEnv(import.meta.env.VITE_POLICY_LLM_API_KEY);
  const model = trimEnv(import.meta.env.VITE_POLICY_LLM_MODEL) || "gpt-4o-mini";

  if (!base || !key) {
    throw new Error("未配置 VITE_POLICY_LLM_BASE_URL / VITE_POLICY_LLM_API_KEY");
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      temperature: params.temperature ?? 0.45,
      max_tokens: params.max_tokens ?? 4096,
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`LLM 请求失败 (${res.status}): ${rawText.slice(0, 400)}`);
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("LLM 响应不是合法 JSON");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM 返回内容为空");
  }

  return content.trim();
}
