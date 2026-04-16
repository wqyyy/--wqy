/** 示范政策文档：用于政策制定页快捷进入起草与前评估 */
export const DATA_INDUSTRY_POLICY_TITLE =
  "北京经济技术开发区关于加快推进数据产业高质量发展的若干措施";

export const DATA_INDUSTRY_POLICY_DESC =
  "围绕数据要素流通、数据基础设施与场景应用，推动数据产业集聚与高质量发展。";

/**
 * 参考文件要点摘录（来自《北京经济技术开发区关于加快推进数据产业高质量发展的若干措施》）
 * 用于在起草阶段按“文件原始语义”提取核心要素，而非使用泛化模板。
 */
export const DATA_INDUSTRY_POLICY_SOURCE_LINES = [
  "健全数据要素流通交易机制，推进数据要素确权登记、合规流通、收益分配与资产化应用。",
  "支持数据基础设施建设，布局智能算力中心、可信数据空间、数据标注基地与公共服务平台。",
  "鼓励工业制造、城市治理、医疗健康、商贸流通等领域开放场景，推动高价值数据应用落地。",
  "强化数据安全治理，落实分类分级、重要数据保护、安全评估与全生命周期合规管理。",
  "完善企业培育与梯度扶持机制，支持数据企业做大做强、首升规、专精特新与高新认定。",
  "优化创新生态，支持关键技术攻关、标准研制、创新联合体和中试验证平台建设。",
  "加强组织实施与绩效评估，建立跨部门协同推进机制和政策动态优化调整机制。",
] as const;

/** 起草流程中用于识别「数据产业若干措施」示范稿（标题完全一致或明确包含数据产业高质量发展） */
export function isDataIndustryPolicyDraft(title: string): boolean {
  const t = title.trim();
  if (!t) return false;
  if (t === DATA_INDUSTRY_POLICY_TITLE) return true;
  return t.includes("数据产业") && t.includes("高质量");
}

/** 从参考文件摘录中提取可直接用于起草的核心要点（按顺序截取） */
export function deriveDataIndustryCorePoints(max = 5): string[] {
  const size = Math.max(1, Math.min(max, DATA_INDUSTRY_POLICY_SOURCE_LINES.length));
  return DATA_INDUSTRY_POLICY_SOURCE_LINES.slice(0, size).map((line) => line.replace(/[。；]\s*$/, ""));
}
