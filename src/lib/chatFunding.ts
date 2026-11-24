export type SupportRule = { clause: string; rate?: number; fixed?: number; cap?: number };
const money = (value: string, unit: string) => Number(value) * (unit === "亿元" ? 1e8 : unit === "万元" ? 1e4 : 1);
export function parseSupportRules(text: string): SupportRule[] {
  return text.split(/\n|[。；]/).map(line => line.trim()).filter(line => /补贴|补助|奖励|资助|支持|扶持/.test(line) && /\d/.test(line)).map(clause => {
    const cap = clause.match(/(?:最高|上限|不超过)[^\d%]{0,12}(\d+(?:\.\d+)?)\s*(亿元|万元|元)/);
    const percent = clause.match(/(\d+(?:\.\d+)?)\s*[%％]/);
    const fixed = clause.match(/(?:给予|奖励|补助|补贴|资助)\s*(\d+(?:\.\d+)?)\s*(亿元|万元|元)/);
    // Ambiguous tiers, recurring payments and aggregate budgets require manual review.
    const ambiguous = /分别|分档|分级|每年|连续|总规模|总预算|总额|递增|就高|择一|不予|不得|不支持|取消|扣减/.test(clause) || (clause.match(/[%％]/g)?.length ?? 0) > 1 || (!percent && (clause.match(/\d+(?:\.\d+)?\s*(?:亿元|万元|元)/g)?.length ?? 0) > 1);
    return { clause, cap: cap ? money(cap[1], cap[2]) : undefined, rate: !ambiguous && percent && Number(percent[1]) <= 100 ? Number(percent[1]) / 100 : undefined, fixed: !ambiguous && !percent && fixed ? money(fixed[1], fixed[2]) : undefined };
  });
}
export function estimateSupport(rule: SupportRule, base: string): number | null {
  let amount = rule.fixed;
  if (rule.rate !== undefined) {
    if (!base.trim() || !Number.isFinite(Number(base)) || Number(base) < 0) return null;
    amount = Number(base) * rule.rate;
  }
  if (amount === undefined || !Number.isFinite(amount)) return null;
  return Math.round(Math.min(amount, rule.cap ?? Infinity) * 100) / 100;
}
