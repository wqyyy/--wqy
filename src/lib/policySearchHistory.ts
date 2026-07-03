/**
 * 政策检索历史记录管理
 * 存储用户的搜索关键词，支持快速复用
 */

const STORAGE_KEY = "policy-search-history";
const MAX_HISTORY_COUNT = 10;

export type SearchHistoryItem = {
  id: string;
  keyword: string;
  timestamp: number;
};

// 预设的示例搜索历史（用于原型展示）
const DEFAULT_HISTORY: SearchHistoryItem[] = [
  { id: "demo-1", keyword: "人工智能产业发展政策", timestamp: Date.now() - 1000 * 60 * 5 },
  { id: "demo-2", keyword: "专精特新企业扶持", timestamp: Date.now() - 1000 * 60 * 15 },
  { id: "demo-3", keyword: "高精尖产业支持措施", timestamp: Date.now() - 1000 * 60 * 30 },
  { id: "demo-4", keyword: "人才引进补贴", timestamp: Date.now() - 1000 * 60 * 60 },
  { id: "demo-5", keyword: "绿色低碳节能降碳", timestamp: Date.now() - 1000 * 60 * 120 },
  { id: "demo-6", keyword: "科技创新研发资助", timestamp: Date.now() - 1000 * 60 * 180 },
  { id: "demo-7", keyword: "企业融资担保", timestamp: Date.now() - 1000 * 60 * 240 },
  { id: "demo-8", keyword: "数字经济发展", timestamp: Date.now() - 1000 * 60 * 300 },
  { id: "demo-9", keyword: "产业园区优惠政策", timestamp: Date.now() - 1000 * 60 * 360 },
  { id: "demo-10", keyword: "中小企业发展基金", timestamp: Date.now() - 1000 * 60 * 420 },
];

/**
 * 加载搜索历史记录
 */
export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // 如果没有历史记录，返回预设的示例数据
      return DEFAULT_HISTORY;
    }
    const items = JSON.parse(stored) as SearchHistoryItem[];
    // 按时间倒序排序，最新的在前面
    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return DEFAULT_HISTORY;
  }
}

/**
 * 保存搜索历史记录
 */
export function saveSearchHistory(keyword: string): void {
  if (!keyword.trim()) return;

  try {
    const existing = loadSearchHistory();

    // 检查是否已存在相同的关键词
    const isDuplicate = existing.some((h) => h.keyword === keyword.trim());

    // 如果已存在相同关键词，不重复保存
    if (isDuplicate) return;

    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      keyword: keyword.trim(),
      timestamp: Date.now(),
    };

    // 添加新记录到开头
    const updated = [newItem, ...existing];

    // 只保留最近的10条
    const trimmed = updated.slice(0, MAX_HISTORY_COUNT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
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
