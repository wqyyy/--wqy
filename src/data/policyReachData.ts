export type PolicyItemStatus = "申报中" | "即将截止" | "已截止";
export type PolicyPushStatus = "待推送" | "已推送";

export interface PolicyItem {
  id: string;
  title: string;
  department: string;
  publishDate: string;
  startDate: string;
  endDate: string;
  type: "补贴" | "奖励" | "减免" | "服务" | "融资";
  status: PolicyItemStatus;
  pushStatus: PolicyPushStatus;
  /** 模型预估可匹配企业数（待推送事项） */
  estimatedPushCount: number;
  /** 已推送企业数（已推送事项） */
  totalPushed: number;
  /** 成功推送企业数（已推送事项） */
  successfulPushCount: number;
  summary: string;
  /** 事项关联的上位政策文件 */
  relatedPolicy: string;
  /** 事项发布部门 */
  publishDepartment: string;
  /** 企业匹配标签值（事项打标） */
  enterpriseTags?: string[];
}

export interface PushedCompany {
  id: string;
  policyId: string;
  name: string;
  registrationNo: string;
  industry: string;
  size: "大型" | "中型" | "小型" | "微型";
  establishedYear: number;
  contact: string;
  matchPoints: string[];
  pushReason: string;
  pushTime: string;
  status: "已触达" | "已申报" | "未响应";
  /** 推送是否成功送达企业端 */
  pushResult: "成功" | "失败";
}

export const DEPARTMENTS = [
  "发展和改革委员会",
  "科学技术局",
  "工业和信息化局",
  "财政局",
  "人力资源和社会保障局",
  "商务局",
  "市场监督管理局",
  "生态环境局",
];

export const POLICY_ITEMS: PolicyItem[] = [
  {
    id: "pi011",
    title: "2026年软件和信息技术服务业研发投入奖励",
    department: "科学技术局",
    publishDate: "2026-06-01",
    startDate: "2026-06-10",
    endDate: "2026-10-31",
    type: "奖励",
    status: "申报中",
    pushStatus: "已推送",
    estimatedPushCount: 86,
    totalPushed: 43,
    successfulPushCount: 38,
    summary: "对当年度研发投入达到一定规模的软件和信息技术服务业企业给予研发奖励",
    relatedPolicy: "北京经济技术开发区促进科技创新发展若干措施",
    publishDepartment: "科学技术服务中心",
    enterpriseTags: ["软件和信息技术服务业", "研发投入", "规上企业", "研发奖励"],
  },
  {
    id: "pi009",
    title: "2026年一季度批发和零售业提质增效奖励",
    department: "商务局",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-09-30",
    type: "奖励",
    status: "申报中",
    pushStatus: "待推送",
    estimatedPushCount: 156,
    totalPushed: 0,
    successfulPushCount: 0,
    summary: "对当年度第一季度营业收入同比增长的规上批发和零售业企业给予营收奖励",
    relatedPolicy: "北京经济技术开发区促进商贸服务业高质量发展若干措施",
    publishDepartment: "商务服务中心",
    enterpriseTags: ["批发和零售业", "规上企业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
  {
    id: "pi007",
    title: "2026年一季度建筑业产值增长奖励",
    department: "发展和改革委员会",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "已截止",
    pushStatus: "已推送",
    estimatedPushCount: 94,
    totalPushed: 52,
    successfulPushCount: 47,
    summary: "对当年度第一季度产值同比增长的规上建筑业企业给予产值奖励",
    relatedPolicy: "北京经济技术开发区促进建筑业高质量发展若干措施",
    publishDepartment: "发展和改革服务中心",
    enterpriseTags: ["建筑业", "规上企业", "当年度第一季度产值同比增长", "产值奖励"],
  },
  {
    id: "pi008",
    title: "2026年一季度租赁和商务服务业提质增效奖励",
    department: "商务局",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "已截止",
    pushStatus: "已推送",
    estimatedPushCount: 118,
    totalPushed: 67,
    successfulPushCount: 61,
    summary: "对当年度第一季度营业收入同比增长的规上租赁和商务服务业企业给予营收奖励",
    relatedPolicy: "北京经济技术开发区促进商贸服务业高质量发展若干措施",
    publishDepartment: "商务服务中心",
    enterpriseTags: ["租赁和商务服务业", "规上企业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
  {
    id: "pi010",
    title: "2026年一季度居民服务业提质增效奖励",
    department: "商务局",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "已截止",
    pushStatus: "待推送",
    estimatedPushCount: 72,
    totalPushed: 0,
    successfulPushCount: 0,
    summary: "对当年度第一季度营业收入同比增长的居民服务、修理和其他服务业企业给予营收奖励",
    relatedPolicy: "北京经济技术开发区促进生活性服务业品质提升若干措施",
    publishDepartment: "商务服务中心",
    enterpriseTags: ["居民服务、修理和其他服务业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
];

export function isReachItemDeadlinePassed(item: PolicyItem, referenceDate = new Date()): boolean {
  const today = referenceDate.toISOString().slice(0, 10);
  return item.status === "已截止" || item.endDate < today;
}

/** 事项是否应在触达列表中展示：申报期内全部展示；已截止仅展示已推送事项 */
export function isVisibleInReachList(item: PolicyItem, referenceDate = new Date()): boolean {
  if (!isReachItemDeadlinePassed(item, referenceDate)) return true;
  return item.pushStatus === "已推送";
}

/** 申报中优先于已截止；同组内已推送优先于待推送 */
export function compareReachListItems(a: PolicyItem, b: PolicyItem, referenceDate = new Date()): number {
  const aPassed = isReachItemDeadlinePassed(a, referenceDate);
  const bPassed = isReachItemDeadlinePassed(b, referenceDate);
  if (aPassed !== bPassed) return aPassed ? 1 : -1;

  const aPushed = a.pushStatus === "已推送" ? 0 : 1;
  const bPushed = b.pushStatus === "已推送" ? 0 : 1;
  if (aPushed !== bPushed) return aPushed - bPushed;

  return a.endDate.localeCompare(b.endDate) || a.id.localeCompare(b.id);
}

const matchPointsPool: Record<string, string[][]> = {
  pi007: [
    ["当年度第一季度建筑业产值同比增长", "规上建筑业企业", "在区内注册并正常经营"],
  ],
  pi008: [
    ["当年度第一季度租赁和商务服务业营业收入同比增长", "规上租赁和商务服务业企业", "在区内注册并正常经营"],
  ],
  pi009: [
    ["当年度第一季度批发和零售业营业收入同比增长", "规上批发和零售业企业", "在区内注册并正常经营"],
  ],
  pi010: [
    ["当年度第一季度居民服务业营业收入同比增长", "居民服务、修理和其他服务业企业", "在区内注册并正常经营"],
  ],
  pi011: [
    ["软件和信息技术服务业", "当年度研发投入达到规定标准", "在区内注册并正常经营"],
  ],
};

const pushReasons: Record<string, string[]> = {
  pi007: [
    "企业为规上建筑业企业，当年度第一季度产值同比增长，符合本事项奖励申报条件",
  ],
  pi008: [
    "企业为规上租赁和商务服务业企业，当年度第一季度营业收入同比增长，符合本事项奖励申报条件",
  ],
  pi009: [
    "企业为规上批发和零售业企业，当年度第一季度营业收入同比增长，符合本事项奖励申报条件",
  ],
  pi010: [
    "企业为居民服务、修理和其他服务业企业，当年度第一季度营业收入同比增长，符合本事项奖励申报条件",
  ],
  pi011: [
    "企业为软件和信息技术服务业企业，当年度研发投入达到规定标准，符合本事项研发奖励申报条件",
  ],
};

function genCompanies(policyId: string, count: number): PushedCompany[] {
  const pools = {
    names: [
      "北京智芯科技有限公司",
      "海淀区星辰人工智能有限公司",
      "北京绿能新材料股份有限公司",
      "宏远数字科技（北京）有限公司",
      "北京鑫桥精密仪器有限公司",
      "天工云计算北京有限公司",
      "北京远景生物医药技术有限公司",
      "创新合众半导体（北京）有限公司",
    ],
    industries: ["人工智能", "新能源", "生物医药", "半导体", "智能制造", "数字经济", "绿色低碳", "新材料"],
    sizes: ["大型", "中型", "小型", "微型"] as const,
    statuses: ["已触达", "已申报", "未响应"] as const,
  };

  const points = matchPointsPool[policyId] || [["在区内注册并正常经营满一年", "企业信用状况良好，无重大违规记录", "符合本事项申报行业范围"]];
  const reasons = pushReasons[policyId] || ["企业经营数据匹配本事项申报条件，系统自动识别并推送"];

  return Array.from({ length: count }, (_, index) => ({
    id: `${policyId}-c${index + 1}`,
    policyId,
    name: pools.names[index % pools.names.length],
    registrationNo: `91110${100000 + index * 37}X`,
    industry: pools.industries[index % pools.industries.length],
    size: pools.sizes[index % pools.sizes.length],
    establishedYear: 2008 + (index % 14),
    contact: `张${["伟", "芳", "敏", "超", "磊"][index % 5]}`,
    matchPoints: points[index % points.length],
    pushReason: reasons[index % reasons.length],
    pushTime: `2024-${String(10 + (index % 3)).padStart(2, "0")}-${String(1 + (index * 7) % 28).padStart(2, "0")} ${String(8 + (index % 10)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}`,
    status: pools.statuses[index % pools.statuses.length],
    pushResult: index === count - 1 ? "失败" : "成功",
  }));
}

export const PUSHED_COMPANIES: PushedCompany[] = [
  ...genCompanies("pi007", 8),
  ...genCompanies("pi008", 8),
  ...genCompanies("pi009", 10),
  ...genCompanies("pi010", 6),
  ...genCompanies("pi011", 8),
];
