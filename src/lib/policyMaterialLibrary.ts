import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";
import { loadFavoritePolicies } from "@/lib/policyFavorites";

export type PolicyMaterialItem = {
  id: string;
  title: string;
  detailUrl: string;
  source: string;
  region: string;
  department: string;
  code?: string;
  date: string;
};

export const POLICY_MATERIAL_ITEMS: PolicyMaterialItem[] = [
  {
    id: "material-data-industry-2025",
    title: "北京经济技术开发区管理委员会印发《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》的通知",
    detailUrl: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202510/t20251029_4243376.html",
    source: "人工添加",
    region: "北京市",
    department: "北京经济技术开发区管理委员会",
    code: "京技管〔2025〕8号",
    date: "2026-03-10",
  },
  {
    id: "material-bci-2026",
    title: "北京经济技术开发区管理委员会印发《关于加快推动脑机接口技术和产业创新发展的若干措施》的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202602/t20260209_4503840.html",
    source: "人工添加",
    region: "朝阳区",
    department: "北京经济技术开发区管理委员会",
    code: "京技管〔2025〕8号",
    date: "2026-03-06",
  },
  {
    id: "material-producer-service-2025",
    title: "北京经济技术开发区经济发展局关于开展2025年生产性服务业十二条政策相关事项（第二批）申报的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202508/t20250808_4169681.html",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区经济发展局",
    date: "2025-08-08",
  },
  {
    id: "material-ai-voucher-2025",
    title: "北京经济技术开发区信息技术产业局关于开展人工智能“模型券”专项奖励申报的通知",
    detailUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202508/t20250808_4169672.html",
    source: "收藏入库",
    region: "北京市经济技术开发区",
    department: "北京经济技术开发区信息技术产业局",
    date: "2025-08-08",
  },
];

function tokenizeForSearch(...parts: (string | undefined)[]): string[] {
  const text = parts.filter(Boolean).join(" ");
  const terms = ["数据产业", "数据要素", "数据资源", "公共数据", "企业数据", "数字经济", "人工智能", "高质量发展", "脑机接口", "生产性服务业", "机器人", "具身智能"];
  const matched = terms.filter((term) => text.includes(term));
  if (matched.length) return matched;
  const normalized = text.replace(/[《》“”"'，。、\s]/g, "");
  return normalized.length >= 4 ? [normalized.slice(0, 12)] : [];
}

function matchesMaterialItem(item: { title: string; department: string; region?: string }, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = `${item.title} ${item.department} ${item.region ?? ""}`;
  return terms.some((term) => haystack.includes(term) || term.includes(haystack.slice(0, Math.min(term.length, 8))));
}

export function searchMaterialPolicies(
  policyTitle: string,
  options?: { searchQuery?: string; coreElements?: string; selected?: boolean },
): PolicyItem[] {
  const terms = tokenizeForSearch(policyTitle, options?.searchQuery, options?.coreElements);
  const selected = options?.selected ?? true;

  const fromLibrary = POLICY_MATERIAL_ITEMS.filter((item) => matchesMaterialItem(item, terms)).map((item) => ({
    id: item.id,
    title: item.title,
    url: item.detailUrl,
    selected,
    level: "material" as const,
    source: item.department,
  }));

  const fromFavorites = loadFavoritePolicies()
    .filter((item) => matchesMaterialItem({ title: item.title, department: item.department }, terms))
    .map((item) => ({
      id: `fav-${item.id}`,
      title: item.title,
      url: "#",
      selected,
      level: "material" as const,
      source: item.department,
    }));

  const seen = new Set<string>();
  return [...fromLibrary, ...fromFavorites].filter((item) => {
    const key = item.url !== "#" ? item.url : item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
