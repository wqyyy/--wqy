import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";
import type { ClauseComparison } from "@/components/policy-drafting/drafting/PolicyAnalysisStep";
import type { OutlineSection, OutlineSubSection } from "@/components/policy-drafting/drafting/OutlineGenerationStep";
import { deriveDataIndustryCorePoints, isDataIndustryPolicyDraft, DATA_INDUSTRY_POLICY_TITLE } from "@/lib/samplePolicyDocuments";
import {
  formatPolicyLevel1,
  formatPolicyLevel2,
  formatPolicyLevel3,
  isPolicyStructureHeadingLine,
} from "@/lib/policyNumbering";
import { isPolicyLlmConfigured } from "@/lib/llmClient";
import {
  llmGenerateContent as llmGeneratePolicyBody,
  llmGenerateCoreElementsFromPolicies as llmGenCore,
  llmGenerateOutline as llmGenOutline,
  llmExpandPolicyTitle,
} from "@/lib/policyDraftLlm";

export type { OutlineSubSection };

export interface Citation {
  index: number;
  title: string;
  url: string;
  source?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 是否已是完整政策标题（无需再润色扩写） */
export function isFullPolicyTitle(text: string): boolean {
  const t = text.trim();
  if (t.length < 18) return false;
  return (
    (t.includes("北京经济技术开发区") || t.startsWith("关于")) &&
    t.includes("关于") &&
    /的(若干措施|实施方案|实施细则|管理办法|奖励办法|政策)$/.test(t)
  );
}

/** 规则兜底：将简短政策方向扩写为完整标题 */
function mockExpandPolicyTitle(direction: string, policyType: string): string {
  const raw = direction.trim();
  if (isFullPolicyTitle(raw)) return raw;

  if (/数据产业/.test(raw)) {
    return DATA_INDUSTRY_POLICY_TITLE;
  }

  let topic = raw
    .replace(/^推进/, "")
    .replace(/^关于/, "")
    .replace(/(的?(若干措施|实施方案|实施细则|管理办法|奖励办法|政策))$/, "")
    .trim();

  if (topic && !/高质量|发展|建设|创新|提升/.test(topic)) {
    topic = `${topic}高质量发展`;
  } else if (topic && /发展$/.test(topic) && !topic.includes("高质量")) {
    topic = topic.replace(/发展$/, "高质量发展");
  }

  const suffix = policyType === "其他" ? "政策" : policyType;
  return `北京经济技术开发区关于加快推进${topic}的${suffix}`;
}

/** 根据政策方向自动生成完整政策标题（优先大模型，失败则规则兜底） */
export async function expandPolicyTitleFromDirection(
  direction: string,
  policyType: string,
): Promise<{ title: string }> {
  const trimmed = direction.trim();
  if (!trimmed) {
    return { title: mockExpandPolicyTitle("推进数据产业高质量发展", policyType) };
  }
  if (isFullPolicyTitle(trimmed)) {
    return { title: trimmed };
  }

  if (isPolicyLlmConfigured()) {
    try {
      return await llmExpandPolicyTitle(trimmed, policyType);
    } catch {
      /* fallback below */
    }
  }

  await delay(600);
  return { title: mockExpandPolicyTitle(trimmed, policyType) };
}

const levelSources: Record<PolicyItem["level"], string> = {
  yizhuang: "北京经济技术开发区",
  national: "国家发展改革委",
  beijing: "北京市人民政府",
  other: "先进地区参考",
  material: "我的素材库",
};

type OfficialPolicyTemplate = Omit<PolicyItem, "selected"> & {
  keywords: string[];
};

const officialPolicyCorpus: OfficialPolicyTemplate[] = [
  {
    id: "yizhuang-data-industry-2025",
    title: "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202510/t20251029_4243376.html",
    level: "yizhuang",
    source: "北京经济技术开发区管理委员会",
    keywords: ["数据产业", "经开区", "亦庄", "北京经济技术开发区", "数据", "高质量发展", "数字经济"],
  },
  {
    id: "yizhuang-auto-innovation-2025",
    title: "北京经济技术开发区关于加快打造「北京亦庄·汽车智造创新城」的若干措施",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202512/t20251216_4344616.html",
    level: "yizhuang",
    source: "北京经济技术开发区管理委员会",
    keywords: ["经开区", "亦庄", "汽车", "智造", "汽车智造", "北京经济技术开发区"],
  },
  {
    id: "yizhuang-incubator-2025",
    title: "亦庄新城科技企业孵化器认定管理办法",
    url: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202507/t20250725_4158429.html",
    level: "yizhuang",
    source: "北京经济技术开发区管理委员会",
    keywords: ["经开区", "亦庄", "孵化器", "科技企业", "认定", "北京经济技术开发区"],
  },
  {
    id: "yizhuang-industrial-land-2025",
    title: "亦庄新城工业用地提质增效实施意见（试行）",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202511/t20251110_4267716.html",
    level: "yizhuang",
    source: "北京经济技术开发区管理委员会",
    keywords: ["经开区", "亦庄", "工业用地", "提质增效", "北京经济技术开发区"],
  },
  {
    id: "yizhuang-bci-2026",
    title: "北京经济技术开发区关于加快推动脑机接口技术和产业创新发展的若干措施",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202602/t20260209_4503840.html",
    level: "yizhuang",
    source: "北京经济技术开发区管理委员会",
    keywords: ["经开区", "亦庄", "脑机接口", "北京经济技术开发区"],
  },
  {
    id: "yizhuang-ai-voucher-2025",
    title: "北京经济技术开发区关于开展人工智能「模型券」专项奖励申报的通知",
    url: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202508/t20250808_4169672.html",
    level: "yizhuang",
    source: "北京经济技术开发区信息技术产业局",
    keywords: ["经开区", "亦庄", "人工智能", "模型券", "奖励", "北京经济技术开发区"],
  },
  {
    id: "national-data-industry-2024",
    title: "关于促进数据产业高质量发展的指导意见",
    url: "https://www.gov.cn/zhengce/zhengceku/202412/content_6995430.htm",
    level: "national",
    source: "国家发展改革委、国家数据局等部门",
    keywords: ["数据产业", "数据", "高质量发展", "数字经济", "数据要素"],
  },
  {
    id: "national-enterprise-data-2024",
    title: "国家数据局等部门关于促进企业数据资源开发利用的意见",
    url: "https://www.gov.cn/zhengce/zhengceku/202412/content_6994570.htm",
    level: "national",
    source: "国家数据局、中央网信办等部门",
    keywords: ["企业数据", "数据资源", "数据", "开发利用", "数据要素"],
  },
  {
    id: "beijing-data-elements-2024",
    title: "北京市大数据工作推进小组关于印发《北京市“数据要素×”实施方案（2024—2026年）》的通知",
    url: "https://zwfwj.beijing.gov.cn/zwgk/2024zcwj/202409/t20240927_3908531.html",
    level: "beijing",
    source: "北京市大数据工作推进小组",
    keywords: ["北京", "数据要素", "数据", "数字经济", "应用场景"],
  },
  {
    id: "beijing-public-data-2025",
    title: "中共北京市委办公厅 北京市人民政府办公厅关于加快北京市公共数据资源开发利用的实施意见",
    url: "https://zwfwj.beijing.gov.cn/zwgk/2024zcwj/202508/t20250813_4172464.html",
    level: "beijing",
    source: "中共北京市委办公厅、北京市人民政府办公厅",
    keywords: ["北京", "公共数据", "数据资源", "开发利用", "数据要素"],
  },
  {
    id: "beijing-data-zone-2025",
    title: "中共北京市委 北京市人民政府关于建设数据要素综合试验区 深化数据要素市场化配置改革的实施意见",
    url: "https://zwfwj.beijing.gov.cn/zwgk/2024zcwj/202511/t20251110_4268006.html",
    level: "beijing",
    source: "中共北京市委、北京市人民政府",
    keywords: ["北京", "数据要素", "市场化配置", "综合试验区", "数据"],
  },
  {
    id: "shanghai-data-elements-2023",
    title: "上海市人民政府办公厅关于印发《立足数字经济新赛道推动数据要素产业创新发展行动方案（2023-2025年）》的通知",
    url: "https://www.shanghai.gov.cn/hqzxsj2/20240415/d43b052249d64c45a44ab8934fad3ee5.html",
    level: "other",
    source: "上海市人民政府办公厅",
    keywords: ["上海", "数据要素", "数据产业", "数字经济", "创新发展"],
  },
  {
    id: "shenzhen-data-rule-2023",
    title: "深圳市发展和改革委员会关于印发《深圳市数据商和数据流通交易第三方服务机构管理暂行办法》的通知",
    url: "http://fgw.sz.gov.cn/gkmlpt/content/10/10454/post_10454297.html",
    level: "other",
    source: "深圳市发展和改革委员会",
    keywords: ["深圳", "数据商", "数据流通", "数据交易", "数据要素"],
  },
  {
    id: "guangzhou-data-elements-2021",
    title: "广州市人民政府关于印发广州市数据要素市场化配置改革行动方案的通知",
    url: "https://www.gz.gov.cn/gkmlpt/content/7/7943/post_7943260.html",
    level: "other",
    source: "广州市人民政府",
    keywords: ["广州", "数据要素", "市场化配置", "数据", "改革"],
  },
  {
    id: "nanjing-data-elements-2024",
    title: "南京市人民政府办公厅关于推进数据基础制度建设更好发挥数据要素作用的实施意见",
    url: "https://www.nanjing.gov.cn/zt/sznjjsqx/zcyl/202502/t20250224_5081608.html",
    level: "other",
    source: "南京市人民政府办公厅",
    keywords: ["南京", "数据基础制度", "数据要素", "数据", "公共数据"],
  },
];

const extendedOfficialPolicyCorpus: OfficialPolicyTemplate[] = [
  {
    id: "national-public-data-2024",
    title: "中共中央办公厅 国务院办公厅关于加快公共数据资源开发利用的意见",
    url: "https://www.gov.cn/zhengce/202410/content_6981758.htm",
    level: "national",
    source: "中共中央办公厅、国务院办公厅",
    keywords: ["公共数据", "数据资源", "开发利用", "数据要素", "数据"],
  },
  {
    id: "national-digital-china-2023",
    title: "中共中央 国务院印发《数字中国建设整体布局规划》",
    url: "https://www.gov.cn/zhengce/2023-02/27/content_5743484.htm",
    level: "national",
    source: "中共中央、国务院",
    keywords: ["数字中国", "数字经济", "数据资源", "数据要素", "数据"],
  },
  {
    id: "beijing-digital-economy-2022",
    title: "北京市数字经济促进条例",
    url: "https://www.beijing.gov.cn/zhengce/dfxfg/202212/t20221201_2868696.html",
    level: "beijing",
    source: "北京市人民代表大会常务委员会",
    keywords: ["北京", "数字经济", "数据", "数据要素", "产业"],
  },
  {
    id: "beijing-data-regulation-2025",
    title: "北京市政务服务和数据管理局关于印发《北京市公共数据开放管理办法》的通知",
    url: "https://zwfwj.beijing.gov.cn/zwgk/2024zcwj/",
    level: "beijing",
    source: "北京市政务服务和数据管理局",
    keywords: ["北京", "公共数据", "数据开放", "数据资源", "数据"],
  },
  {
    id: "shanghai-big-data-2020",
    title: "上海市人民政府关于印发《上海市大数据发展实施意见》的通知",
    url: "https://www.shanghai.gov.cn/nw39327/20200821/0001-39327_50056.html",
    level: "other",
    source: "上海市人民政府",
    keywords: ["上海", "大数据", "数据", "数字经济", "数据资源"],
  },
  {
    id: "guangzhou-digital-economy-2023",
    title: "广州市人民政府办公厅关于印发广州市数字经济高质量发展规划的通知",
    url: "https://www.gz.gov.cn/gkmlpt/content/9/9651/post_9651624.html",
    level: "other",
    source: "广州市人民政府办公厅",
    keywords: ["广州", "数字经济", "高质量发展", "数据", "产业"],
  },
  {
    id: "nanjing-public-data-2024",
    title: "南京市人民政府办公厅关于印发《南京市公共数据授权运营管理暂行办法》的通知",
    url: "https://www.nanjing.gov.cn/zt/sznjjsqx/zcyl/202502/t20250224_5081596.html",
    level: "other",
    source: "南京市人民政府办公厅",
    keywords: ["南京", "公共数据", "授权运营", "数据要素", "数据"],
  },
];

const RELATED_SEARCH_TERMS: Record<string, string[]> = {
  数据产业: ["数据要素", "数据资源", "公共数据", "企业数据", "数字经济", "大数据"],
};

function expandRelatedSearchTerms(terms: string[]): string[] {
  const expanded = [...terms];
  for (const term of terms) {
    for (const related of RELATED_SEARCH_TERMS[term] ?? []) {
      if (!expanded.includes(related)) expanded.push(related);
    }
  }
  return expanded;
}

function getPolicySearchTerms(policyTitle: string, coreElements?: string): string[] {
  const text = `${policyTitle} ${coreElements ?? ""}`;
  const candidates = ["数据产业", "数据要素", "数据资源", "公共数据", "企业数据", "数字经济", "人工智能", "高质量发展"];
  const matched = candidates.filter((term) => text.includes(term));
  const base = matched.length
    ? matched
    : [policyTitle.replace(/[《》“”"'，。、]/g, "").slice(0, 12)].filter(Boolean);
  return expandRelatedSearchTerms(base);
}

function isPolicyHeadingLine(line: string, policyTitle: string): boolean {
  return isPolicyStructureHeadingLine(line, policyTitle);
}

function buildSubSectionBody(
  subSection: OutlineSubSection,
  index: number,
  citations: Citation[],
  isData: boolean,
): string[] {
  const citation = citations[index % Math.max(citations.length, 1)];
  const citeTag = citation ? `[ref:${citation.index}]` : "";
  const points = (subSection.keyPoints ?? []).filter((p) => p.trim());
  const fallbackPoints = isData
    ? [
        "建立任务清单并明确责任分工，细化实施对象、支持标准和完成时限",
        "统一申报受理、评审认定、公示复核、资金拨付等办理环节和审核口径",
        "建立月度调度、季度评估和年度复盘机制，对执行偏差及时纠偏并动态优化",
      ]
    : [
        "明确执行主体、实施对象和办理时限，形成可操作的任务清单",
        "将申报受理、审核认定、结果公示和资金兑现纳入统一流程管理",
        "建立监督检查与绩效评估机制，对实施成效进行量化复盘",
      ];
  const activePoints = points.length > 0 ? points : fallbackPoints;
  const lines: string[] = [];

  activePoints.forEach((point, pointIndex) => {
    const suffix = pointIndex === activePoints.length - 1 ? citeTag : "";
    lines.push(`${formatPolicyLevel3(pointIndex, point)}${suffix}`);
  });

  return lines;
}

function formatPolicyContent(content: string, policyTitle: string): string {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || isPolicyHeadingLine(trimmed, policyTitle)) return trimmed;
      return trimmed.startsWith("　　") ? trimmed : `　　${trimmed}`;
    })
    .join("\n");
}

function policyMatchesSearchTerms(
  policy: Pick<OfficialPolicyTemplate, "title" | "keywords">,
  terms: string[],
): boolean {
  const haystack = `${policy.title} ${policy.keywords.join(" ")}`;
  return terms.some((term) => {
    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 2) return false;
    if (haystack.includes(normalizedTerm)) return true;
    return policy.keywords.some((keyword) => keyword.includes(normalizedTerm));
  });
}

export async function searchPolicies(
  policyTitle: string,
  coreElements?: string,
  options?: { includeExtended?: boolean; selected?: boolean },
): Promise<{ policies: PolicyItem[]; total: number }> {
  await delay(700);
  const terms = getPolicySearchTerms(policyTitle, coreElements);
  const corpus = options?.includeExtended ? [...officialPolicyCorpus, ...extendedOfficialPolicyCorpus] : officialPolicyCorpus;
  const matched = corpus.filter((policy) => policyMatchesSearchTerms(policy, terms));
  const policies = (matched.length ? matched : corpus).map(({ keywords, ...policy }) => ({
    ...policy,
    selected: options?.selected ?? true,
  }));

  return { policies, total: policies.length };
}

export async function analyzePolicies(selectedPolicies: PolicyItem[]): Promise<{ analysis: ClauseComparison[]; summary: string[] }> {
  await delay(1100);
  const activePolicies = selectedPolicies.filter((policy) => policy.selected);
  const analysis: ClauseComparison[] = activePolicies.map((policy, index) => ({
    id: policy.id,
    policyTitle: policy.title,
    source: policy.source || levelSources[policy.level],
    targetAudience: index % 2 === 0 ? "高新技术企业、专精特新企业" : "重点产业链企业、创新平台主体",
    supportMethod: index % 3 === 0 ? "项目补贴 + 研发奖励" : index % 3 === 1 ? "贷款贴息 + 场景开放" : "人才奖励 + 平台建设支持",
    supportLevel: index % 2 === 0 ? "最高500万元，按项目分档支持" : "按认定等级分层奖励，最高1000万元",
    highlights: [
      { field: index % 2 === 0 ? "supportLevel" : "supportMethod", type: "high" },
      { field: "targetAudience", type: index % 2 === 0 ? "medium" : "unique" },
    ],
  }));

  const summary = [
    "参考政策普遍聚焦高新技术企业、专精特新企业和重点产业链主体。",
    "资金补贴、研发奖励与平台建设支持是最常见的扶持方式。",
    "先进地区在场景开放、贷款贴息和人才配套方面形成了差异化做法。",
    "建议在本地政策中强化分层支持标准，并补充实施细则与兑现路径。",
  ];

  return { analysis, summary };
}

export async function generateCoreElementsFromPolicies(
  selectedPolicies: PolicyItem[],
  policyTitle = "",
): Promise<{
  coreElements: string;
  items: { id: string; text: string; refs: { id: string; title: string; url?: string; clause?: string }[] }[];
}> {
  if (isPolicyLlmConfigured()) {
    try {
      return await llmGenCore(selectedPolicies, policyTitle);
    } catch (e) {
      console.warn("[policyDraftApi] 大模型生成核心要素失败，使用本地模板：", e);
    }
  }

  await delay(900);
  const refs = selectedPolicies.filter(p => p.selected);

  // 简单抽取：基于参考政策标题中的关键词生成要点（模拟）；数据产业示范稿用专用表述
  const examples = isDataIndustryPolicyDraft(policyTitle)
    ? deriveDataIndustryCorePoints(5)
    : [
        "明确适用对象与扶持范围",
        "设定分档扶持标准与资金规模",
        "完善申报审核与兑现机制",
        "建立部门协同与绩效评估",
        "强化资金监管与保障措施",
      ];

  const items = examples.slice(0, Math.max(3, Math.min(5, refs.length))).map((text, i) => ({
    id: `ce-${Date.now()}-${i}`,
    text: `${i + 1}. ${text}`,
    refs: refs.slice(i, i + 2).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      clause: `示例条款：在《${p.title}》中关于「${text}」的相关表述（摘录）`,
    })),
  }));

  const coreElements = items.map(it => it.text).join("\n");
  return { coreElements, items };
}

function buildSubSections(policyTitle: string, coreElements: string, selectedPolicies: PolicyItem[]): OutlineSubSection[] {
  const lines = coreElements
    .split(/\n+/)
    .map((line) => line.replace(/^\d+[.、]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const refs = selectedPolicies.filter((policy) => policy.selected).slice(0, 3);
  const fallback = isDataIndustryPolicyDraft(policyTitle)
    ? deriveDataIndustryCorePoints(5)
    : ["适用对象", "支持方式", "申报机制", "保障措施", "监督评估"];
  const items = (lines.length > 0 ? lines : fallback).map((item, index) => ({
    id: `sub-${index + 1}`,
    title: formatPolicyLevel2(index, item),
    keyPoints: buildSubSectionKeyPoints(policyTitle, item, index),
    referencePolicies: refs.map((policy, refIndex) => ({
      title: policy.title,
      clause: `参考第${refIndex + 1}条与${item}相关表述`,
      url: policy.url,
    })),
  }));

  return items;
}

function buildSubSectionKeyPoints(policyTitle: string, item: string, index: number): string[] {
  if (!isDataIndustryPolicyDraft(policyTitle)) {
    return [
      `围绕${item}明确政策适用边界、执行主体与支持对象分层标准。`,
      `结合《${policyTitle}》细化资金支持、审核程序、兑现时限和绩效约束。`,
      `同步完善部门协同、公开公示、监督评估和动态优化机制。`,
    ];
  }

  const normalized = item.replace(/[。；]/g, "");
  const sourceLines = deriveDataIndustryCorePoints(7);
  const chapterFocus = [
    "重点明确政策目标、适用主体、基本原则与职责分工，确保政策定位与经开区数据产业发展方向一致。",
    "重点细化数据要素流通、数据基础设施和场景开放路径，形成可执行、可量化、可评估的推进机制。",
    "重点完善资金支持、组织实施、监督评估和风险防控，保障政策长期稳定实施。",
  ];
  const focus = chapterFocus[Math.min(index, chapterFocus.length - 1)];

  if (/确权|登记|流通|交易|收益|资产化/.test(normalized)) {
    return [
      `围绕“${normalized}”建立数据资源目录、确权登记、授权运营与收益分配衔接机制，推动数据要素合规流通和资产化应用。`,
      `依托公共数据与行业数据协同，明确数据供给、需求撮合、交易规则与争议处理流程，提升数据要素配置效率。`,
      `对照《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》中“${sourceLines[0]}”的要求，建立年度任务清单和阶段性评估指标。`,
    ];
  }

  if (/算力|标注|可信|基础设施|平台|中试/.test(normalized)) {
    return [
      `围绕“${normalized}”统筹推进算力供给、数据标注、模型训练和可信数据空间建设，强化数据产业公共技术底座。`,
      `明确建设主体、准入标准、运营模式和服务对象，支持公共服务平台与中试验证平台向中小企业开放共享。`,
      `结合“${sourceLines[1]}”，制定平台能力评估、服务绩效考核和财政支持联动机制，确保基础设施投入产出可衡量。`,
    ];
  }

  if (/场景|工业|治理|医疗|商贸|应用/.test(normalized)) {
    return [
      `围绕“${normalized}”构建“场景清单+能力清单+项目清单”联动机制，优先在工业制造、城市治理、医疗健康、商贸流通等领域形成示范项目。`,
      `完善场景开放的遴选标准、供需对接、试点验收和推广复制流程，推动技术创新与产业化应用协同落地。`,
      `参照“${sourceLines[2]}”细化数据开放边界、应用绩效评价和示范项目激励规则，形成可持续场景创新生态。`,
    ];
  }

  if (/安全|合规|分类|分级|审计|保护/.test(normalized)) {
    return [
      `围绕“${normalized}”建立覆盖采集、处理、流通、应用全链条的数据安全与合规体系，明确企业主体责任与监管边界。`,
      `细化数据分类分级、重要数据识别、风险评估、应急响应和安全审计要求，提升政策实施的安全可控性。`,
      `对照“${sourceLines[3]}”建立常态化合规检查和风险预警机制，将安全要求嵌入项目评审、资金兑现与后评估全过程。`,
    ];
  }

  if (/企业|扶持|首升规|专精特新|高新|培育/.test(normalized)) {
    return [
      `围绕“${normalized}”建立企业分层分类支持体系，明确初创、成长、骨干企业在研发投入、市场拓展和能力建设方面的差异化支持。`,
      `细化首升规、专精特新、高新认定等关键节点的奖励条件、兑现标准和政策叠加规则，提升企业政策获得感。`,
      `结合“${sourceLines[4]}”构建企业画像、动态监测和梯度培育机制，推动数据企业持续做大做强。`,
    ];
  }

  return [
    `围绕“${normalized}”完善政策条款设计与实施闭环，${focus}`,
    `结合《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》明确责任分工、实施路径、时序安排与绩效口径，增强条款可操作性。`,
    `参考“${sourceLines[(index + 1) % sourceLines.length]}”的方向，将核心要素转化为具体项目清单、评审标准和监督机制，避免条款空泛重复。`,
  ];
}

export async function generateOutline(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  analysisResult?: ClauseComparison[];
  coreItems?: { id: string; text: string; refs: { id: string; title: string; url?: string; clause?: string }[] }[];
}): Promise<{ outline: OutlineSection[] }> {
  if (isPolicyLlmConfigured()) {
    try {
      return await llmGenOutline({
        policyTitle: params.policyTitle,
        coreElements: params.coreElements,
        selectedPolicies: params.selectedPolicies,
        coreItems: params.coreItems,
      });
    } catch (e) {
      console.warn("[policyDraftApi] 大模型生成大纲失败，使用本地模板：", e);
    }
  }

  await delay(1200);

  // If coreItems provided, use them to build subsections with reference clauses
  const isData = isDataIndustryPolicyDraft(params.policyTitle);
  const refs = params.selectedPolicies.filter((policy) => policy.selected).slice(0, 3);

  const measureSubSections = params.coreItems && params.coreItems.length > 0
    ? params.coreItems.map((it, index) => ({
        id: `sub-${index + 1}`,
        title: formatPolicyLevel2(index, it.text.replace(/^\d+[.、]\s*/, "")),
        keyPoints: buildSubSectionKeyPoints(params.policyTitle, it.text.replace(/^\d+[.、]\s*/, ""), index),
        referencePolicies: it.refs.map((r) => ({
          title: r.title,
          clause: r.clause || "（参考该政策相关条款）",
          url: r.url,
        })),
      }))
    : buildSubSections(params.policyTitle, params.coreElements, params.selectedPolicies);

  const goalSubSection: OutlineSubSection = {
    id: "goal-1",
    title: formatPolicyLevel2(0, "发展目标"),
    keyPoints: isData
      ? [
          "围绕北京经济技术开发区数据产业高质量发展，明确总体定位、阶段目标和年度推进节奏。",
          "聚焦数据要素市场化配置改革，形成“制度完善、平台支撑、场景牵引、企业集聚”的发展路径。",
          "坚持统筹发展与安全，推动政策目标、产业目标和治理目标协同落地。",
        ]
      : [
          `围绕《${params.policyTitle}》明确政策实施目标、覆盖对象和预期成效。`,
          "细化近期与中期目标，形成可衡量、可评估的推进路线图。",
          "强化目标导向与问题导向结合，提升政策的系统性和可执行性。",
        ],
    referencePolicies: refs.map((policy, idx) => ({
      title: policy.title,
      clause: `参考第${idx + 1}条与总体目标相关表述`,
      url: policy.url,
    })),
  };

  const finalSubSection: OutlineSubSection = {
    id: "final-1",
    title: formatPolicyLevel2(0, "实施与解释"),
    keyPoints: isData
      ? [
          "明确本措施实施期限、适用范围、职责分工和政策解释主体。",
          "建立政策评估与动态优化机制，对执行效果、资金绩效和风险防控进行跟踪复盘。",
          "做好与既有产业政策衔接，避免条款冲突与重复支持。",
        ]
      : [
          "明确政策实施期限、适用边界和组织保障要求。",
          "建立定期评估与动态优化机制，及时完善配套细则。",
          "由主管部门负责解释，并做好与现行政策体系衔接。",
        ],
    referencePolicies: refs.map((policy, idx) => ({
      title: policy.title,
      clause: `参考第${idx + 1}条与附则相关表述`,
      url: policy.url,
    })),
  };

  const outline: OutlineSection[] = [
    {
      id: "part-1",
      title: formatPolicyLevel1(0, "总体目标"),
      keyPoints: [],
      subSections: [goalSubSection],
    },
    {
      id: "part-2",
      title: formatPolicyLevel1(1, "工作举措"),
      keyPoints: [],
      subSections: measureSubSections,
    },
    {
      id: "part-3",
      title: formatPolicyLevel1(2, "附则"),
      keyPoints: [],
      subSections: [finalSubSection],
    },
  ].filter(
    (section) =>
      section.subSections.length > 0 || (section.keyPoints ?? []).some((p) => p.trim()),
  );

  return { outline };
}

export async function generateContent(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  outline: OutlineSection[];
}): Promise<{ content: string; citations: Citation[] }> {
  const references = params.selectedPolicies.filter((policy) => policy.selected).slice(0, 4);
  const citations: Citation[] = references.map((policy, index) => ({
    index: index + 1,
    title: policy.title,
    url: policy.url,
    source: policy.source,
  }));

  if (isPolicyLlmConfigured()) {
    try {
      const { content } = await llmGeneratePolicyBody(params);
      return { content: formatPolicyContent(content, params.policyTitle), citations };
    } catch (e) {
      console.warn("[policyDraftApi] 大模型生成正文失败，使用本地模板：", e);
    }
  }

  await delay(1500);
  const isData = isDataIndustryPolicyDraft(params.policyTitle);

  const sections = params.outline.flatMap((section, sectionIndex) => {
    const header = section.title.trim().match(/^[一二三四五六七八九十]+、/)
      ? section.title
      : formatPolicyLevel1(sectionIndex, section.title);
    const body = section.subSections.flatMap((subSection, subIndex) => {
      const level2Title = subSection.title.trim().match(/^[（(][一二三四五六七八九十\d]+[）)]/)
        ? subSection.title
        : formatPolicyLevel2(subIndex, subSection.title);
      return [level2Title, ...buildSubSectionBody(subSection, subIndex, citations, isData)];
    });
    return [header, "", ...body, ""];
  });

  const intro = isData
    ? "为贯彻落实国家关于构建数据基础制度、加快数据要素市场化配置改革的部署，加快推进北京经济技术开发区数据产业高质量发展，营造数据要素高效流通与创新应用的良好生态，结合本区实际，制定本措施。"
    : "为深入贯彻区域高质量发展要求，进一步优化政策供给体系，结合本区实际，制定本政策。";

  const content = isData
    ? [
        params.policyTitle,
        "",
        "各有关单位：",
        "",
        `${intro}`,
        "现提出如下措施，请结合实际认真贯彻执行。",
        "",
        ...sections,
        "本措施由北京经济技术开发区相关主管部门负责解释，自发布之日起施行。此前相关政策与本措施不一致的，以本措施为准。",
        "",
        "北京经济技术开发区管理委员会",
        `${new Date().toLocaleDateString("zh-CN")}`,
      ].join("\n")
    : [
        params.policyTitle,
        "",
        intro,
        "",
        ...sections,
        formatPolicyLevel1(2, "附则"),
        "",
        formatPolicyLevel2(0, "解释与施行"),
        formatPolicyLevel3(0, "本政策由区级主管部门负责解释"),
        formatPolicyLevel3(1, "此前相关政策与本政策不一致的，以本政策为准"),
        formatPolicyLevel3(2, "本政策自发布之日起施行"),
      ].join("\n");

  return { content: formatPolicyContent(content, params.policyTitle), citations };
}

export async function generateCoreElements(policyTitle: string): Promise<{ coreElements: string }> {
  await delay(700);
  if (isDataIndustryPolicyDraft(policyTitle)) {
    const extractedPoints = deriveDataIndustryCorePoints(5);
    return {
      coreElements: extractedPoints.map((line, i) => `${i + 1}. ${line}`).join("\n"),
    };
  }
  return {
    coreElements: [
      `1. 围绕《${policyTitle}》明确适用对象和支持范围`,
      "2. 设定资金奖励、场景开放和平台建设等扶持方式",
      "3. 细化企业申报条件、审核机制与兑现路径",
      "4. 建立部门协同推进与年度绩效跟踪机制",
      "5. 强化监督管理、资金使用规范与动态优化调整",
    ].join("\n"),
  };
}
