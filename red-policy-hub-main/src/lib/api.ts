import type { PolicyItem } from "@/components/versions/drafting/PolicySearchStep";
import type { ClauseComparison } from "@/components/versions/drafting/PolicyAnalysisStep";
import type { OutlineSection, OutlineSubSection } from "@/components/versions/drafting/OutlineGenerationStep";

export type { OutlineSubSection };

/** 正文引用條目 */
export interface Citation {
  index: number;
  title: string;
  url: string;
  source?: string;
}

const BASE_URL = "/api";

/** 統一請求封裝 */
async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `請求失敗: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** 根據政策標題智能檢索相關政策 */
export async function searchPolicies(
  policyTitle: string,
  coreElements?: string
): Promise<{ policies: PolicyItem[]; total: number }> {
  return request("/policies/search", { policyTitle, coreElements });
}

/** 對選中政策進行條款比對分析 */
export async function analyzePolicies(
  selectedPolicies: PolicyItem[]
): Promise<{ analysis: ClauseComparison[]; summary: string[] }> {
  return request("/policies/analyze", { selectedPolicies });
}

/** 根據政策標題、核心要素、選中政策生成大綱 */
export async function generateOutline(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  analysisResult?: ClauseComparison[];
}): Promise<{ outline: OutlineSection[] }> {
  return request("/policies/outline", params);
}

/** 根據完整上下文生成政策正文 */
export async function generateContent(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  outline: OutlineSection[];
}): Promise<{ content: string; citations: Citation[] }> {
  return request("/policies/generate-content", params);
}

/** AI 生成核心要素 */
export async function generateCoreElements(
  policyTitle: string
): Promise<{ coreElements: string }> {
  return request("/policies/core-elements", { policyTitle });
}
