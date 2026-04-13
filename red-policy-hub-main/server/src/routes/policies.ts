import { Router, Request, Response } from "express";
import type {
  SearchPoliciesRequest,
  AnalyzePoliciesRequest,
  GenerateOutlineRequest,
  GenerateContentRequest,
  GenerateCoreElementsRequest,
  PolicyItem,
  ClauseComparison,
  OutlineSection,
  OutlineSubSection,
  Citation,
} from "../types";

const router = Router();

// ──────────────────────────────────────────────
// 政策資料庫（模擬資料來源，實際可替換為 DB 查詢）
// ──────────────────────────────────────────────
const policyDatabase: PolicyItem[] = [
  { id: "n1", title: "《中华人民共和国促进科技成果转化法》", url: "https://www.gov.cn", selected: true, level: "national", source: "全国人大" },
  { id: "n2", title: "《国务院关于促进新一代人工智能产业发展三年行动计划》", url: "https://www.gov.cn", selected: true, level: "national", source: "国务院" },
  { id: "n3", title: "《\"十四五\"数字经济发展规划》", url: "https://www.gov.cn", selected: true, level: "national", source: "国务院" },
  { id: "n4", title: "《关于支持建设新一代人工智能示范应用场景的通知》", url: "https://www.gov.cn", selected: true, level: "national", source: "科技部" },
  { id: "n5", title: "《关于促进中小企业健康发展的指导意见》", url: "https://www.gov.cn", selected: true, level: "national", source: "工信部" },
  { id: "b1", title: "《北京市\"十四五\"时期高精尖产业发展规划》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "北京市政府" },
  { id: "b2", title: "《北京市加快建设具有全球影响力的人工智能创新策源地实施方案》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "北京市科委" },
  { id: "b3", title: "《北京经济技术开发区促进高精尖产业发展若干政策》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "经开区管委会" },
  { id: "b4", title: "《中关村国家自主创新示范区关于促进科技型小微企业发展的若干政策》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "中关村管委会" },
  { id: "b5", title: "《海淀区关于促进数字经济创新发展的若干措施》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "海淀区政府" },
  { id: "o1", title: "《上海市促进人工智能产业发展条例》", url: "https://www.shanghai.gov.cn", selected: true, level: "other", source: "上海市" },
  { id: "o2", title: "《深圳经济特区人工智能产业促进条例》", url: "https://www.sz.gov.cn", selected: true, level: "other", source: "深圳市" },
  { id: "o3", title: "《杭州市人工智能产业发展若干意见》", url: "https://www.hangzhou.gov.cn", selected: true, level: "other", source: "杭州市" },
  { id: "o4", title: "《成都市加快人工智能产业发展专项政策》", url: "https://www.chengdu.gov.cn", selected: true, level: "other", source: "成都市" },
  { id: "o5", title: "《广州市推进新一代人工智能产业发展若干政策》", url: "https://www.gz.gov.cn", selected: true, level: "other", source: "广州市" },
  // 汽車領域
  { id: "car1", title: "《新能源汽车产业发展规划（2021-2035年）》", url: "https://www.gov.cn", selected: true, level: "national", source: "国务院" },
  { id: "car2", title: "《北京市新能源汽车产业发展规划》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "北京市政府" },
  // 生物醫藥
  { id: "bio1", title: "《\"十四五\"生物经济发展规划》", url: "https://www.gov.cn", selected: true, level: "national", source: "国家发改委" },
  { id: "bio2", title: "《北京市促进生物技术和大健康产业发展指导意见》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "北京市政府" },
  // 招商引資
  { id: "inv1", title: "《关于进一步做好利用外资工作的意见》", url: "https://www.gov.cn", selected: true, level: "national", source: "国务院" },
  { id: "inv2", title: "《北京市招商引资条例》", url: "https://www.beijing.gov.cn", selected: true, level: "beijing", source: "北京市人大" },
];

/**
 * 根據政策標題關鍵字進行簡單語意匹配
 */
function matchPolicies(title: string): PolicyItem[] {
  const keywords = title
    .replace(/[《》「」【】（）()]/g, " ")
    .split(/\s+/)
    .filter((k) => k.length > 1);

  const scored = policyDatabase.map((p) => {
    const score = keywords.reduce((acc, kw) => {
      return acc + (p.title.includes(kw) || (p.source || "").includes(kw) ? 1 : 0);
    }, 0);
    return { policy: p, score };
  });

  // 取匹配度 > 0 的，若全無匹配則返回全部
  const matched = scored.filter((s) => s.score > 0).map((s) => s.policy);
  return matched.length >= 5 ? matched : policyDatabase.slice(0, 15);
}

// ──────────────────────────────────────────────
// POST /api/policies/search  —  政策智能檢索
// ──────────────────────────────────────────────
router.post("/search", (req: Request, res: Response) => {
  const { policyTitle } = req.body as SearchPoliciesRequest;

  if (!policyTitle?.trim()) {
    res.status(400).json({ error: "policyTitle 不能為空" });
    return;
  }

  const results = matchPolicies(policyTitle);
  res.json({ policies: results, total: results.length });
});

// ──────────────────────────────────────────────
// POST /api/policies/analyze  —  政策條款分析
// ──────────────────────────────────────────────
router.post("/analyze", (req: Request, res: Response) => {
  const { selectedPolicies } = req.body as AnalyzePoliciesRequest;

  if (!Array.isArray(selectedPolicies) || selectedPolicies.length === 0) {
    res.status(400).json({ error: "selectedPolicies 不能為空" });
    return;
  }

  const chosen = selectedPolicies.filter((p) => p.selected);

  /** 根據傳入的政策動態生成分析結果 */
  const analysis: ClauseComparison[] = chosen.slice(0, 8).map((p, i) => {
    const levelMethodMap: Record<string, string> = {
      national: "专项资金 + 税收减免 + 示范应用",
      beijing: "资金补贴 + 人才配套 + 租金减免",
      other: "财政补助 + 创新券 + 产业基金",
    };
    const levelAmountMap: Record<string, string> = {
      national: "单项目最高1000万，税收减免15%",
      beijing: "研发补贴最高500万/年，租金减免50%",
      other: "补助最高300万，贷款贴息100万/年",
    };
    const highlights: ClauseComparison["highlights"] = [];
    if (i === 0) highlights.push({ field: "supportLevel", type: "high" });
    if (i === 1) highlights.push({ field: "supportMethod", type: "unique" });
    if (i === 2) highlights.push({ field: "supportMethod", type: "medium" });

    return {
      id: `a${i + 1}`,
      policyTitle: p.title,
      source: p.source || "政府部门",
      targetAudience: p.level === "national"
        ? "符合条件的全国范围内相关企业及科研机构"
        : p.level === "beijing"
        ? `在北京注册、年营收500万以上的相关企业`
        : `在${p.source || "当地"}注册运营的产业链相关企业`,
      supportMethod: levelMethodMap[p.level] || "综合扶持",
      supportLevel: levelAmountMap[p.level] || "视项目情况而定",
      highlights,
    };
  });

  // 生成摘要
  const topPolicy = chosen[0];
  const summary = [
    `共分析 ${chosen.length} 条参考政策，覆盖国家级、市级及其他省市政策层级`,
    topPolicy ? `${topPolicy.source || "部分政策"}在扶持力度方面表现突出，可重点参考` : "",
    '各地普遍采用"资金补贴+人才配套"组合方式，建议结合本地实际差异化制定',
    "建议重点对标扶持力度最高的政策条款，合理设定补贴标准上限",
  ].filter(Boolean);

  res.json({ analysis, summary });
});

// ──────────────────────────────────────────────
// POST /api/policies/outline  —  大綱生成（兩層：章 → 節）
// ──────────────────────────────────────────────
router.post("/outline", (req: Request, res: Response) => {
  const { policyTitle, coreElements, selectedPolicies } =
    req.body as GenerateOutlineRequest;

  if (!policyTitle?.trim()) {
    res.status(400).json({ error: "policyTitle 不能為空" });
    return;
  }

  const chosen = (selectedPolicies || []).filter((p) => p.selected);
  const refPolicies = chosen.slice(0, 8);

  /** 從核心要素解析條目 */
  const elementLines = (coreElements || "")
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  /** 取第 idx 條選中政策作為參考 */
  const getRef = (idx: number): OutlineSubSection["referencePolicies"][0] | null =>
    refPolicies[idx % Math.max(refPolicies.length, 1)]
      ? {
          title: refPolicies[idx % refPolicies.length].title,
          clause: "参见该政策相关条款，可作为本节起草参考依据。",
        }
      : null;

  const refs = (indices: number[]): OutlineSubSection["referencePolicies"] =>
    indices.map(getRef).filter(Boolean) as OutlineSubSection["referencePolicies"];

  /** 用核心要素動態填充第三章各節要點 */
  const ch3SubPoints: string[][] =
    elementLines.length >= 3
      ? [
          [elementLines[0], "明确适用对象与准入标准"],
          [elementLines[1], "规范资金拨付流程与时限"],
          [elementLines[2] || "监督管理与绩效评估", "建立退出与追责机制"],
        ]
      : [
          ["设定资金补贴标准与上限", "明确申报企业资质要求"],
          ["规范申报流程与时限", "建立资料审核与公示制度"],
          ["开展绩效评价", "建立动态调整机制"],
        ];

  const outline: OutlineSection[] = [
    {
      id: "s1",
      title: "第一章 总则",
      subSections: [
        {
          id: "s1-1",
          title: "第一条 立法目的与依据",
          keyPoints: ["明确政策制定的背景与目的", "列明上位法律法规依据"],
          referencePolicies: refs([0, 1]),
        },
        {
          id: "s1-2",
          title: "第二条 适用范围",
          keyPoints: ["界定政策适用的地域与主体范围", "明确重点支持的产业领域"],
          referencePolicies: refs([2]),
        },
        {
          id: "s1-3",
          title: "第三条 基本原则",
          keyPoints: ["安全第一、有序发展", "创新驱动、市场主导", "开放协同、共建共享"],
          referencePolicies: refs([0]),
        },
      ],
    },
    {
      id: "s2",
      title: "第二章 产业发展方向",
      subSections: [
        {
          id: "s2-1",
          title: "第四条 重点支持领域",
          keyPoints: ["确定优先支持的技术与产业方向", "明确产业链重点环节"],
          referencePolicies: refs([1, 3]),
        },
        {
          id: "s2-2",
          title: "第五条 发展目标与路径",
          keyPoints: ["设定阶段性发展目标", "明确技术创新与成果转化路径"],
          referencePolicies: refs([2, 4]),
        },
      ],
    },
    {
      id: "s3",
      title: "第三章 扶持标准与申报条件",
      subSections: [
        {
          id: "s3-1",
          title: "第六条 扶持标准",
          keyPoints: ch3SubPoints[0],
          referencePolicies: refs([0, 3]),
        },
        {
          id: "s3-2",
          title: "第七条 申报条件",
          keyPoints: ch3SubPoints[1],
          referencePolicies: refs([1, 5]),
        },
        {
          id: "s3-3",
          title: "第八条 申报流程与绩效管理",
          keyPoints: ch3SubPoints[2],
          referencePolicies: refs([4]),
        },
      ],
    },
    {
      id: "s4",
      title: "第四章 人才引进与培养",
      subSections: [
        {
          id: "s4-1",
          title: "第九条 高层次人才引进",
          keyPoints: ["制定高层次人才引进计划", "提供住房与生活配套保障"],
          referencePolicies: refs([2, 5]),
        },
        {
          id: "s4-2",
          title: "第十条 产学研协同培养",
          keyPoints: ["建立产学研协同培养机制", "支持企业与高校联合育才"],
          referencePolicies: refs([6]),
        },
      ],
    },
    {
      id: "s5",
      title: "第五章 资金保障与监督管理",
      subSections: [
        {
          id: "s5-1",
          title: "第十一条 资金来源与保障",
          keyPoints: ["明确财政资金来源与预算安排", "建立专项资金管理制度"],
          referencePolicies: refs([3, 7]),
        },
        {
          id: "s5-2",
          title: "第十二条 监督管理",
          keyPoints: ["建立绩效评估与审计制度", "规定责任追究与退出机制"],
          referencePolicies: refs([1]),
        },
      ],
    },
    {
      id: "s6",
      title: "第六章 附则",
      subSections: [
        {
          id: "s6-1",
          title: "第十三条 施行日期与有效期",
          keyPoints: ["明确政策施行日期", "规定有效期限及续期方式"],
          referencePolicies: refs([0]),
        },
        {
          id: "s6-2",
          title: "第十四条 解释与衔接",
          keyPoints: ["指定负责解释的主管部门", "规定与其他政策文件的衔接"],
          referencePolicies: refs([2]),
        },
      ],
    },
  ];

  res.json({ outline });
});

// ──────────────────────────────────────────────
// POST /api/policies/generate-content  —  正文生成
// ──────────────────────────────────────────────
router.post("/generate-content", (req: Request, res: Response) => {
  const { policyTitle, coreElements, selectedPolicies, outline } =
    req.body as GenerateContentRequest;

  if (!policyTitle?.trim()) {
    res.status(400).json({ error: "policyTitle 不能為空" });
    return;
  }

  const chosen = (selectedPolicies || []).filter((p) => p.selected);
  const ref1 = chosen[0]?.source || "国家主管部门";
  const ref2 = chosen[1]?.source || "市级政府";

  /** 從大綱兩層結構動態生成正文 */
  const typedOutline = (outline || []) as OutlineSection[];

  const buildChapterText = (section: OutlineSection): string => {
    const lines: string[] = [section.title, ""];
    section.subSections.forEach((sub) => {
      lines.push(sub.title);
      if (sub.keyPoints.length > 0) {
        const nums = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
        sub.keyPoints.forEach((pt, i) => {
          lines.push(`（${nums[i] || i + 1}）${pt}；`);
        });
      }
      lines.push("");
    });
    return lines.join("\n");
  };

  const outlineText =
    typedOutline.length > 0
      ? typedOutline.map(buildChapterText).join("\n")
      : `第一章 总则

第一条 立法目的与依据
为深入贯彻落实国家和市委、市政府关于推动高质量发展的决策部署，进一步优化营商环境，促进产业转型升级，参考${ref1}等相关政策文件，结合本区实际，制定本措施。

第二条 适用范围
本措施适用于在本区注册、纳税，具有独立法人资格的企业和机构。重点支持${policyTitle.replace(/关于|若干政策措施|若干措施|的/g, "").trim()}等战略性新兴产业领域。

第三条 基本原则
（一）安全第一、有序发展；
（二）创新驱动、融合发展；
（三）市场主导、政府引导；
（四）开放协同、共建共享。

第二章 产业发展方向

第四条 重点支持领域
重点支持符合本区产业发展方向的项目，鼓励技术创新和成果转化。对于获得国家级、市级认定的高新技术企业，给予相应的政策扶持和资金奖励。参照${ref2}等地区先进经验，建立差异化支持机制。

第五条 发展目标与路径
明确产业发展阶段性目标，推动技术创新与成果转化，形成具有核心竞争力的产业集群。

第三章 扶持标准与申报条件

第六条 扶持标准
（一）对新认定的高新技术企业，一次性给予20万元奖励；
（二）对企业研发投入，按照实际研发费用的10%给予补贴，单个企业年度补贴最高不超过500万元；
（三）对引进的高层次人才，提供住房补贴和生活补贴。

第七条 申报条件
（一）申报企业应在本区注册并正常经营一年以上；
（二）企业信用状况良好，近三年无重大违法违规记录；
（三）企业研发投入占营业收入比例不低于3%；
（四）拥有自主知识产权或核心技术。

第八条 申报流程与绩效管理
申报企业应在规定时间内提交申请材料，经区主管部门初审、专家评审、公示后，按程序拨付资金，并定期开展绩效评价。

第四章 人才引进与培养

第九条 高层次人才引进
对引进的高层次人才提供住房补贴、生活补贴及子女就学、配偶就业等配套服务，构建多元人才保障体系。

第十条 产学研协同培养
建立产学研协同培养机制，支持企业与高校、科研机构联合培育专业人才。

第五章 资金保障与监督管理

第十一条 资金来源与保障
扶持资金从区级财政预算中安排，实行专项管理、专款专用，建立资金使用绩效评估制度。

第十二条 监督管理
建立健全政策实施的监督检查机制，定期对资金使用情况进行审计评估，规定责任追究与退出机制。

第六章 附则

第十三条 施行日期与有效期
本政策自发布之日起施行，有效期三年。

第十四条 解释与衔接
本政策由区发展和改革委员会负责解释，与其他政策文件的衔接依相关规定执行。`;

  // ── 構建引用表（citations），取前 5 條選中政策 ──
  const citations: Citation[] = chosen.slice(0, 5).map((p, i) => ({
    index: i + 1,
    title: p.title,
    url: p.url,
    source: p.source,
  }));

  /**
   * 在正文中的關鍵語句後插入 [ref:N] 標記
   * 策略：每次遇到「参考」「依据」「参照」「根据」等引用動詞的句子，
   * 依次輪流插入各個引用標記。
   */
  const injectCitations = (text: string): string => {
    if (citations.length === 0) return text;
    let refIdx = 0;
    // 匹配：以句號/分號結尾、且含有引用關鍵詞的行
    return text.replace(
      /(参考|依据|参照|根据|借鑒|结合)[^。；\n]*[。；]/g,
      (match) => {
        const citation = citations[refIdx % citations.length];
        refIdx++;
        return `${match}[ref:${citation.index}]`;
      }
    );
  };

  const rawContent = `（以下内容根据大纲自动生成，请根据实际情况修改完善）\n\n${outlineText}`;
  const content = injectCitations(rawContent);

  res.json({ content, citations });
});

// ──────────────────────────────────────────────
// POST /api/policies/core-elements  —  AI 生成核心要素
// ──────────────────────────────────────────────
router.post("/core-elements", (req: Request, res: Response) => {
  const { policyTitle } = req.body as GenerateCoreElementsRequest;

  if (!policyTitle?.trim()) {
    res.status(400).json({ error: "policyTitle 不能為空" });
    return;
  }

  const title = policyTitle.trim();

  /** 根據標題關鍵字動態生成核心要素 */
  const keywordMap: Record<string, string[]> = {
    "人工智能|AI|ai": [
      "AI核心技术研发与产业化支持",
      "智能算力基础设施建设补贴",
      "人工智能场景应用示范奖励",
      "AI企业研发投入税收优惠",
      "高端AI人才引进与培育计划",
    ],
    "新能源|汽车|智能网联": [
      "新能源汽车推广应用补贴标准",
      "智能网联汽车测试与示范场景",
      "动力电池与充换电设施建设支持",
      "整车及零部件企业落地奖励",
      "产业链协同发展与人才保障",
    ],
    "生物|医药|健康": [
      "生物医药研发投入补贴政策",
      "创新药械审批绿色通道支持",
      "医疗健康数据平台建设奖励",
      "生物技术人才引进专项计划",
      "产业园区建设与配套设施保障",
    ],
    "招商|引资|投资": [
      "重点产业项目落地奖励标准",
      "企业注册与经营便利化措施",
      "税收优惠与财政补贴政策",
      "人才引进与住房保障机制",
      "营商环境优化与服务保障",
    ],
    "人才|引才": [
      "高层次人才认定标准与类别",
      "住房补贴与安居保障措施",
      "科研经费与创业支持政策",
      "子女就学与配偶就业配套",
      "人才评价与激励机制建设",
    ],
    "制造|智能制造|机器人": [
      "智能制造改造升级补贴标准",
      "工业机器人应用奖励政策",
      "数字化转型示范项目扶持",
      "先进制造技术研发投入支持",
      "产业工人技能培训补贴机制",
    ],
  };

  let elements: string[] = [
    "政策适用范围与对象",
    "扶持标准与补贴金额",
    "申报条件与流程",
    "资金来源与保障措施",
    "监督管理与绩效评估",
  ];

  for (const [pattern, items] of Object.entries(keywordMap)) {
    if (new RegExp(pattern).test(title)) {
      elements = items;
      break;
    }
  }

  const coreElements = elements.map((e, i) => `${i + 1}. ${e}`).join("\n");
  res.json({ coreElements });
});

export default router;
