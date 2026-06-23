import type { ContrastType } from "./compareAnalysisTypes";

export type ClauseItem = {
  id: string;
  label: string;
  content: string;
  title?: string;
  meta?: string;
};

export type DuplicateTextSegment = {
  text: string;
  highlight?: boolean;
};

export type DuplicateHit = {
  id: string;
  overlapRate: string;
  segments: DuplicateTextSegment[];
  sourceTitle: string;
};

const DUPLICATE_SOURCE_TITLES = [
  "北京市大兴区经济和信息化局 关于印发《大兴区促进高精尖产业发展暂行办法（修订版）》的通知 京兴经信文〔2023〕16 2023-04-19",
  "北京市通州区经济和信息化局 关于印发《通州区关于促进医药健康产业发展的若干措施》的通知 通经信发〔2022〕8 2022-06-15",
  "北京市顺义区经济和信息化局 关于印发《顺义区促进高精尖产业高质量发展若干措施》的通知 顺经信发〔2023〕5 2023-03-28",
  "北京经济技术开发区管理委员会 关于印发《北京经济技术开发区关于加快推动生物制造产业创新发展的若干措施》的通知 2023-02-07",
  "北京市昌平区经济和信息化局 关于印发《昌平区促进先进能源产业发展的若干措施》的通知 昌经信发〔2022〕12 2022-11-20",
];

const DUPLICATE_HIGHLIGHT_PHRASES = [
  "最高不超过500万元",
  "20%",
  "三年",
  "工业企业",
  "达到亿元（含）以上",
  "国家级专精特新“小巨人”",
  "上年度",
  "租赁",
  "平台",
  "规模以上",
  "补贴",
  "支持",
];

function parseOverlapThreshold(threshold: string) {
  const value = parseFloat(threshold.replace("%", ""));
  return Number.isFinite(value) ? value : 80;
}

function generateHitOverlapRate(threshold: number, seed: number) {
  const spread = Math.max(99.99 - threshold, 1);
  const offset = (seed * 17) % 1000;
  const rate = threshold + (offset / 1000) * spread;
  return `${Math.min(rate, 99.99).toFixed(2)}%`;
}

function buildHighlightSegments(text: string, phrases: string[]): DuplicateTextSegment[] {
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  let segments: DuplicateTextSegment[] = [{ text }];

  for (const phrase of sorted) {
    if (!phrase) continue;
    const next: DuplicateTextSegment[] = [];
    for (const segment of segments) {
      if (segment.highlight) {
        next.push(segment);
        continue;
      }
      let remaining = segment.text;
      let index = remaining.indexOf(phrase);
      while (index !== -1) {
        if (index > 0) next.push({ text: remaining.slice(0, index) });
        next.push({ text: phrase, highlight: true });
        remaining = remaining.slice(index + phrase.length);
        index = remaining.indexOf(phrase);
      }
      if (remaining) next.push({ text: remaining });
    }
    segments = next.length > 0 ? next : segments;
  }

  return segments;
}

function extractClausePhrases(clauseContent: string, hitIndex: number) {
  return clauseContent
    .split(/[，。；、：]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .filter((_, index) => (index + hitIndex) % 2 === 0)
    .slice(0, 6);
}

function buildDuplicateBody(clause: ClauseItem, hitIndex: number) {
  const chapterIntro = "第三章 支持办法\n";
  const articles = [
    `第三条 ${clause.content}`,
    "第四条 支持经认定的国家级专精特新“小巨人”企业，按照上年度租赁面积的20%给予补贴，补贴面积最高不超过5000平方米，补贴期限最长不超过三年。",
    "第五条 对上年度产值达到5亿元（含）以上、100亿元以下的规模以上工业企业，每家补贴租赁面积最高不超过5000平方米，按照20%的比例给予支持，最高不超过500万元。",
    "第六条 支持企业建设产业创新平台和中试平台，按照设备投资额的20%给予补贴，单个项目最高不超过500万元。",
    "第七条 鼓励企业开展关键技术攻关和成果转化，对承担区级重大专项的企业，给予最高300万元资金支持。",
  ];

  const start = hitIndex % articles.length;
  const selected = Array.from({ length: 3 }, (_, offset) => articles[(start + offset) % articles.length]);
  return `${chapterIntro}${selected.join("\n")}`;
}

function buildDuplicateHit(clause: ClauseItem, hitIndex: number, threshold: string): DuplicateHit {
  const minRate = parseOverlapThreshold(threshold);
  const body = buildDuplicateBody(clause, hitIndex);
  const phrases = [
    ...extractClausePhrases(clause.content, hitIndex),
    ...DUPLICATE_HIGHLIGHT_PHRASES.filter((_, index) => (index + hitIndex) % 3 !== 2),
  ];

  return {
    id: `dup-${clause.id}-${hitIndex}`,
    overlapRate: generateHitOverlapRate(minRate, hashCount(clause.content, hitIndex, hitIndex + 97)),
    segments: buildHighlightSegments(body, phrases),
    sourceTitle: DUPLICATE_SOURCE_TITLES[hitIndex % DUPLICATE_SOURCE_TITLES.length],
  };
}

export type HorizontalDetail = {
  type: "horizontal";
  similarities: string[];
  differences: string[];
};

export type DuplicateDetail = {
  type: "duplicate";
  duplicateCount: number;
  hits: DuplicateHit[];
};

export type DiffDetail = {
  type: "diff";
  differences: string[];
};

export type AnalysisResultDetail = HorizontalDetail | DuplicateDetail | DiffDetail;

export type AnalysisResultItem = {
  id: string;
  clauseIds: string[];
  clauseLabel: string;
  contrastType: ContrastType;
  typeLabel: string;
  finishedAt: string;
  duplicateCount?: number;
  detail: AnalysisResultDetail;
};

const TYPE_LABELS: Record<ContrastType, string> = {
  horizontal: "横向对比",
  duplicate: "查重",
  diff: "异同对比",
};

function formatFinishedAt(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function hashCount(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return min + (hash % (max - min + 1));
}

function buildHorizontalDetail(clause: ClauseItem): HorizontalDetail {
  return {
    type: "horizontal",
    similarities: [
      "均提供了针对符合条件企业的厂房租赁补贴，且补贴方式均为按租赁面积或租金比例计算。",
      "均设定了支持上限，避免单项政策支出过度集中。",
    ],
    differences: [
      "目标企业规模与划分不同：对比政策按产值增量分档，参考政策按人才类别分档。",
      `对符合产值条件企业的补贴面积上限不同：本条款侧重产值增长支持，同类政策中亦有设定 2000 平方米与 5000 平方米等不同上限。`,
      "补贴计算方式不同：本条款按产值增量比例支持，对比政策多按固定面积或租金比例补贴。",
      "部分对比政策包含高管住房保障等附加条款，本条款未涉及相关内容。",
      "适用行业与认定口径存在差异，申报材料和审核部门可能不同。",
    ],
  };
}

function buildDuplicateDetail(clause: ClauseItem, overlapRate: string): DuplicateDetail {
  const duplicateCount = hashCount(clause.content, 3, 12);
  const hits = Array.from({ length: duplicateCount }, (_, index) =>
    buildDuplicateHit(clause, index, overlapRate || "80%"),
  );

  return { type: "duplicate", duplicateCount, hits };
}

function buildDiffDetail(clauses: ClauseItem[]): DiffDetail {
  const [first, second] = clauses;
  return {
    type: "diff",
    differences: [
      `${first.label}聚焦${first.content.slice(0, 18)}…，${second.label}聚焦${second.content.slice(0, 18)}…，两者扶持对象与政策工具不同。`,
      `${first.label}以资金奖励或补贴为主，${second.label}更强调认定支持或平台建设，政策兑现路径不同。`,
      "适用条件与申报材料要求不同，主管部门和审核流程可能存在差异。",
      "两项条款在支持上限、执行周期和绩效评估要求上并不一致。",
    ],
  };
}

export function buildAnalysisResults(
  contrastType: ContrastType,
  selectedClauses: ClauseItem[],
  overlapRate: string,
): AnalysisResultItem[] {
  const finishedAt = formatFinishedAt(new Date());
  const typeLabel = TYPE_LABELS[contrastType];

  if (contrastType === "diff") {
    const detail = buildDiffDetail(selectedClauses);
    return [
      {
        id: `result-diff-${Date.now()}`,
        clauseIds: selectedClauses.map((c) => c.id),
        clauseLabel: selectedClauses.map((c) => c.label).join("、"),
        contrastType,
        typeLabel,
        finishedAt,
        detail,
      },
    ];
  }

  return selectedClauses.map((clause, index) => {
    const detail =
      contrastType === "duplicate"
        ? buildDuplicateDetail(clause, overlapRate || "80%")
        : buildHorizontalDetail(clause);

    return {
      id: `result-${contrastType}-${clause.id}-${Date.now()}-${index}`,
      clauseIds: [clause.id],
      clauseLabel: clause.label,
      contrastType,
      typeLabel,
      finishedAt,
      duplicateCount: detail.type === "duplicate" ? detail.duplicateCount : undefined,
      detail,
    };
  });
}

export function getResultSummary(item: AnalysisResultItem) {
  if (item.detail.type === "duplicate") {
    return `共找到 ${item.detail.duplicateCount} 条重复条款`;
  }
  if (item.detail.type === "horizontal") {
    return `共找到 ${item.detail.differences.length} 处差异点`;
  }
  return `共提炼 ${item.detail.differences.length} 条不同点`;
}
