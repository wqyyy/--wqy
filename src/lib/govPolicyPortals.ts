import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";

/**
 * 可选聚合接口 `import.meta.env.VITE_GOV_POLICY_SEARCH_API`：
 * - URL 中可使用 `{q}` 或 `{keyword}`，会替换为检索词的 encodeURIComponent 结果。
 * - 响应 JSON 支持 `{ "items" | "results" | "data" | "list": [ { "title", "url", "level"?: "national"|"beijing"|"other", "source"?: string } ] }`。
 * 需服务端配置 CORS 允许本前端域名，或由同源网关转发。
 */

/**
 * 从政策标题生成用于政府网站检索的短关键词（避免标题过长导致检索效果差）
 */
export function baseSearchKeywordFromTitle(policyTitle: string): string {
  const t = policyTitle
    .replace(/^关于|的若干措施$|若干政策$|若干措施$|政策$/g, "")
    .trim();
  return t.slice(0, 24) || "产业发展";
}

/**
 * 国家级、北京市、其他省市代表站点的**公开政策检索/文件库**入口。
 * 链接均为政府主域，用户在新标签页打开后可在该站继续查看具体文件正文。
 */
export function buildOfficialPortalPolicies(
  keyword: string,
  options: { defaultSelected: boolean },
): PolicyItem[] {
  const kw = keyword.trim() || "政策";
  const enc = encodeURIComponent(kw);
  const { defaultSelected: sel } = options;

  return [
    {
      id: `portal-gov-cn-doclib-${enc.slice(0, 40)}`,
      title: `国务院政策文件库 · 按「${kw}」检索`,
      url: `https://sousuo.www.gov.cn/zcwjk/policyDocumentLibrary?q=${enc}&t=zhengcelibrary`,
      level: "national",
      source: "中国政府网 · 国务院政策文件库",
      selected: sel,
    },
    {
      id: `portal-ndrc-wjk-${enc.slice(0, 40)}`,
      title: `国家发展改革委 · 政府信息公开 / 文件库（请结合「${kw}」在站内筛选）`,
      url: "https://www.ndrc.gov.cn/xxgk/wjk/",
      level: "national",
      source: "国家发展和改革委员会",
      selected: sel,
    },
    {
      id: `portal-mof-${enc.slice(0, 40)}`,
      title: `财政部 · 政策发布（请结合「${kw}」在站内检索）`,
      url: "https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/",
      level: "national",
      source: "中华人民共和国财政部",
      selected: sel,
    },
    {
      id: `portal-beijing-so-${enc.slice(0, 40)}`,
      title: `北京市人民政府 · 全站检索「${kw}」`,
      url: `https://www.beijing.gov.cn/so/s?tab=all&siteCode=1100000000&uc=0&qt=${enc}`,
      level: "beijing",
      source: "北京市人民政府门户网站",
      selected: sel,
    },
    {
      id: `portal-beijing-zhengce-${enc.slice(0, 40)}`,
      title: `“首都之窗” · 政策文件（专题入口，可继续搜索「${kw}」）`,
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/",
      level: "beijing",
      source: "北京市人民政府",
      selected: sel,
    },
    {
      id: `portal-shanghai-nw12343-${enc.slice(0, 40)}`,
      title: `上海市人民政府 · 政策文件与检索（请搜索「${kw}」）`,
      url: "https://www.shanghai.gov.cn/nw12343",
      level: "other",
      source: "上海市人民政府",
      selected: sel,
    },
    {
      id: `portal-gd-gov-${enc.slice(0, 40)}`,
      title: `广东省人民政府 · 政务公开 / 政策文件（请结合「${kw}」在站内查找）`,
      url: "https://www.gd.gov.cn/zwgk/xxgkml/index.html",
      level: "other",
      source: "广东省人民政府",
      selected: sel,
    },
    {
      id: `portal-tj-so-${enc.slice(0, 40)}`,
      title: `天津市人民政府 · 全站检索「${kw}」`,
      url: `https://www.tj.gov.cn/so/s?tab=all&siteCode=1200000000&qt=${enc}`,
      level: "other",
      source: "天津市人民政府",
      selected: sel,
    },
  ];
}

type RemoteItem = { title: string; url: string; level?: PolicyItem["level"]; source?: string };

function normalizeRemoteList(data: unknown): PolicyItem[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const arr = (o.items ?? o.results ?? o.data ?? o.list) as unknown;
  if (!Array.isArray(arr)) return [];
  const out: PolicyItem[] = [];
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i] as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title : typeof row.name === "string" ? row.name : "";
    const url = typeof row.url === "string" ? row.url : typeof row.link === "string" ? row.link : "";
    if (!title || !url || !/^https?:\/\//i.test(url)) continue;
    const levelRaw = row.level;
    const level: PolicyItem["level"] =
      levelRaw === "national" || levelRaw === "beijing" || levelRaw === "other" ? levelRaw : "national";
    out.push({
      id: `remote-${i}-${String(url).slice(-24)}`,
      title,
      url,
      level,
      source: typeof row.source === "string" ? row.source : "外部政策数据",
      selected: false,
    });
  }
  return out;
}

/**
 * 可选：由贵司后端/网关提供已抓取的政府站政策 JSON，与门户入口合并展示。
 * 环境变量 VITE_GOV_POLICY_SEARCH_API 支持占位符 {q} 或 {keyword}，将替换为 URL 编码后的检索词。
 */
export function dedupePoliciesByUrl(items: PolicyItem[]): PolicyItem[] {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = p.url.trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function fetchOptionalRemotePolicyList(keyword: string): Promise<PolicyItem[]> {
  const tpl = trimEnv(import.meta.env.VITE_GOV_POLICY_SEARCH_API);
  if (!tpl) return [];

  const q = encodeURIComponent(keyword);
  const url = tpl.replace(/\{q\}/g, q).replace(/\{keyword\}/g, q);

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    const data = await res.json();
    return normalizeRemoteList(data);
  } catch {
    return [];
  }
}

function trimEnv(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * 「我的素材库」——内置北京经济技术开发区（亦庄）公开发布的代表性政策，
 * 正文详情页均为 **gov.cn / kfqgw.beijing.gov.cn** 官方站点，新标签页打开即可阅读原文。
 * （keyword 保留参数以便调用方扩展检索联想，当前条目为固定精选。）
 */
export function buildMyLibraryPlaceholders(
  _keyword: string,
  defaultSelected: boolean,
): PolicyItem[] {
  return [
    {
      id: "mylib-bda-data-industry-2025",
      title:
        "北京经济技术开发区关于印发《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》的通知（政策全文）",
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202510/t20251029_4243376.html",
      level: "beijing",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-auto-innovation-2025",
      title:
        "北京经济技术开发区关于印发《北京经济技术开发区关于加快打造「北京亦庄·汽车智造创新城」的若干措施》的通知（政策全文）",
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202512/t20251216_4344616.html",
      level: "beijing",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-incubator-2025",
      title: "北京经济技术开发区关于印发《亦庄新城科技企业孵化器认定管理办法》的通知（政策全文）",
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202507/t20250725_4158429.html",
      level: "beijing",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-industrial-land-2025",
      title: "北京经济技术开发区关于印发《亦庄新城工业用地提质增效实施意见（试行）》的通知（经开区官网）",
      url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202511/t20251110_4267716.html",
      level: "beijing",
      source: "我的素材库 · 北京经济技术开发区管委会官网",
      selected: defaultSelected,
    },
  ];
}
