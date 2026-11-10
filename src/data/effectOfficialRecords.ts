import type { BusinessRecord } from "@/lib/effectDrilldown";

// Official examples checked on 2026-11-03; this is not a complete publication ledger.
const documents = [
  { id: "bda-games", name: "中共北京市委经济技术开发区工委宣传文化部关于开展2025年度游戏电竞产业政策相关事项申报的通知", department: "宣传文化部", publisher: "中共北京市委经济技术开发区工作委员会宣传文化部", level: "经开区", date: "2026-10-09", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202610/t20261008_4892811.html", item: "2025年度游戏电竞产业政策相关事项申报", startDate: "2026-10-10", endDate: "2026-10-30" },
  { id: "bda-talent", name: "中共北京市委经济技术开发区工委组织人事部关于开展2026年亦城人才备案认定申报的通知", department: "组织人事部", publisher: "中共北京市委经济技术开发区工委组织人事部", level: "经开区", date: "2026-10-08", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202610/t20261008_4892665.html", item: "2026年亦城人才备案认定申报", startDate: "2026-10-09", endDate: "2026-11-20" },
  { id: "bda-space-industry", name: "北京经济技术开发区机器人和智能制造产业局关于开展2026年商业航天产业政策相关事项申报的通知", department: "机器人和智能制造产业局", publisher: "北京经济技术开发区机器人和智能制造产业局", level: "经开区", date: "2026-09-29", status: "已失效", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202609/t20260928_4883934.html", item: "2026年商业航天产业政策相关事项申报", startDate: "2026-09-30", endDate: "2026-10-23" },
  { id: "bda-services", name: "北京经济技术开发区经济发展局关于开展2026年生产性服务业十二条政策相关事项申报的通知", department: "经济发展局", publisher: "北京经济技术开发区经济发展局", level: "经开区", date: "2026-09-28", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202609/t20260928_4883862.html", item: "2026年生产性服务业十二条政策相关事项申报", startDate: "2026-09-29", endDate: "2026-10-19" },
  { id: "bda-ai-talent", name: "北京经济技术开发区信息技术产业局关于开展2026年人工智能创新创业人才支持申报的通知", department: "信息技术产业局", publisher: "北京经济技术开发区信息技术产业局", level: "经开区", date: "2026-10-30", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202610/t20261030_4924619.html", item: "2026年人工智能创新创业人才支持申报", startDate: "2026-10-30", endDate: "2026-11-18" },
  { id: "bda-global-rd", name: "北京经济技术开发区商务金融局关于开展2026年跨国公司全球研发中心认定奖励（第一年度）申报的通知", department: "商务金融局", publisher: "北京经济技术开发区商务金融局", level: "经开区", date: "2026-10-27", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202610/t20261027_4920588.html", item: "2026年跨国公司全球研发中心认定奖励（第一年度）申报", startDate: "2026-10-28", endDate: "2026-11-16" },
  { id: "national-rd", name: "财政部 税务总局关于进一步完善研发费用税前加计扣除政策的公告", department: "财政部、税务总局", level: "国家", date: "2023-03-26", code: "财政部 税务总局公告2023年第7号", sourceUrl: "https://fgk.chinatax.gov.cn/zcfgk/c102416/c5201978/content.html", content: "明确企业研发投入所得税优惠的适用口径，执行要求以官方公告为准。" },
  { id: "national-sme", name: "关于进一步支持专精特新中小企业高质量发展的通知", department: "财政部、工业和信息化部", level: "国家", date: "2024-06-19", code: "财建〔2024〕148号", sourceUrl: "https://app.www.gov.cn/govdata/gov/202406/19/516322/article.html", content: "部署中央财政支持专精特新企业发展的工作，具体条件和组织流程见原文。" },
  { id: "beijing-ecommerce", name: "北京市商务局关于申报2026年促进电子商务高质量发展支持政策的通知", department: "北京市商务局", level: "北京市", date: "2026-03-30", code: "京商电商字〔2026〕8号", sourceUrl: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202603/t20260330_4569992.html", content: "发布本年度电商支持方向与申报安排，各方向材料和时限以通知为准。" },
  { id: "beijing-industry", name: "北京市经济和信息化局 北京市财政局关于印发2026年北京市高精尖产业发展项目资金和支持中小企业发展资金实施指南（第二批）的通知", department: "北京市经济和信息化局", publisher: "北京市经济和信息化局、北京市财政局", level: "北京市", date: "2026-07-30", sourceUrl: "https://jxj.beijing.gov.cn/zwgk/2024zcwj/202607/t20260730_4801241.html", content: "公布高精尖产业及中小企业资金第二批指南，不同支持方向分别确定申报期限。" },
  { id: "bda-space", name: "北京经济技术开发区科技和产业促进局关于开展2026年中小企业空间载体支持（第二批）申报的通知", department: "科技和产业促进局", publisher: "北京经济技术开发区科技和产业促进局", level: "经开区", date: "2026-09-22", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202609/t20260921_4874508.html", item: "2026年中小企业空间载体支持（第二批）", startDate: "2026-09-22", endDate: "2026-10-30" },
  { id: "bda-finance", name: "北京经济技术开发区商务金融局关于开展2026年产业金融二十条政策相关事项申报的通知", department: "商务金融局", publisher: "北京经济技术开发区商务金融局", level: "经开区", date: "2026-03-06", sourceUrl: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202603/t20260309_4552316.html", item: "2026年产业金融二十条政策相关事项申报", startDate: "2026-03-09", endDate: "2026-03-23" },
  { id: "bda-xr", name: "北京经济技术开发区信息技术产业局关于开展2026年“智能终端创新技术加速转化”专项奖励申报的通知", department: "信息技术产业局", publisher: "北京经济技术开发区信息技术产业局", level: "经开区", date: "2026-10-13", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202610/t20261013_4899438.html", item: "2026年“智能终端创新技术加速转化”专项奖励", startDate: "2026-10-13", endDate: "2026-11-03" },
  { id: "bda-energy", name: "北京经济技术开发区高端汽车和新能源产业局关于开展2026年未来能源首台（套）首批次国家及市级认定支持（第二批）申报的通知", department: "高端汽车和新能源产业局", publisher: "北京经济技术开发区高端汽车和新能源产业局", level: "经开区", date: "2026-09-18", status: "已失效", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202609/t20260918_4869515.html", item: "2026年未来能源首台（套）首批次国家及市级认定支持（第二批）", startDate: "2026-09-18", endDate: "2026-10-08" },
  { id: "bda-biomed", name: "北京经济技术开发区生物技术和大健康产业局关于开展2025年度生物医药产业政策相关事项（第一批）申报的通知", department: "生物技术和大健康产业局", publisher: "北京经济技术开发区生物技术和大健康产业局", level: "经开区", date: "2026-05-27", status: "已失效", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202605/t20260526_4667049.html", item: "2025年度生物医药产业政策相关事项（第一批）申报", startDate: "2026-05-28", endDate: "2026-06-26" },
  { id: "bda-challenge", name: "北京经济技术开发区科技和产业促进局关于发布北京经济技术开发区2026年度第二批“揭榜挂帅”项目榜单的通知", department: "科技和产业促进局", publisher: "北京经济技术开发区科技和产业促进局", level: "经开区", date: "2026-09-29", sourceUrl: "https://kfqgw.beijing.gov.cn/zwgkkfq/2024zcwj/202609/t20260929_4885044.html", item: "2026年度第二批“揭榜挂帅”项目申报", endDate: "2026-10-28" },
];

// Topic classification follows notice subjects; missing payout progress defaults to 未开始 for this demo.
const officialItemMetadata: Record<string, { itemType: string; field: string }> = {
  "bda-games": { itemType: "待核实", field: "文化创意" },
  "bda-talent": { itemType: "非资金类", field: "人才引进" },
  "bda-space-industry": { itemType: "待核实", field: "商业航天" },
  "bda-services": { itemType: "待核实", field: "生产性服务业" },
  "bda-ai-talent": { itemType: "资金类", field: "人工智能" },
  "bda-global-rd": { itemType: "资金类", field: "科技创新" },
  "bda-space": { itemType: "待核实", field: "产业空间" },
  "bda-finance": { itemType: "待核实", field: "产业金融" },
  "bda-xr": { itemType: "资金类", field: "新一代信息技术领域" },
  "bda-energy": { itemType: "待核实", field: "绿色发展" },
  "bda-biomed": { itemType: "待核实", field: "生物医药和大健康领域" },
  "bda-challenge": { itemType: "待核实", field: "科技创新" },
};

export const EFFECT_OFFICIAL_RECORDS: BusinessRecord[] = documents.flatMap(doc => {
  const policy: BusinessRecord = { id: `official-policy-${doc.id}`, kind: "policy", name: doc.name, department: doc.department, publisher: doc.publisher ?? doc.department, level: doc.level, date: doc.date, code: doc.code, status: doc.status, sourceUrl: doc.sourceUrl, content: doc.content };
  if (!doc.item) return [policy];
  const item: BusinessRecord = { id: `official-item-${doc.id}`, kind: "item", name: doc.item, department: doc.department, publisher: policy.publisher, level: doc.level, date: doc.date, startDate: doc.startDate, endDate: doc.endDate, policyId: policy.id, policyName: policy.name, sourceUrl: doc.sourceUrl, applicationStatus: doc.endDate < "2026-11-03" ? "申报已截止" : "申报中" };
  return [policy, { ...item, ...officialItemMetadata[doc.id], method: "未知", redemptionStatus: "未开始" }];
});
EFFECT_OFFICIAL_RECORDS.push({
  id: "official-interpretation-beijing-ecommerce", kind: "interpretation",
  name: "《关于申报2026年促进电子商务高质量发展支持政策的通知》政策解读",
  department: "北京市商务局", publisher: "北京市商务局", level: "北京市", date: "2026-03-30",
  policyId: "official-policy-beijing-ecommerce", policyName: documents.find(doc => doc.id === "beijing-ecommerce")!.name,
  sourceUrl: "https://www.beijing.gov.cn/zhengce/zcjd/202603/t20260330_4570016.html",
});

export function withOfficialEffectRecords(records: BusinessRecord[]): BusinessRecord[] {
  const removed = new Set<string>();
  for (const official of EFFECT_OFFICIAL_RECORDS) {
    const slot = records.find(r => !removed.has(r.id) && r.kind === official.kind && (official.kind === "interpretation" || (official.level === "经开区" ? r.department === official.department : r.level === official.level)));
    if (!slot) throw new Error(`No publication slot for ${official.id}`);
    removed.add(slot.id);
  }
  const remainingPolicies = records.filter(r => r.kind === "policy" && !removed.has(r.id));
  return [...records.filter(r => !removed.has(r.id) && !(r.kind !== "policy" && r.kind !== "item" && r.itemId && removed.has(r.itemId))).map(r => {
    if (!r.policyId || !removed.has(r.policyId)) return r;
    // Keep fictional associations within fictional records, never attach invented payments to official documents.
    const policy = remainingPolicies.find(p => p.department === r.department) ?? remainingPolicies[0];
    return { ...r, policyId: policy.id, policyName: policy.name };
  }), ...EFFECT_OFFICIAL_RECORDS];
}
