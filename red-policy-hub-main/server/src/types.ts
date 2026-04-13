/** 政策條目 */
export interface PolicyItem {
  id: string;
  title: string;
  url: string;
  selected: boolean;
  level: "national" | "beijing" | "other";
  source?: string;
}

/** 政策對比分析條目 */
export interface ClauseComparison {
  id: string;
  policyTitle: string;
  source: string;
  targetAudience: string;
  supportMethod: string;
  supportLevel: string;
  highlights: { field: string; type: "high" | "medium" | "unique" }[];
}

/** 大綱二級節（第X條） */
export interface OutlineSubSection {
  id: string;
  title: string;
  keyPoints: string[];
  referencePolicies: { title: string; clause: string }[];
}

/** 大綱一級章（第X章） */
export interface OutlineSection {
  id: string;
  title: string;
  subSections: OutlineSubSection[];
}

/** 政策檢索請求 */
export interface SearchPoliciesRequest {
  policyTitle: string;
  coreElements?: string;
}

/** 政策分析請求 */
export interface AnalyzePoliciesRequest {
  selectedPolicies: PolicyItem[];
}

/** 大綱生成請求 */
export interface GenerateOutlineRequest {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  analysisResult?: ClauseComparison[];
}

/** 引用條目（正文角標用） */
export interface Citation {
  /** 角標序號，從 1 開始 */
  index: number;
  title: string;
  url: string;
  source?: string;
}

/** 正文生成請求 */
export interface GenerateContentRequest {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  outline: OutlineSection[];
}

/** AI 生成核心要素請求 */
export interface GenerateCoreElementsRequest {
  policyTitle: string;
}
