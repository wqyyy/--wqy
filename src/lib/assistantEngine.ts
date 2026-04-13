import { POLICY_ITEMS, PUSHED_COMPANIES } from "@/data/policyReachData";
import { dashboardData, policyReports } from "@/data/mockData";

export type AssistantSceneKey = "writing" | "reach" | "redeem" | "evaluation";

export type AssistantScene = {
  key: AssistantSceneKey;
  label: string;
  prompt: string;
  placeholder: string;
  suggestions: { title: string; desc: string }[];
};

export type AssistantMessageAction = {
  label: string;
  /** 忽略未完成草稿提醒时不跳转 */
  path?: string;
  search?: Record<string, string>;
  state?: Record<string, unknown>;
  dismissIncompleteDraft?: boolean;
  draftSignature?: string;
};

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
  /** 消息附带的可点击跳转操作 */
  actions?: AssistantMessageAction[];
  /**
   * 流式起草消息：当前已输出的政策全文片段
   * 非空时 content 作为标题/前言，streamContent 作为正文流式渲染
   */
  streamContent?: string;
  /** 流式输出完成标志 */
  streamDone?: boolean;
  /** 流式起草对应的政策标题（用于跳转） */
  streamPolicyTitle?: string;
  /** 待输出的完整内容（仅前端运行时使用，不持久化） */
  streamFullContent?: string;
};

export type AssistantPlan = {
  reply: string;
  actions?: AssistantMessageAction[];
  action?:
    | { kind: "navigate"; path: string; search?: Record<string, string>; state?: Record<string, unknown> }
    | { kind: "none" }
    | { kind: "stream_draft"; policyTitle: string; fullContent: string };
  source: "model" | "fallback";
};

type AssistantIntent =
  | "write_policy"
  | "search_policy"
  | "analyze_policy"
  | "view_data"
  | "view_report"
  | "other";

/** 根据政策标题生成一份模拟的政策全文（用于助手内流式输出） */
export function generateMockPolicyContent(title: string): string {
  const keyword = title.replace(/^关于|若干政策措施$|政策$|产业政策$/g, "").trim() || "数据产业";
  return `关于促进${keyword}高质量发展的若干政策措施

第一章 总则

第一条【目的依据】为深入贯彻党中央、国务院关于推动${keyword}高质量发展的决策部署，加快构建现代产业体系，根据相关法律法规，结合本市实际，制定本政策措施。

第二条【适用范围】本政策措施适用于在本市依法注册登记，从事${keyword}相关业务的企业、科研机构及其他组织。

第三条【基本原则】坚持政府引导、市场主导；坚持创新驱动、开放合作；坚持系统推进、重点突破；坚持安全发展、合规经营。

第二章 支持政策

第四条【研发投入支持】对${keyword}领域企业年度研发投入超过上年度50%以上的，按超出部分的20%给予补贴，最高不超过200万元。

第五条【企业认定奖励】对首次认定为国家级高新技术企业的${keyword}相关企业，给予一次性奖励20万元；连续认定的，每次给予10万元奖励。

第六条【知识产权激励】对获得国家发明专利授权的企业，每项给予5万元奖励；对主导制定国际标准的企业给予100万元奖励，每家企业每年最高不超过50万元。

第七条【人才引进支持】对引进${keyword}领域高层次人才的企业，按照人才认定等级给予相应安家补贴和科研经费支持，具体标准另行制定。

第三章 服务保障

第八条【一网通办】${keyword}相关业务许可、认定、备案等事项全面纳入政务服务平台，实现"一网通办"，办理时限压缩至1个工作日。

第九条【部门协同】市主管部门负责统筹协调，发展改革、财政、市场监管等部门按照职责分工共同推进本政策措施落实。

第十条【绩效评估】建立政策实施绩效评估机制，每年开展一次综合评估，评估结果作为政策调整优化的重要依据。

第四章 附则

第十一条【解释权】本政策措施由市主管部门负责解释。

第十二条【施行日期】本政策措施自发布之日起施行，有效期三年。`;
}

export const fallbackCoreElements =
  "1. 政策适用范围与对象\n2. 扶持标准与补贴金额\n3. 申报条件与流程\n4. 资金来源与保障措施\n5. 监督管理与绩效评估";

const evaluationPolicies = [
  "北京经开区产业发展促进办法",
  "科技创新企业扶持专项",
  "中小企业融资支持政策",
];

export const sceneConfigs: Record<AssistantSceneKey, AssistantScene> = {
  writing: {
    key: "writing",
    label: "政策制定",
    prompt: "当前在政策制定页面。需要我帮您起草、检索政策，也可以直接问我触达、兑现或评价相关问题。",
    placeholder: "请输入任意政策问题，如起草、检索、触达、兑现或评价需求",
    suggestions: [
      { title: "起草数据产业政策", desc: "自动带入标题并生成核心要素" },
      { title: "检索人工智能政策", desc: "联动打开政策检索结果" },
      { title: "查询营商环境政策", desc: "优先查找可参考的相关政策" },
    ],
  },
  reach: {
    key: "reach",
    label: "政策触达",
    prompt: "当前在政策触达页面。需要推送什么政策，或也可以直接问我制定、兑现、评价相关问题。",
    placeholder: "请输入任意政策问题，如推送目标、企业画像、兑现或评价需求",
    suggestions: [
      { title: "推送高新技术企业认定奖励", desc: "自动定位对应事项" },
      { title: "查看北京智芯科技有限公司", desc: "自动展开企业触达详情" },
      { title: "筛选绿色低碳政策", desc: "联动事项列表搜索" },
    ],
  },
  redeem: {
    key: "redeem",
    label: "政策兑现",
    prompt: "当前在政策兑现页面。需要查看哪些兑现指标或数据维度，也可以直接问我其他政策问题。",
    placeholder: "请输入任意政策问题，如兑现指标、专报、起草或评价需求",
    suggestions: [
      { title: "查看资金兑现情况", desc: "切换到兑现资金视图" },
      { title: "看扶持企业分布", desc: "定位扶持企业相关指标" },
      { title: "查看第四季度政策兑现专报", desc: "直接打开对应专报" },
    ],
  },
  evaluation: {
    key: "evaluation",
    label: "政策评价",
    prompt: "当前在政策评价页面。需要评估哪项政策，或也可以直接问我制定、触达、兑现相关问题。",
    placeholder: "请输入任意政策问题，如评估对象、报告、起草或触达需求",
    suggestions: [
      { title: "评估北京经开区产业发展促进办法", desc: "直接生成对应评价分析" },
      { title: "查看科技创新企业扶持专项报告", desc: "快速调取评价结果" },
      { title: "生成中小企业融资支持政策评价报告", desc: "进入报告生成流程" },
    ],
  },
};

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, "").trim();

const trimIntentPrefix = (text: string, patterns: RegExp[]) => {
  let result = text.trim();
  patterns.forEach((pattern) => {
    result = result.replace(pattern, "");
  });
  return result.trim();
};

const findPolicyItem = (text: string) => {
  const n = normalize(text);
  return POLICY_ITEMS.find((item) => normalize(item.title).includes(n) || n.includes(normalize(item.title)));
};

const findCompany = (text: string) => {
  const n = normalize(text);
  return PUSHED_COMPANIES.find((item) => normalize(item.name).includes(n) || n.includes(normalize(item.name)));
};

const findReport = (text: string) => {
  const n = normalize(text);
  return policyReports.find((item) => normalize(item.title).includes(n) || n.includes(normalize(item.title)));
};

const findEvaluationPolicy = (text: string) => {
  const n = normalize(text);
  return evaluationPolicies.find((item) => normalize(item).includes(n) || n.includes(normalize(item)));
};

const likelyPolicySuffix = /(政策|办法|措施|方案|意见|通知|细则|条例|指引|规范)$/;

const isLikelyPolicyTitle = (text: string) => {
  const value = text.trim();
  if (!value) return false;
  if (value.length > 40) return false;
  if (/[?？]/.test(value)) return false;
  if (/^(帮我|请你|请帮我|查|搜索|检索|分析|对比|写|起草|查看|我想看)/.test(value)) return false;
  return likelyPolicySuffix.test(value) || value.includes("关于");
};

const stripCommonPrefixes = (text: string) =>
  text
    .replace(/^(帮我|请你|请帮我|麻烦|我想|我想要|我需要|需要|请|想要)/, "")
    .replace(/^(帮忙|帮忙把)/, "")
    .trim();

const extractWriteTitle = (text: string) => {
  const cleaned = stripCommonPrefixes(text)
    .replace(/^(写一篇|写一份|写个|写|起草一篇|起草一份|起草|撰写一篇|撰写一份|撰写|草拟)/, "")
    .replace(/^(关于|围绕)/, "")
    .replace(/(的政策文件|政策文件|政策内容|政策|方案|措施)$/g, "")
    .trim();

  if (!cleaned) return "政策文件";
  if (likelyPolicySuffix.test(cleaned) || cleaned.includes("关于")) return cleaned;
  return `关于${cleaned}的若干政策措施`;
};

const extractSearchKeyword = (text: string) => {
  const cleaned = stripCommonPrefixes(text)
    .replace(/^(帮我查找|帮我查|查找|检索|搜索|查一下|查一查|查询|帮我找|找一下|找找|找|看看|查)/, "")
    .replace(/^(一些|一下|一下子)/, "")
    .replace(/(有哪些政策|相关的政策|相关政策|政策有哪些|方面的政策|方面政策|政策)$/g, "")
    .trim();

  return cleaned || text.trim();
};

const extractAnalysisTopic = (text: string) =>
  stripCommonPrefixes(text)
    .replace(/^(分析|对比分析|对比|比较|帮我分析|帮我对比)/, "")
    .replace(/(相关政策|政策内容|政策)$/g, "")
    .trim() || text.trim();

const extractReportKeyword = (text: string) =>
  stripCommonPrefixes(text)
    .replace(/^(我想看一下|我想看|查一下|查看|看一下|看|调取|打开)/, "")
    .replace(/(报告详情|报告|专报)$/g, "")
    .trim();

const summarizeData = (text: string) => {
  const focus = /发布/.test(text)
    ? "publish"
    : /资金|金额|拨付|补贴/.test(text)
      ? "funds"
      : /企业|主体|覆盖/.test(text)
        ? "enterprise"
        : "items";

  if (focus === "publish") {
    return {
      focus,
      summary: `经开区当前累计发布政策 ${dashboardData.policyPublished} 项、政策解读 ${dashboardData.policyInterpreted} 项、发布事项 ${dashboardData.itemsPublished} 项。国家级 ${dashboardData.policyByLevel[0].count} 项，北京市级 ${dashboardData.policyByLevel[1].count} 项，经开区级 ${dashboardData.policyByLevel[2].count} 项。`,
    };
  }

  if (focus === "funds") {
    return {
      focus,
      summary: `当前本月已拨付资金 ${dashboardData.redeemedFunds.totalMonthly.toLocaleString()} 万元。资金主要集中在科技创新、产业升级和人才引进领域，其中科技创新类占比最高。`,
    };
  }

  if (focus === "enterprise") {
    return {
      focus,
      summary: `当前累计扶持企业 ${dashboardData.supportedEnterprises.total.toLocaleString()} 家，主要覆盖新一代信息技术、生物医药和其他重点产业，中小企业占比较高。`,
    };
  }

  return {
    focus,
    summary: `当前累计兑现事项 ${dashboardData.redeemedItems.total} 项，近年兑现数量在 2024 年达到高峰，科技创新和产业升级是主要扶持方向。`,
  };
};

const searchContext = {
  writingPolicies: [
    "人工智能政策",
    "数据产业政策",
    "营商环境政策",
    "绿色低碳政策",
    "人才政策",
  ],
  reachItems: POLICY_ITEMS.map((item) => ({ id: item.id, title: item.title })),
  reachCompanies: PUSHED_COMPANIES.slice(0, 20).map((item) => ({ id: item.id, policyId: item.policyId, name: item.name })),
  reports: policyReports.map((item) => ({ id: item.id, title: item.title })),
  evaluationPolicies,
};

function detectIntent(text: string): AssistantIntent {
  const normalized = text.trim();
  if (!normalized) return "other";

  if (/^(帮我写|请你写|写一篇|写一份|写个|写.*政策|起草|撰写|草拟)/.test(normalized)) {
    return "write_policy";
  }

  if (/^(分析|对比|对比分析|比较|帮我分析|帮我对比)/.test(normalized)) {
    return "analyze_policy";
  }

  if (/^(我想看一下|我想看|查一下|查看|看一下|看).*(报告|专报)$/.test(normalized) || /(报告|专报)$/.test(normalized)) {
    return "view_report";
  }

  if (/查.*数据|数据$|兑现数据|指标|数据维度/.test(normalized)) {
    return "view_data";
  }

  if (/^(帮我查|查找|检索|搜索|查询|帮我找|找一下|找找|看看).*(政策)?/.test(normalized) || /有哪些政策|相关政策/.test(normalized) || isLikelyPolicyTitle(normalized)) {
    return "search_policy";
  }

  if (findCompany(normalized) || findPolicyItem(normalized) || /推送|触达|匹配|画像|目标企业/.test(normalized)) {
    return "other";
  }

  return "other";
}

function buildFallbackPlan(scene: AssistantScene, rawText: string): AssistantPlan {
  const text = rawText.replace(/[？?]/g, "").replace(/请问|帮我|麻烦|想要|需要|我想|我需要|我想要/g, "").trim();
  if (!text) {
    return { reply: scene.prompt, action: { kind: "none" }, source: "fallback" };
  }

  const intent = detectIntent(rawText);

  if (intent === "search_policy") {
    const keyword = extractSearchKeyword(rawText);
    return {
      reply: `已为您检索“${keyword}”相关政策，左侧页面已联动展示检索结果。`,
      action: { kind: "navigate", path: "/policy-writing/search", search: { q: keyword, target: "title" } },
      source: "fallback",
    };
  }

  if (intent === "write_policy") {
    const title = extractWriteTitle(rawText);
    const fullContent = generateMockPolicyContent(title);
    return {
      reply: `正在为您起草「${title}」，请稍候…`,
      action: {
        kind: "stream_draft",
        policyTitle: title,
        fullContent,
      },
      source: "fallback",
    };
  }

  if (intent === "analyze_policy") {
    const topic = extractAnalysisTopic(rawText);
    return {
      reply: `已完成对“${topic}”的初步分析：\n1. 政策目标通常聚焦产业培育、企业扶持和要素保障。\n2. 关键看点建议重点比较支持对象、补贴方式、资金强度和申报门槛。\n3. 如果是跨地区对比，还应关注奖励标准、覆盖范围和兑现机制差异。\n4. 建议进一步结合原文条款逐项比对，以形成更完整的分析结论。`,
      actions: [
        {
          label: "打开对比分析页",
          path: "/policy-writing/analysis",
        },
      ],
      action: { kind: "none" },
      source: "fallback",
    };
  }

  if (intent === "view_data") {
    const dataSummary = summarizeData(rawText);
    return {
      reply: `${dataSummary.summary} 左侧已为您打开对应的数据看板。`,
      action: { kind: "navigate", path: "/effect-dashboard", search: { focus: dataSummary.focus } },
      source: "fallback",
    };
  }

  if (intent === "view_report") {
    const keyword = extractReportKeyword(rawText);
    const reportMatches = policyReports.filter((item) => {
      if (!keyword) return true;
      const n = normalize(keyword);
      return normalize(item.title).includes(n) || n.includes(normalize(item.title));
    }).slice(0, 5);

    if (reportMatches.length > 0) {
      return {
        reply: keyword
          ? `已为您找到 ${reportMatches.length} 份与“${keyword}”相关的报告，可点击下方结果查看详情。`
          : "已为您匹配到以下报告，可点击查看详情。",
        actions: reportMatches.map((item) => ({
          label: item.title,
          path: `/policy-report/${item.id}`,
        })),
        action: { kind: "none" },
        source: "fallback",
      };
    }

    const evaluationPolicy = findEvaluationPolicy(rawText);
    if (evaluationPolicy) {
      return {
        reply: `已为您匹配到“${evaluationPolicy}”的评价报告入口，可点击查看完整分析结果。`,
        actions: [
          {
            label: `${evaluationPolicy}评价报告`,
            path: "/policy-analysis",
            search: { policy: evaluationPolicy },
          },
        ],
        action: { kind: "none" },
        source: "fallback",
      };
    }

    return {
      reply: "暂未找到完全匹配的报告，您可以换一个报告名称，或先进入专报列表继续筛选。",
      actions: [
        { label: "打开专报列表", path: "/policy-report" },
      ],
      action: { kind: "none" },
      source: "fallback",
    };
  }

  const company = findCompany(text);
  if (company) {
    return {
      reply: `已为您定位企业“${company.name}”，左侧页面已自动展开对应触达详情。`,
      action: {
        kind: "navigate",
        path: "/policy-reach",
        search: { itemId: company.policyId, companyId: company.id, q: company.name },
      },
      source: "fallback",
    };
  }

  const item = findPolicyItem(text);
  if (item) {
    return {
      reply: `已为您打开“${item.title}”的触达详情，左侧页面可继续查看匹配企业。`,
      action: {
        kind: "navigate",
        path: "/policy-reach",
        search: { itemId: item.id, q: item.title },
      },
      source: "fallback",
    };
  }

  if (scene.key === "reach") {
    const company = findCompany(text);
    if (company) {
      return {
        reply: `已为您定位企业“${company.name}”，左侧页面已自动展开对应触达详情。`,
        action: {
          kind: "navigate",
          path: "/policy-reach",
          search: { itemId: company.policyId, companyId: company.id, q: company.name },
        },
        source: "fallback",
      };
    }

    const item = findPolicyItem(text);
    if (item) {
      return {
        reply: `已为您打开“${item.title}”的触达详情，左侧页面可继续查看匹配企业。`,
        action: {
          kind: "navigate",
          path: "/policy-reach",
          search: { itemId: item.id, q: item.title },
        },
        source: "fallback",
      };
    }

    const keyword = trimIntentPrefix(text, [/^(推送|触达|查找|筛选|查看)/, /相关企业$/, /相关政策$/]) || text;
    return {
      reply: `已按“${keyword}”筛选触达事项，左侧列表已同步更新。`,
      action: { kind: "navigate", path: "/policy-reach", search: { q: keyword } },
      source: "fallback",
    };
  }

  if (scene.key === "evaluation") {
    const policy = findEvaluationPolicy(text) || trimIntentPrefix(text, [/^(评估|查看|生成|调取)/, /评价报告$/, /报告$/, /政策$/]) || text;
    return {
      reply: `已为您调取“${policy}”的评价分析结果，左侧页面正在生成或展示对应报告。`,
      action: { kind: "navigate", path: "/policy-analysis", search: { policy } },
      source: "fallback",
    };
  }

  if (scene.key === "writing") {
    const wantsSearch = /检索|查询|搜索|查找|参考|看看|找/.test(text);
    if (wantsSearch) {
      const keyword = extractSearchKeyword(text);
      return {
        reply: `已为您检索“${keyword}”相关政策，左侧页面已联动展示检索结果。`,
        action: { kind: "navigate", path: "/policy-writing/search", search: { q: keyword, target: "title" } },
        source: "fallback",
      };
    }

    const title = extractWriteTitle(text);
    return {
      reply: `已根据“${title}”创建起草任务，并自动带入政策标题和核心要素。`,
      action: {
        kind: "navigate",
        path: "/policy-writing/drafting",
        state: {
          initialTitle: title,
          initialCoreElements: fallbackCoreElements,
          autoGenerateCoreElements: true,
        },
      },
      source: "fallback",
    };
  }

  return { reply: scene.prompt, action: { kind: "none" }, source: "fallback" };
}

async function requestOpenAIText(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) throw new Error("openai_text_failed");
  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content ?? null;
}

async function tryModelDraftPlan(input: string): Promise<AssistantPlan | null> {
  const title = extractWriteTitle(input);
  const content = await requestOpenAIText(
    "你是政府政策起草专家。请根据用户给出的政策主题，直接输出一份正式、完整、结构化的政策初稿正文，语言正式，包含标题、总则、支持措施、保障机制、附则。",
    `请起草：${title}`,
  );

  if (!content) return null;
  return {
    reply: `正在为您起草「${title}」，请稍候…`,
    action: { kind: "stream_draft", policyTitle: title, fullContent: content },
    source: "model",
  };
}

async function tryModelAnalysisPlan(input: string): Promise<AssistantPlan | null> {
  const topic = extractAnalysisTopic(input);
  const content = await requestOpenAIText(
    "你是政策分析专家。请围绕用户提出的政策分析主题，输出结构化中文分析。至少包含：分析对象、关键差异、支持方式、适用对象、奖励力度、结论建议。若用户表达的是地区对比，要做清晰对比。",
    `请分析：${topic}`,
  );

  if (!content) return null;
  return {
    reply: content,
    actions: [
      { label: "打开对比分析页", path: "/policy-writing/analysis" },
    ],
    action: { kind: "none" },
    source: "model",
  };
}

async function callConfiguredAssistantApi(scene: AssistantScene, input: string, history: AssistantMessage[]): Promise<AssistantPlan | null> {
  const apiUrl = import.meta.env.VITE_ASSISTANT_API_URL as string | undefined;
  if (!apiUrl) return null;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scene, input, history, context: searchContext }),
  });

  if (!response.ok) throw new Error("assistant_api_failed");
  const result = (await response.json()) as AssistantPlan;
  if (!result?.reply) throw new Error("assistant_api_invalid");
  return { ...result, source: "model" };
}

async function callOpenAI(scene: AssistantScene, input: string, history: AssistantMessage[]): Promise<AssistantPlan | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const model = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || "gpt-4.1-mini";
  const systemPrompt = [
    "你是惠企政策大脑中的全局智能助手。",
    "用户在任意页面都可以询问政策制定、政策触达、政策兑现、政策评价四个模块中的任何问题。",
    "你的任务是理解用户意图，并返回结构化 JSON，用于驱动页面联动。",
    "你必须同时给出自然中文回复 reply，以及可执行 action。",
    "action 只允许 kind 为 navigate 或 none。",
    "如果是 navigate，返回 path，并可选 search 和 state。",
    "不要返回 markdown，不要解释 JSON 之外的内容。",
    `当前页面上下文：${scene.label}`,
    `当前页面主动提示：${scene.prompt}`,
    `可联动的上下文数据：${JSON.stringify(searchContext)}`,
    "JSON schema: {\"reply\": string, \"action\": {\"kind\": \"navigate\"|\"none\", \"path\"?: string, \"search\"?: object, \"state\"?: object }}",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((message) => ({ role: message.role, content: message.content })),
        { role: "user", content: input },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("openai_request_failed");
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("openai_empty_response");
  const parsed = JSON.parse(content) as Omit<AssistantPlan, "source">;
  if (!parsed?.reply) throw new Error("openai_invalid_response");
  return { ...parsed, source: "model" };
}

export async function getAssistantPlan(scene: AssistantScene, input: string, history: AssistantMessage[]): Promise<AssistantPlan> {
  const intent = detectIntent(input);

  if (intent === "write_policy") {
    try {
      const plan = await tryModelDraftPlan(input);
      if (plan) return plan;
    } catch {
      // fallback below
    }
    return buildFallbackPlan(scene, input);
  }

  if (intent === "analyze_policy") {
    try {
      const plan = await tryModelAnalysisPlan(input);
      if (plan) return plan;
    } catch {
      // fallback below
    }
    return buildFallbackPlan(scene, input);
  }

  try {
    const apiPlan = await callConfiguredAssistantApi(scene, input, history);
    if (apiPlan) return apiPlan;
  } catch {
    // fallback to next provider
  }

  try {
    const openAiPlan = await callOpenAI(scene, input, history);
    if (openAiPlan) return openAiPlan;
  } catch {
    // fallback to local rules
  }

  return buildFallbackPlan(scene, input);
}
