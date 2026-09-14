import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";

/**
 * 可选聚合接口 `import.meta.env.VITE_GOV_POLICY_SEARCH_API`：
 * - URL 中可使用 `{q}` 或 `{keyword}`，会替换为检索词的 encodeURIComponent 结果。
 * - 响应 JSON 支持 `{ "items" | "results" | "data" | "list": [ { "title", "url", "level"?: "yizhuang"|"national"|"beijing"|"other", "source"?: string } ] }`。
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
      id: `portal-yizhuang-kfqgw-${enc.slice(0, 40)}`,
      title: `北京经济技术开发区 · 政策文件库（请结合「${kw}」在站内检索）`,
      url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/",
      level: "yizhuang",
      source: "北京经济技术开发区管理委员会",
      selected: sel,
    },
    {
      id: `portal-yizhuang-so-${enc.slice(0, 40)}`,
      title: `首都之窗 · 经开区政策文件（请搜索「${kw}」）`,
      url: `https://www.beijing.gov.cn/so/s?tab=all&siteCode=1100000000&uc=0&qt=${encodeURIComponent(`北京经济技术开发区 ${kw}`)}`,
      level: "yizhuang",
      source: "北京市人民政府 · 经开区专栏",
      selected: sel,
    },
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
      levelRaw === "yizhuang" ||
      levelRaw === "national" ||
      levelRaw === "beijing" ||
      levelRaw === "other"
        ? levelRaw
        : "national";
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

/** 互联网检索命中的政策标题与官方详情页 URL */
export type InternetPolicyHit = {
  id: string;
  title: string;
  url: string;
  source: string;
};

/**
 * 政府官方网站公开发布的政策详情页精选目录（首都之窗 / 经开区官网 / 中国政府网等）。
 * 原型侧按关键词本地匹配；若配置了 VITE_GOV_POLICY_SEARCH_API 则与远端结果合并。
 */
const INTERNET_POLICY_CATALOG: InternetPolicyHit[] = [
  {
    id: "net-bda-data-2025",
    title: "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202510/t20251029_4243376.html",
    source: "首都之窗",
  },
  {
    id: "net-bda-auto-2025",
    title: "北京经济技术开发区关于加快打造「北京亦庄·汽车智造创新城」的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202512/t20251216_4344616.html",
    source: "首都之窗",
  },
  {
    id: "net-bda-incubator-2025",
    title: "亦庄新城科技企业孵化器认定管理办法",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202507/t20250725_4158429.html",
    source: "首都之窗",
  },
  {
    id: "net-bda-land-2025",
    title: "亦庄新城工业用地提质增效实施意见（试行）",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202511/t20251110_4267716.html",
    source: "北京经济技术开发区管委会",
  },
  {
    id: "net-bj-talent-2024",
    title: "北京市人民政府关于深化人才十条政策落地实施的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/",
    source: "首都之窗",
  },
  {
    id: "net-bj-ai-2023",
    title: "北京市促进通用人工智能创新发展的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202305/t20230519_3097394.html",
    source: "首都之窗",
  },
  {
    id: "net-bj-digital-2023",
    title: "北京市数字经济促进条例",
    url: "https://www.beijing.gov.cn/zhengce/dfxfg/202301/t20230106_2897819.html",
    source: "首都之窗",
  },
  {
    id: "net-bj-data-2023",
    title: "北京市数据和信息系统安全管理规定",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/",
    source: "首都之窗",
  },
  {
    id: "net-bj-green-2022",
    title: "北京市碳达峰实施方案",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202211/t20221108_2854347.html",
    source: "首都之窗",
  },
  {
    id: "net-bj-sme-2022",
    title: "北京市关于促进专精特新中小企业高质量发展的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202209/t20220923_2824615.html",
    source: "首都之窗",
  },
  {
    id: "net-gov-ai-2025",
    title: "国务院关于深入实施人工智能+行动的意见",
    url: "https://www.gov.cn/zhengce/content/202508/content_7037861.htm",
    source: "中国政府网",
  },
  {
    id: "net-gov-data-2022",
    title: "中共中央 国务院关于构建数据基础制度更好发挥数据要素作用的意见",
    url: "https://www.gov.cn/zhengce/2022-12/19/content_5732695.htm",
    source: "中国政府网",
  },
  {
    id: "net-gov-green-2021",
    title: "中共中央 国务院关于完整准确全面贯彻新发展理念做好碳达峰碳中和工作的意见",
    url: "https://www.gov.cn/zhengce/2021-10/24/content_5644613.htm",
    source: "中国政府网",
  },
  {
    id: "net-gov-talent-2021",
    title: "中共中央办公厅 国务院办公厅印发《关于加强新时代高技能人才队伍建设的意见》",
    url: "https://www.gov.cn/zhengce/2022-10/07/content_5716030.htm",
    source: "中国政府网",
  },
  {
    id: "net-gov-sme-2022",
    title: "国务院关于推动外贸保稳提质的意见",
    url: "https://www.gov.cn/zhengce/content/202209/content_5712437.htm",
    source: "中国政府网",
  },
  {
    id: "net-miit-sme-2022",
    title: "优质中小企业梯度培育管理暂行办法",
    url: "https://www.gov.cn/zhengce/zhengceku/202206/content_5696342.htm",
    source: "中国政府网",
  },
  {
    id: "net-ndrc-digital-2022",
    title: "“十四五”数字经济发展规划",
    url: "https://www.gov.cn/zhengce/content/2022-01/12/content_5667817.htm",
    source: "中国政府网",
  },
  {
    id: "net-bj-robot-2023",
    title: "北京市机器人产业创新发展行动方案（2023—2025年）",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202306/t20230609_3116508.html",
    source: "首都之窗",
  },
  {
    id: "net-bj-ic-2021",
    title: "北京市关于加快培育一流科技领军企业的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/",
    source: "首都之窗",
  },
  {
    id: "net-bj-bizenv-2024",
    title: "北京市优化营商环境条例",
    url: "https://www.beijing.gov.cn/zhengce/dfxfg/",
    source: "首都之窗",
  },
  {
    id: "net-kfq-talent-notice",
    title: "北京经济技术开发区关于实施「亦庄人才十条」的通知",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/",
    source: "北京经济技术开发区管委会",
  },
  {
    id: "net-kfq-innovation",
    title: "北京经济技术开发区关于进一步激发创新活力推动高质量发展的若干措施",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/",
    source: "北京经济技术开发区管委会",
  },
  {
    id: "net-bj-housing-talent",
    title: "北京市关于完善人才住房政策的实施意见",
    url: "https://www.beijing.gov.cn/zhengce/",
    source: "首都之窗",
  },
  {
    id: "net-gov-yingshang-2025",
    title: "国务院关于进一步优化政务服务提升行政效能推动“高效办成一件事”的指导意见",
    url: "https://www.gov.cn/zhengce/content/202401/content_6924323.htm",
    source: "中国政府网",
  },
];

function scoreInternetTitle(title: string, query: string): number {
  const text = title.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  if (text === q) return 1000;
  if (text.includes(q)) return 700 + Math.min(q.length * 3, 120);
  const chars = Array.from(q);
  let hit = 0;
  for (const ch of chars) {
    if (text.includes(ch)) hit += 1;
  }
  const coverage = hit / chars.length;
  if (coverage < 0.6) return 0;
  return Math.round(coverage * 280);
}

/**
 * 在政府官方网站政策目录中检索关键词，返回政策名称与详情页 URL。
 * 优先合并可选远端聚合接口结果。
 */
export async function searchInternetGovPolicies(keyword: string): Promise<InternetPolicyHit[]> {
  const q = keyword.trim();
  if (!q) return [];

  // 轻微检索过程，便于展示加载态
  await new Promise((resolve) => setTimeout(resolve, 450));

  const remote = await fetchOptionalRemotePolicyList(q);
  const remoteHits: InternetPolicyHit[] = remote.map((item, index) => ({
    id: item.id || `remote-hit-${index}`,
    title: item.title,
    url: item.url,
    source: item.source || "政府网站",
  }));

  const localHits = INTERNET_POLICY_CATALOG.map((item) => ({
    item,
    score: scoreInternetTitle(item.title, q),
  }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);

  // 无本地命中时，仍给出可打开的官方检索入口对应的代表性政策名称（用门户检索页作为落地）
  const fallbackPortals: InternetPolicyHit[] =
    localHits.length > 0
      ? []
      : buildOfficialPortalPolicies(q, { defaultSelected: false }).slice(0, 6).map((p) => ({
          id: p.id,
          title: p.title.replace(/（请.*?）|· 按「.*?」检索/g, "").trim() || p.title,
          url: p.url,
          source: p.source,
        }));

  return dedupePoliciesByUrl(
    [...remoteHits, ...localHits, ...fallbackPortals].map((h) => ({
      id: h.id,
      title: h.title,
      url: h.url,
      level: "national" as const,
      source: h.source,
      selected: false,
    })),
  ).map((p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
    source: p.source,
  }));
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
      level: "yizhuang",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-auto-innovation-2025",
      title:
        "北京经济技术开发区关于印发《北京经济技术开发区关于加快打造「北京亦庄·汽车智造创新城」的若干措施》的通知（政策全文）",
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202512/t20251216_4344616.html",
      level: "yizhuang",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-incubator-2025",
      title: "北京经济技术开发区关于印发《亦庄新城科技企业孵化器认定管理办法》的通知（政策全文）",
      url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202507/t20250725_4158429.html",
      level: "yizhuang",
      source: "我的素材库 · 经开区管委会（首都之窗）",
      selected: defaultSelected,
    },
    {
      id: "mylib-bda-industrial-land-2025",
      title: "北京经济技术开发区关于印发《亦庄新城工业用地提质增效实施意见（试行）》的通知（经开区官网）",
      url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202511/t20251110_4267716.html",
      level: "yizhuang",
      source: "我的素材库 · 北京经济技术开发区管委会官网",
      selected: defaultSelected,
    },
  ];
}
