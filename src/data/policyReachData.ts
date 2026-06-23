export type PolicyItemStatus = "申报中" | "即将截止" | "已结束";

export interface PolicyItem {
  id: string;
  title: string;
  department: string;
  publishDate: string;
  startDate: string;
  endDate: string;
  type: "补贴" | "奖励" | "减免" | "服务" | "融资";
  status: PolicyItemStatus;
  estimatedPushCount: number;
  totalPushed: number;
  summary: string;
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
    id: "pi007",
    title: "2026年一季度建筑业产值增长奖励",
    department: "发展和改革委员会",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "申报中",
    estimatedPushCount: 94,
    totalPushed: 52,
    summary: "对当年度第一季度产值同比增长的规上建筑业企业给予产值奖励",
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
    status: "申报中",
    estimatedPushCount: 118,
    totalPushed: 67,
    summary: "对当年度第一季度营业收入同比增长的规上租赁和商务服务业企业给予营收奖励",
    enterpriseTags: ["租赁和商务服务业", "规上企业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
  {
    id: "pi009",
    title: "2026年一季度批发和零售业提质增效奖励",
    department: "商务局",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "申报中",
    estimatedPushCount: 156,
    totalPushed: 89,
    summary: "对当年度第一季度营业收入同比增长的规上批发和零售业企业给予营收奖励",
    enterpriseTags: ["批发和零售业", "规上企业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
  {
    id: "pi010",
    title: "2026年一季度居民服务业提质增效奖励",
    department: "商务局",
    publishDate: "2026-01-10",
    startDate: "2026-01-15",
    endDate: "2026-04-30",
    type: "奖励",
    status: "申报中",
    estimatedPushCount: 72,
    totalPushed: 41,
    summary: "对当年度第一季度营业收入同比增长的居民服务、修理和其他服务业企业给予营收奖励",
    enterpriseTags: ["居民服务、修理和其他服务业", "当年度第一季度营业收入同比增长", "营收奖励"],
  },
];

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
  }));
}

export const PUSHED_COMPANIES: PushedCompany[] = [
  ...genCompanies("pi007", 8),
  ...genCompanies("pi008", 8),
  ...genCompanies("pi009", 10),
  ...genCompanies("pi010", 6),
];
