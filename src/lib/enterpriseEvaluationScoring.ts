import type {
  Level1Indicator,
  Level2Indicator,
  ScoreItem,
  ScoringCriteria,
  ScoringResult,
} from "@/data/enterpriseEvaluationData";

export const SCORE_BANDS = ["96-100", "91-95", "86-90", "81-85", "76-80", "71-75", "61-70", "60及以下"] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

export const SCORE_BAND_COLORS = ["#c41e3a", "#d94a60", "#e86a73", "#e28b3c", "#f0b845", "#5f9f7a", "#4f7fb8", "#cfd6df"] as const;

export function deepCloneCriteria(criteria: ScoringCriteria): ScoringCriteria {
  return JSON.parse(JSON.stringify(criteria)) as ScoringCriteria;
}

export function deepCloneResults(results: ScoringResult[]): ScoringResult[] {
  return JSON.parse(JSON.stringify(results)) as ScoringResult[];
}

export function normalizeScoreValue(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 10) / 10;
}

export function formatScoreValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getCriteriaTotalScore(criteria: ScoringCriteria): number {
  return criteria.totalScore || 100;
}

export function getLevel1ComputedScore(indicator: Level1Indicator): number {
  return indicator.children.reduce((sum, child) => sum + normalizeScoreValue(child.maxScore), 0);
}

export function syncLevel1Score(indicator: Level1Indicator): Level1Indicator {
  return { ...indicator, maxScore: getLevel1ComputedScore(indicator) };
}

export function syncCriteriaScores(criteria: ScoringCriteria): ScoringCriteria {
  return {
    ...criteria,
    indicators: criteria.indicators.map(syncLevel1Score),
  };
}

export function getAllocatedCriteriaScore(criteria: ScoringCriteria): number {
  return criteria.indicators.reduce(
    (sum, indicator) => sum + indicator.children.reduce((inner, child) => inner + normalizeScoreValue(child.maxScore), 0),
    0,
  );
}

export function getRemainingCriteriaScore(criteria: ScoringCriteria): number {
  return Math.max(0, getCriteriaTotalScore(criteria) - getAllocatedCriteriaScore(criteria));
}

export function getScoreEditUpperLimit(criteria: ScoringCriteria, currentScore: number): number {
  return normalizeScoreValue(currentScore) + getRemainingCriteriaScore(criteria);
}

export function countIndicators(criteria: ScoringCriteria): { level1: number; level2: number } {
  return {
    level1: criteria.indicators.length,
    level2: criteria.indicators.reduce((sum, item) => sum + item.children.length, 0),
  };
}

export function validateScoringCriteria(criteria: ScoringCriteria): { ok: boolean; message?: string } {
  if (!criteria.indicators.length) {
    return { ok: false, message: "请至少保留一个一级指标" };
  }
  for (const indicator of criteria.indicators) {
    if (!indicator.name.trim()) return { ok: false, message: "一级指标名称不能为空" };
    if (!indicator.children.length) return { ok: false, message: `「${indicator.name || "未命名"}」下请至少保留一个二级指标` };
    for (const child of indicator.children) {
      if (!child.name.trim()) return { ok: false, message: "二级指标名称不能为空" };
      if (normalizeScoreValue(child.maxScore) <= 0) return { ok: false, message: `「${child.name}」分值须大于 0` };
    }
  }
  const allocated = getAllocatedCriteriaScore(criteria);
  const total = getCriteriaTotalScore(criteria);
  if (Math.abs(allocated - total) > 0.01) {
    return { ok: false, message: `二级指标分值合计为 ${formatScoreValue(allocated)}，须等于满分 ${total}` };
  }
  return { ok: true };
}

export function getResultLevel1FinalScore(result: ScoringResult, indicator: Level1Indicator): number {
  const codes = new Set(indicator.children.map((child) => child.code));
  return result.scores
    .filter((score) => codes.has(score.indicatorCode))
    .reduce((sum, score) => sum + normalizeScoreValue(score.finalScore), 0);
}

export function refreshResultTotals(result: ScoringResult): ScoringResult {
  const totalAiScore = result.scores.reduce((sum, score) => sum + normalizeScoreValue(score.aiScore), 0);
  const totalFinalScore = result.scores.reduce((sum, score) => sum + normalizeScoreValue(score.finalScore), 0);
  return { ...result, totalAiScore, totalFinalScore };
}

export function ensureScoreRecordsForCriteria(result: ScoringResult, criteria: ScoringCriteria): ScoringResult {
  const flat = criteria.indicators.flatMap((indicator) => indicator.children);
  const map = new Map(result.scores.map((score) => [score.indicatorCode, score]));
  const scores: ScoreItem[] = flat.map((indicator) => {
    const existing = map.get(indicator.code);
    if (existing) {
      return {
        ...existing,
        indicatorName: indicator.name,
        maxScore: indicator.maxScore,
        finalScore: Math.min(normalizeScoreValue(existing.finalScore), indicator.maxScore),
        aiScore: Math.min(normalizeScoreValue(existing.aiScore), indicator.maxScore),
      };
    }
    return {
      indicatorCode: indicator.code,
      indicatorName: indicator.name,
      maxScore: indicator.maxScore,
      aiScore: 0,
      finalScore: 0,
      evidence: {
        source: "待补充",
        page: null,
        excerpt: `暂无「${indicator.name}」对应评分记录，已按新标准补齐为 0 分。`,
        reasoning: "标准变更后自动补齐",
        status: "warning" as const,
      },
      expertComment: "",
    };
  });
  return refreshResultTotals({ ...result, scores });
}

export function getDimensionScores(result: ScoringResult, criteria: ScoringCriteria): { name: string; score: number; maxScore: number }[] {
  return criteria.indicators.map((indicator) => ({
    name: indicator.name,
    score: getResultLevel1FinalScore(result, indicator),
    maxScore: indicator.maxScore,
  }));
}

export function getScoreBand(score: number): ScoreBand {
  if (score >= 96) return "96-100";
  if (score >= 91) return "91-95";
  if (score >= 86) return "86-90";
  if (score >= 81) return "81-85";
  if (score >= 76) return "76-80";
  if (score >= 71) return "71-75";
  if (score >= 61) return "61-70";
  return "60及以下";
}

export function buildScoreDistributionGradient(counts: Record<ScoreBand, number>, total: number): string {
  let currentOffset = 0;
  const segments = SCORE_BANDS.map((band, index) => {
    const percent = ((counts[band] || 0) / Math.max(total, 1)) * 100;
    const start = currentOffset;
    currentOffset += percent;
    return `${SCORE_BAND_COLORS[index]} ${start}% ${currentOffset}%`;
  });
  return segments.length ? `conic-gradient(${segments.join(", ")})` : "#eceff3";
}

export function getMatchedRuleText(rules: string, reasoning: string): string {
  const match = reasoning.match(/第\s*(\d+)\s*条/);
  if (!match) return "";
  const index = Number(match[1]);
  const lines = rules
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => line.startsWith(`${index}.`) || line.startsWith(`${index}、`)) || "";
}

export function cleanScoreReasoning(text: string): string {
  return text
    .replace(/完全符合评分标准第\d+条/g, "")
    .replace(/符合标准第\d+条/g, "")
    .replace(/^[\s,\uFF0C]+/, "")
    .trim();
}

export function buildScoreBasis(score: ScoreItem, indicator?: Level2Indicator): string {
  const parts: string[] = [];
  if (score.evidence?.excerpt) {
    parts.push(`材料摘录：${score.evidence.excerpt}`);
  }
  if (indicator?.rules) {
    const matched = getMatchedRuleText(indicator.rules, score.evidence?.reasoning || "");
    if (matched) parts.push(`细则匹配：${matched}`);
  }
  const reasoning = cleanScoreReasoning(score.evidence?.reasoning || "");
  if (reasoning) parts.push(`评分推理：${reasoning}`);
  if (score.expertComment) parts.push(`专家意见：${score.expertComment}`);
  return parts.join("\n") || "暂无评分依据";
}

export function createEmptyLevel1(remaining: number): Level1Indicator {
  const maxScore = Math.max(1, remaining || 1);
  return {
    level: 1,
    code: "新",
    name: "新建一级指标",
    maxScore,
    children: [
      {
        level: 2,
        code: "x.1",
        name: "新建二级指标",
        maxScore,
        rules: "请填写评分细则",
        materialRef: "",
      },
    ],
  };
}

export function createEmptyLevel2(remaining: number, level1Index: number, childIndex: number): Level2Indicator {
  return {
    level: 2,
    code: `${level1Index + 1}.${childIndex + 1}`,
    name: "新建二级指标",
    maxScore: Math.max(1, remaining || 1),
    rules: "请填写评分细则",
    materialRef: "",
  };
}

export function renumberCriteria(criteria: ScoringCriteria): ScoringCriteria {
  const codes = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return syncCriteriaScores({
    ...criteria,
    indicators: criteria.indicators.map((indicator, level1Index) => ({
      ...indicator,
      code: codes[level1Index] || String(level1Index + 1),
      children: indicator.children.map((child, level2Index) => ({
        ...child,
        code: `${level1Index + 1}.${level2Index + 1}`,
      })),
    })),
  });
}

export function exportResultsCsv(
  companies: { id: number; name: string; creditCode: string }[],
  results: ScoringResult[],
  criteria: ScoringCriteria,
): string {
  const headers = ["排名", "企业名称", "统一社会信用代码", "总分", ...criteria.indicators.map((item) => item.name)];
  const sorted = [...companies]
    .map((company) => ({
      company,
      result: results.find((item) => item.companyId === company.id),
    }))
    .filter((item) => item.result)
    .sort((a, b) => (b.result!.totalFinalScore || 0) - (a.result!.totalFinalScore || 0));

  const rows = sorted.map((item, index) => {
    const dims = getDimensionScores(item.result!, criteria);
    return [
      String(index + 1),
      item.company.name,
      item.company.creditCode,
      formatScoreValue(item.result!.totalFinalScore),
      ...dims.map((dim) => formatScoreValue(dim.score)),
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
