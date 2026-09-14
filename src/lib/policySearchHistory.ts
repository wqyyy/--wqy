/**
 * 政策检索历史记录管理
 * 存储用户的搜索关键词，支持快速复用；累计搜索次数用于「常用标签」
 */

const STORAGE_KEY = "policy-search-history-v2";
const MAX_HISTORY_COUNT = 10;
/** 搜索次数达到该阈值时标记为常用标签 */
export const COMMON_TAG_MIN_COUNT = 3;

export type SearchHistoryItem = {
  id: string;
  keyword: string;
  timestamp: number;
  /** 累计搜索次数，默认 1 */
  searchCount: number;
};

// 预设的示例搜索历史（用于原型展示；部分条目次数≥3 以便展示常用标签）
const DEFAULT_HISTORY: SearchHistoryItem[] = [
  { id: "demo-1", keyword: "人工智能产业发展政策", timestamp: Date.now() - 1000 * 60 * 5, searchCount: 5 },
  { id: "demo-2", keyword: "专精特新企业扶持", timestamp: Date.now() - 1000 * 60 * 15, searchCount: 3 },
  { id: "demo-3", keyword: "高精尖产业支持措施", timestamp: Date.now() - 1000 * 60 * 30, searchCount: 2 },
  { id: "demo-4", keyword: "人才引进补贴", timestamp: Date.now() - 1000 * 60 * 60, searchCount: 8 },
  { id: "demo-5", keyword: "绿色低碳节能降碳", timestamp: Date.now() - 1000 * 60 * 120, searchCount: 1 },
  { id: "demo-6", keyword: "科技创新研发资助", timestamp: Date.now() - 1000 * 60 * 180, searchCount: 4 },
  { id: "demo-7", keyword: "企业融资担保", timestamp: Date.now() - 1000 * 60 * 240, searchCount: 1 },
  { id: "demo-8", keyword: "数字经济发展", timestamp: Date.now() - 1000 * 60 * 300, searchCount: 2 },
  { id: "demo-9", keyword: "产业园区优惠政策", timestamp: Date.now() - 1000 * 60 * 360, searchCount: 1 },
  { id: "demo-10", keyword: "中小企业发展基金", timestamp: Date.now() - 1000 * 60 * 420, searchCount: 3 },
];

function normalizeHistoryItem(raw: Partial<SearchHistoryItem> & { keyword?: string }): SearchHistoryItem | null {
  const keyword = raw.keyword?.trim();
  if (!keyword) return null;
  return {
    id: raw.id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    keyword,
    timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
    searchCount: typeof raw.searchCount === "number" && raw.searchCount > 0 ? raw.searchCount : 1,
  };
}

/**
 * 加载搜索历史记录
 */
export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_HISTORY.map((item) => ({ ...item }));
    }
    const parsed = JSON.parse(stored) as Partial<SearchHistoryItem>[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_HISTORY.map((item) => ({ ...item }));
    }
    const items = parsed
      .map((item) => normalizeHistoryItem(item))
      .filter((item): item is SearchHistoryItem => Boolean(item));
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return DEFAULT_HISTORY.map((item) => ({ ...item }));
  }
}

export function isCommonSearchTag(item: SearchHistoryItem): boolean {
  return item.searchCount >= COMMON_TAG_MIN_COUNT;
}

/**
 * 保存搜索历史记录（已存在则累加次数并置顶）
 */
export function saveSearchHistory(keyword: string): void {
  if (!keyword.trim()) return;

  try {
    const existing = loadSearchHistory();
    const trimmed = keyword.trim();
    const matched = existing.find((h) => h.keyword === trimmed);

    let updated: SearchHistoryItem[];
    if (matched) {
      updated = [
        {
          ...matched,
          timestamp: Date.now(),
          searchCount: matched.searchCount + 1,
        },
        ...existing.filter((h) => h.id !== matched.id),
      ];
    } else {
      const newItem: SearchHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        keyword: trimmed,
        timestamp: Date.now(),
        searchCount: 1,
      };
      updated = [newItem, ...existing];
    }

    const trimmedList = updated.slice(0, MAX_HISTORY_COUNT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedList));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

/**
 * 删除单条历史记录
 */
export function removeSearchHistory(id: string): void {
  try {
    const existing = loadSearchHistory();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove search history:", error);
  }
}

/**
 * 清空所有历史记录
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}

/**
 * 关键词与候选文本的简易相似度（越高越相关）
 */
export function scoreKeywordSimilarity(candidate: string, query: string): number {
  const text = candidate.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q || !text) return 0;
  if (text === q) return 1000;
  if (text.startsWith(q)) return 800 + Math.min(q.length, 50);
  if (text.includes(q)) return 600 + Math.min(q.length * 2, 80);

  let hit = 0;
  for (const ch of q) {
    if (text.includes(ch)) hit += 1;
  }
  const coverage = hit / q.length;
  if (coverage < 0.5) return 0;
  return Math.round(coverage * 200);
}
