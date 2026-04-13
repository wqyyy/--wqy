/** 政策觸達模擬資料 */

export interface PolicyItem {
  id: string;
  title: string;
  department: string;
  publishDate: string;   // YYYY-MM-DD
  startDate: string;     // 兌現開始
  endDate: string;       // 兌現截止
  type: "补贴" | "奖励" | "减免" | "服务" | "融资";
  totalPushed: number;   // 已推送企業數
  summary: string;
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
  matchPoints: string[];  // 符合條件的點
  pushReason: string;     // 推送原因
  pushTime: string;       // 推送時間
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
    id: "pi001",
    title: "2024年度高新技术企业认定奖励申报",
    department: "科学技术局",
    publishDate: "2024-11-15",
    startDate: "2024-12-01",
    endDate: "2025-01-31",
    type: "奖励",
    totalPushed: 142,
    summary: "对当年新认定的高新技术企业给予一次性奖励20万元，连续认定的给予10万元奖励",
  },
  {
    id: "pi002",
    title: "企业研发费用补贴（第三批）",
    department: "发展和改革委员会",
    publishDate: "2024-11-08",
    startDate: "2024-11-20",
    endDate: "2025-02-28",
    type: "补贴",
    totalPushed: 89,
    summary: "对年度研发投入超过上年50%的企业，按超出部分的20%给予补贴，最高200万元",
  },
  {
    id: "pi003",
    title: "绿色低碳转型企业专项资金申报",
    department: "生态环境局",
    publishDate: "2024-10-28",
    startDate: "2024-11-10",
    endDate: "2025-01-15",
    type: "补贴",
    totalPushed: 63,
    summary: "支持企业开展清洁生产和碳排放减少项目，对通过验收的项目按投资额的15%给予补贴",
  },
  {
    id: "pi004",
    title: "人才引进安家补贴（第四季度）",
    department: "人力资源和社会保障局",
    publishDate: "2024-10-15",
    startDate: "2024-10-25",
    endDate: "2025-03-31",
    type: "补贴",
    totalPushed: 217,
    summary: "对新引进的博士及以上学历人才给予每月3000元生活补贴，硕士给予每月1500元，期限3年",
  },
  {
    id: "pi005",
    title: "小微企业增值税减免优惠申请",
    department: "财政局",
    publishDate: "2024-10-01",
    startDate: "2024-10-01",
    endDate: "2025-09-30",
    type: "减免",
    totalPushed: 534,
    summary: "月销售额10万元以下的小微企业可享受增值税减免，符合条件的企业无需申报自动享受",
  },
  {
    id: "pi006",
    title: "数字化转型专项奖励",
    department: "工业和信息化局",
    publishDate: "2024-09-20",
    startDate: "2024-10-08",
    endDate: "2025-01-31",
    type: "奖励",
    totalPushed: 78,
    summary: "对完成数字化转型改造并通过专家评审的企业，按改造投入的20%给予奖励，最高100万元",
  },
  {
    id: "pi007",
    title: "科技贷款贴息专项（2024年度）",
    department: "科学技术局",
    publishDate: "2024-09-05",
    startDate: "2024-09-15",
    endDate: "2024-12-31",
    type: "融资",
    totalPushed: 156,
    summary: "对科技型企业获得银行贷款的利率超出LPR部分，由区财政给予全额贴息，每家最高50万元/年",
  },
  {
    id: "pi008",
    title: "知识产权贯标奖励申报",
    department: "市场监督管理局",
    publishDate: "2024-08-18",
    startDate: "2024-09-01",
    endDate: "2024-11-30",
    type: "奖励",
    totalPushed: 45,
    summary: "对完成知识产权管理规范贯标认证的企业给予10万元奖励，并优先推荐享受知识产权质押融资",
  },
  {
    id: "pi009",
    title: "外贸企业参展补贴（下半年）",
    department: "商务局",
    publishDate: "2024-08-01",
    startDate: "2024-08-15",
    endDate: "2024-12-31",
    type: "补贴",
    totalPushed: 92,
    summary: "对参加境外经贸展览会的企业，按展位费的50%给予补贴，单个企业每年最高20万元",
  },
  {
    id: "pi010",
    title: "专精特新\"小巨人\"企业培育申报",
    department: "工业和信息化局",
    publishDate: "2024-07-22",
    startDate: "2024-08-01",
    endDate: "2024-10-31",
    type: "服务",
    totalPushed: 38,
    summary: "面向符合条件的制造业企业开展\"专精特新\"培育辅导，对成功认定的企业给予100万元一次性奖励",
  },
];

const MATCH_POINTS_POOL: Record<string, string[][]> = {
  pi001: [
    ["已于2024年9月通过高新技术企业认定", "主营业务为人工智能软件开发，符合支持领域", "近三年研发投入占比达12.3%"],
    ["2024年10月完成高新技术企业首次认定", "拥有发明专利8项、实用新型专利15项", "科技人员占比超过35%"],
    ["连续3年保持高新技术企业资格", "研发人员占全体员工的42%", "近三年销售收入年均增长超20%"],
  ],
  pi002: [
    ["2024年研发投入较上年增长68%，超过50%门槛", "研发费用凭证齐全，可加计扣除", "在区内纳税正常，信用良好"],
    ["研发支出同比增长82%", "已建立独立核算的研发账目", "与3所高校开展产学研合作"],
  ],
  pi003: [
    ["已完成清洁生产审核并取得证书", "碳排放强度较上年降低18%", "完成节能改造投资320万元"],
    ["通过ISO 14001环境管理体系认证", "使用清洁能源占比超过60%", "废水废气排放均优于国家标准"],
  ],
  pi004: [
    ["2024年Q3新引进博士2人、硕士5人", "引进人才均在区内实际就业", "人才落户已在区内完成"],
    ["引进海外高层次人才1名（博士后）", "引进人才签订3年以上劳动合同", "人才薪酬符合补贴申报最低标准"],
  ],
};

const PUSH_REASONS: Record<string, string[]> = {
  pi001: [
    "企业已完成高新技术企业认定流程，认定证书在有效期内，符合本事项奖励申报资格",
    "系统检测到该企业于本年度完成高新技术企业首次认定，自动触发推送",
    "企业连续认定记录完整，本年度认定证书已更新，符合连续认定奖励申报条件",
  ],
  pi002: [
    "企业申报的研发费用加计扣除数据显示，本年度研发投入增幅超过50%触发阈值",
    "财务数据比对显示研发支出大幅增长，系统自动识别为潜在受益企业",
  ],
  pi003: [
    "企业已完成清洁生产改造项目验收，节能量和减排量均达到补贴申报标准",
    "企业环保档案显示通过ISO 14001认证且完成绿色改造投资，符合申报条件",
  ],
  pi004: [
    "社保数据显示企业本季度新增博士及硕士学历员工，符合人才引进补贴申报标准",
    "企业人才引进备案记录中包含高层次人才，系统自动推送补贴申报提醒",
  ],
};

/** 為每個事項生成企業名單 */
function genCompanies(policyId: string, count: number): PushedCompany[] {
  const pools = {
    names: [
      "北京智芯科技有限公司", "海淀区星辰人工智能有限公司", "北京绿能新材料股份有限公司",
      "宏远数字科技（北京）有限公司", "北京鑫桥精密仪器有限公司", "天工云计算北京有限公司",
      "北京远景生物医药技术有限公司", "创新合众半导体（北京）有限公司", "北京德睿新能源有限公司",
      "瑞恒智能制造（北京）有限公司", "北京锐科激光有限公司", "晨曦医疗器械（北京）有限公司",
      "北京普惠信息技术有限公司", "顺达物联网科技（北京）有限公司", "北京浩泰新材料有限公司",
    ],
    industries: ["人工智能", "新能源", "生物医药", "半导体", "智能制造", "数字经济", "绿色低碳", "新材料"],
    sizes: ["大型", "中型", "小型", "微型"] as const,
    statuses: ["已触达", "已申报", "未响应"] as const,
  };

  const matchPool = MATCH_POINTS_POOL[policyId] || [
    ["在区内注册并正常经营满一年", "企业信用状况良好，无重大违规记录", "符合本事项申报行业范围"],
  ];
  const reasonPool = PUSH_REASONS[policyId] || ["企业经营数据匹配本事项申报条件，系统自动识别并推送"];

  return Array.from({ length: count }, (_, i) => ({
    id: `${policyId}-c${i + 1}`,
    policyId,
    name: pools.names[i % pools.names.length],
    registrationNo: `91110${100000 + i * 37}X`,
    industry: pools.industries[i % pools.industries.length],
    size: pools.sizes[i % pools.sizes.length],
    establishedYear: 2008 + (i % 14),
    contact: `张${["伟", "芳", "敏", "超", "磊"][i % 5]}`,
    matchPoints: matchPool[i % matchPool.length],
    pushReason: reasonPool[i % reasonPool.length],
    pushTime: `2024-${String(10 + (i % 3)).padStart(2, "0")}-${String(1 + (i * 7) % 28).padStart(2, "0")} ${String(8 + i % 10).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
    status: pools.statuses[i % pools.statuses.length],
  }));
}

export const PUSHED_COMPANIES: PushedCompany[] = [
  ...genCompanies("pi001", 12),
  ...genCompanies("pi002", 8),
  ...genCompanies("pi003", 7),
  ...genCompanies("pi004", 15),
  ...genCompanies("pi005", 20),
  ...genCompanies("pi006", 9),
  ...genCompanies("pi007", 10),
  ...genCompanies("pi008", 6),
  ...genCompanies("pi009", 8),
  ...genCompanies("pi010", 5),
];
