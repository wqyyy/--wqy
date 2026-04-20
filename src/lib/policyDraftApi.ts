import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";
import type { ClauseComparison } from "@/components/policy-drafting/drafting/PolicyAnalysisStep";
import type { OutlineSection, OutlineSubSection } from "@/components/policy-drafting/drafting/OutlineGenerationStep";
import { deriveDataIndustryCorePoints, isDataIndustryPolicyDraft } from "@/lib/samplePolicyDocuments";

export type { OutlineSubSection };

export interface Citation {
  index: number;
  title: string;
  url: string;
  source?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const levelSources: Record<PolicyItem["level"], string> = {
  national: "国家发展改革委",
  beijing: "北京市人民政府",
  other: "先进地区参考",
};

function slug(input: string) {
  return input
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export type SearchPoliciesOptions = {
  /** 为 true 时在结果中优先展示「我的素材库」中的参考条目（默认 true） */
  prioritizeMyLibrary?: boolean;
  /** 额外检索关键词（用于“检索更多”） */
  query?: string;
  /** 追加模式：新增结果默认不勾选 */
  appendMode?: boolean;
};

export async function searchPolicies(
  policyTitle: string,
  coreElements?: string,
  options?: SearchPoliciesOptions,
): Promise<{ policies: PolicyItem[]; total: number }> {
  await delay(900);
  const prioritizeMyLibrary = options?.prioritizeMyLibrary !== false;
  const keyword = isDataIndustryPolicyDraft(policyTitle)
    ? "数据产业"
    : policyTitle.replace(/^关于|若干政策措施$|政策措施$/g, "").slice(0, 12) || "产业发展";
  const query = options?.query?.trim();
  const effectiveKeyword = query || keyword;
  const defaultSelected = options?.appendMode ? false : true;
  const policies: PolicyItem[] = [
    {
      id: "national-1",
      title: `国家层面关于支持${effectiveKeyword}高质量发展的指导意见`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-national-1`,
      selected: defaultSelected,
      level: "national",
      source: levelSources.national,
    },
    {
      id: "national-2",
      title: `关于促进${effectiveKeyword}技术创新与成果转化的实施方案`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-national-2`,
      selected: defaultSelected,
      level: "national",
      source: "工业和信息化部",
    },
    {
      id: "beijing-1",
      title: `北京市关于加快${effectiveKeyword}产业布局的若干措施`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-beijing-1`,
      selected: defaultSelected,
      level: "beijing",
      source: levelSources.beijing,
    },
    {
      id: "beijing-2",
      title: `北京市支持${effectiveKeyword}企业创新发展的专项政策`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-beijing-2`,
      selected: defaultSelected,
      level: "beijing",
      source: "北京市经济和信息化局",
    },
    {
      id: "other-1",
      title: `先进地区${effectiveKeyword}产业扶持政策对比样本`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-other-1`,
      selected: defaultSelected,
      level: "other",
      source: levelSources.other,
    },
    {
      id: "other-2",
      title: `${effectiveKeyword}重点企业培育与招商支持政策`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-other-2`,
      selected: defaultSelected,
      level: "other",
      source: "示范园区政策库",
    },
  ];

  if (coreElements?.trim()) {
    policies.push({
      id: "beijing-3",
      title: `北京市围绕核心要素完善${effectiveKeyword}政策体系的实施意见`,
      url: `https://example.com/policies/${slug(effectiveKeyword)}-beijing-3`,
      selected: defaultSelected,
      level: "beijing",
      source: "北京市政策研究室",
    });
  }

  if (prioritizeMyLibrary && !options?.appendMode) {
    const myLibraryItems: PolicyItem[] = [
      {
        id: "mylib-1",
        title: `【我的素材库】与您草稿相关的${effectiveKeyword}专项收藏`,
        url: `https://example.com/my-library/${slug(effectiveKeyword)}-saved-1`,
        selected: true,
        level: "beijing",
        source: "我的素材库",
      },
      {
        id: "mylib-2",
        title: `【我的素材库】近期收藏的${effectiveKeyword}配套细则`,
        url: `https://example.com/my-library/${slug(effectiveKeyword)}-saved-2`,
        selected: true,
        level: "national",
        source: "我的素材库",
      },
    ];
    policies.unshift(...myLibraryItems);
  }

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
    title: `第${index + 1}条 ${item}`,
    keyPoints: buildSubSectionKeyPoints(policyTitle, item, index),
    referencePolicies: refs.map((policy, refIndex) => ({
      title: policy.title,
      clause: `参考第${refIndex + 1}条与${item}相关表述`,
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
  await delay(1200);

  // If coreItems provided, use them to build subsections with reference clauses
  const isData = isDataIndustryPolicyDraft(params.policyTitle);
  const refs = params.selectedPolicies.filter((policy) => policy.selected).slice(0, 3);

  const measureSubSections = params.coreItems && params.coreItems.length > 0
    ? params.coreItems.map((it, index) => ({
        id: `sub-${index + 1}`,
        title: `第${index + 1}条 ${it.text.replace(/^\d+[.、]\s*/, "")}`,
        keyPoints: buildSubSectionKeyPoints(params.policyTitle, it.text.replace(/^\d+[.、]\s*/, ""), index),
        referencePolicies: it.refs.map(r => ({ title: r.title, clause: r.clause || "（参考该政策相关条款）" })),
      }))
    : buildSubSections(params.policyTitle, params.coreElements, params.selectedPolicies);

  const goalSubSection: OutlineSubSection = {
    id: "goal-1",
    title: "（一）发展目标",
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
    })),
  };

  const finalSubSection: OutlineSubSection = {
    id: "final-1",
    title: "（一）实施与解释",
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
    })),
  };

  const outline: OutlineSection[] = [
    {
      id: "part-1",
      title: "一、总体目标",
      subSections: [goalSubSection],
    },
    {
      id: "part-2",
      title: "二、工作举措",
      subSections: measureSubSections,
    },
    {
      id: "part-3",
      title: "三、附则",
      subSections: [finalSubSection],
    },
  ].filter((section) => section.subSections.length > 0);

  return { outline };
}

export async function generateContent(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  outline: OutlineSection[];
}): Promise<{ content: string; citations: Citation[] }> {
  await delay(1500);
  const isData = isDataIndustryPolicyDraft(params.policyTitle);
  const references = params.selectedPolicies.filter((policy) => policy.selected).slice(0, 4);
  const citations: Citation[] = references.map((policy, index) => ({
    index: index + 1,
    title: policy.title,
    url: policy.url,
    source: policy.source,
  }));

  const buildFormalClause = (subTitle: string, points: string[], idx: number) => {
    const citation = citations[idx % Math.max(citations.length, 1)];
    const citeTag = citation ? `[ref:${citation.index}]` : "";
    const p1 = points[0] || "明确政策实施范围和重点任务";
    const p2 = points[1] || "细化支持方式、申报条件与兑现流程";
    const p3 = points[2] || "建立监督评估和动态优化机制";

    if (isData) {
      return [
        `${subTitle}`,
        `建立任务清单并明确责任分工，细化实施对象、支持标准和完成时限；设置申报受理、评审认定、公示复核、资金拨付等办理环节，统一材料清单和审核口径；对符合条件的市场主体按程序纳入政策台账，实行全过程留痕管理；建立月度调度、季度评估和年度复盘机制，对执行偏差及时纠偏并开展动态优化。${p1}。${p2}。${p3}。${citeTag}`,
      ];
    }

    return [
      `${subTitle}`,
      `明确执行主体、实施对象和办理时限，形成可操作的任务清单；将申报受理、审核认定、结果公示和资金兑现纳入统一流程管理，确保口径一致、节点清晰；建立监督检查与绩效评估机制，对实施成效进行量化复盘，并根据评估结果及时完善配套细则。${p1}。${p2}。${p3}。${citeTag}`,
    ];
  };

  const sections = params.outline.flatMap((section) => {
    const header = `${section.title}`;
    const body = section.subSections.flatMap((subSection, index) =>
      buildFormalClause(subSection.title, subSection.keyPoints, index)
    );
    return [header, ...body, ""];
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
        "第四章 附则",
        "本政策由区级主管部门负责解释，自发布之日起施行。",
      ].join("\n");

  return { content, citations };
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
