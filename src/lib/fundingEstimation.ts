export type Operator = ">" | ">=" | "=" | "<=" | "<";
export type FundingCondition = { id: string; field: string; operator: Operator; value: string };
export type FundingField = { id: string; label: string; kind: "number" | "flag"; unit?: string; aliases?: string[]; disabled?: boolean };
export type FundingGroup = { category: string; title: string; fields: FundingField[] };
const numeric = (id: string, label: string, unit = "万元", aliases: string[] = []): FundingField => ({ id, label, kind: "number", unit, aliases });
const flags = (labels: string[], disabled = false): FundingField[] => labels.map(label => ({ id: label, label, kind: "flag", disabled }));

export const FUNDING_GROUPS: FundingGroup[] = [
  { category: "经营数据类", title: "生产经营指标", fields: [
    numeric("output", "上年度产值", "万元", ["工业产值", "年产值", "产值"]), numeric("revenue", "上年度营业收入", "万元", ["营业收入", "年营收", "营收"]),
    numeric("patents", "知识产权情况-专利", "项", ["专利数量", "专利"]), numeric("copyrights", "知识产权情况-著作权", "项", ["著作权"]),
    ...flags(["用地情况"]), numeric("investment", "投资项目情况-实缴总额", "万元", ["项目实缴投资", "实缴总投资"]), numeric("committedInvestment", "投资项目情况-应缴总额", "万元", ["项目应缴投资"]),
    ...flags(["上市企业"]), numeric("financing", "企业融资信息-最新融资总额", "万元", ["最新融资总额", "融资总额"]),
    ...["上年度税收", "固定资产投资额", "研发费", "社保人数", "技术交易情况-合同数"].map(label => ({ ...numeric(label, label), disabled: true })),
  ] },
  { category: "经营数据类", title: "注册信息", fields: [numeric("capital", "注册资本"), numeric("paidCapital", "实缴资本")] },
  { category: "行业领域类", title: "主导产业分类", fields: [...flags(["新一代信息技术产业", "高端汽车和新能源智能汽车产业", "机器人和智能制造产业", "生物技术和大健康产业"]), ...flags(["自动驾驶产业", "集成电路产业", "科文融合产业", "商业服务业产业"], true)] },
  { category: "行业领域类", title: "复合产业类", fields: [...flags(["数字经济企业"]), ...flags(["生产性服务业", "都市产业", "两业融合"], true)] },
  { category: "行业领域类", title: "行业特定资质类", fields: [...flags(["化妆品许可证", "食品许可证"]), ...flags(["药品注册证书", "医疗器械生产许可证", "第二类医疗器械产品注册证书", "第三类医疗器械产品注册证书", "医疗器械产品出口销售证明", "药物临床批件", "新能源汽车生产企业准入", "软件和信息技术服务竞争力百强企业", "人工智能模型备案", "北京自动驾驶测试资质", "车规级芯片认证", "工信部智能制造示范工厂", "无人驾驶航空器型号合格证（TC）、生产许可证（PC）以及运营合格证（OC）", "卫星通信基础电信业务经营许可经营牌照"], true)] },
  { category: "企业资质类", title: "规模类型", fields: [...flags(["规上企业", "大型企业", "总部企业", "外资企业", "独角兽企业"]), ...flags(["世界500强企业", "北京市民营百强企业"], true)] },
  { category: "企业资质类", title: "资质称号", fields: [...flags(["小巨人", "专精特新", "国家高新技术企业", "中关村高新技术企业", "创新型中小企业", "隐形冠军", "国家级研发机构", "市级研发机构", "中小企业公共服务示范平台", "院士专家工作站", "北京市企业技术中心", "国家企业技术中心", "公共技术服务平台", "知识产权示范企业", "博士后工作站", "科技型中小企业", "经开区首台套", "北京市首台套", "国家科学技术进步奖", "北京市科学技术进步奖", "北京市发明专利奖", "中试基地"]), ...flags(["新一代信息技术与制造业融合发展示范企业", "绿色工厂", "灯塔工厂", "单项冠军"], true)] },
  { category: "企业资质类", title: "重点清单", fields: flags(["承担国家科技专项", "承担市级科技专项", "经开区年度重大项目清单", "人才引进计划单列企业", "三个100投资项目清单", "区内投融资机构投资支持", "重点用人主体", "服务包企业（市级、区级）"], true) },
  { category: "监管及负面清单类", title: "监管及负面清单", fields: [...flags(["失信主体"]), ...flags(["违建主体", "非法园区"], true)] },
];
export const FUNDING_FIELDS = FUNDING_GROUPS.flatMap(group => group.fields);
export const ENABLED_FIELDS = FUNDING_FIELDS.filter(field => !field.disabled);
export const getFundingField = (id: string) => FUNDING_FIELDS.find(field => field.id === id);
export const makeCondition = (field: string): FundingCondition => ({ id: crypto.randomUUID(), field, operator: getFundingField(field)?.kind === "number" ? ">=" : "=", value: getFundingField(field)?.kind === "number" ? "" : "true" });

export function parseFundingConditions(text: string): FundingCondition[] {
  const result: FundingCondition[] = [];
  for (const field of ENABLED_FIELDS) {
    const terms = [field.label, ...(field.aliases ?? [])].sort((a, b) => b.length - a.length);
    const found = terms.find(term => text.includes(term));
    if (!found) continue;
    if (field.kind === "flag") {
      const before = text.slice(Math.max(0, text.indexOf(found) - 5), text.indexOf(found));
      result.push({ ...makeCondition(field.id), value: /不属于|非|不是|无|不为|不得为/.test(before) ? "false" : "true" });
      continue;
    }
    const escaped = found.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}(?:[为在达的额数量计：:\\s]*)(不低于|不少于|不小于|至少|超过|高于|大于|不超过|不高于|至多|低于|小于|等于|达到|>=|<=|>|<|=)?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(亿元|亿|万元|万|元|项|个)?\\s*(以上|以下|及以上|及以下)?`, "g");
    for (const match of text.matchAll(pattern)) {
      let value = Number(match[2]);
      if (field.unit === "万元") {
        if (match[3] === "亿元" || match[3] === "亿") value *= 10000;
        if (match[3] === "元") value /= 10000;
      }
      const raw = match[1] || match[4] || "=";
      const operator: Operator = /不低于|不少于|不小于|至少|达到|以上|>=/.test(raw) ? ">=" : /不超过|不高于|至多|以下|<=/.test(raw) ? "<=" : /超过|高于|大于|^>$/.test(raw) ? ">" : /低于|小于|^<$/.test(raw) ? "<" : "=";
      result.push({ ...makeCondition(field.id), operator, value: String(value) });
    }
  }
  return result;
}

export type FundingCompany = {
  id: string; name: string; creditCode: string; capital: number; address: string; establishedAt: string;
  industry: string; category: string; area: string; metrics: Record<string, number>; tags: string[];
};
// Basic information transcribed from the supplied reference; operating metrics below are demo fixtures.
const baseCompanies = [
  ["中芯北方集成电路制造（北京）有限公司", "91110302071737747W", 480000, "文昌大道18号9幢", "2013-07-12", "制造业"],
  ["航天长征化学工程股份有限公司", "91110000663105807B", 53599, "路东区经海四路141号", "2007-06-22", "建筑业"],
  ["北京天诚同创电气有限公司", "91110302682855128U", 10000, "博兴一路8号1幢", "2008-12-16", "制造业"],
  ["北京奔驰汽车有限公司", "91110302600003205F", 321261, "博兴路8号", "1983-07-01", "制造业"],
  ["北京集创北方科技股份有限公司", "91110108679604408D", 43106.5, "景园北街2号56幢8层801", "2008-09-03", "科学研究和技术服务业"],
  ["北京小米电子产品有限公司", "91110302587727910P", 2700, "科创十街15号院5号楼8层802室", "2012-01-09", "制造业"],
  ["经纬纺织机械股份有限公司", "91110000110052522M", 70413, "永昌中路8号", "1996-03-29", "制造业"],
  ["阿帕奇（北京）光纤激光技术有限公司", "91110302794051423M", 150, "景园北街2号28楼", "2006-11-25", "科学研究和技术服务业"],
] as const;
export const FUNDING_COMPANIES: FundingCompany[] = baseCompanies.map((row, index) => ({
  id: `funding-${index + 1}`, name: row[0], creditCode: row[1], capital: row[2], address: `北京市北京经济技术开发区${row[3]}`, establishedAt: row[4], industry: row[5],
  category: ["有限责任公司（外商投资）", "其他股份有限公司（上市）", "有限责任公司（法人独资）", "有限责任公司（中外合资）"][index % 4],
  area: ["荣华港", "通明湖港", "博兴港", "永康港", "亦庄港", "瀛海港", "迎城港", "荣华港"][index],
  metrics: { capital: row[2], paidCapital: row[2] * 0.8, revenue: [80000, 18000, 9000, 100000, 12000, 20000, 8000, 600][index], output: [120000, 0, 11000, 160000, 6000, 25000, 14000, 400][index], patents: [120, 45, 30, 200, 150, 90, 40, 12][index], copyrights: index * 3, investment: (index + 1) * 500, committedInvestment: (index + 1) * 1000, financing: index * 200 },
  tags: [...(index === 3 ? ["高端汽车和新能源智能汽车产业", "外资企业"] : index % 2 === 0 ? ["新一代信息技术产业", "数字经济企业"] : ["机器人和智能制造产业"]), ...(index < 7 ? ["规上企业", "国家高新技术企业"] : ["科技型中小企业"]), ...(index % 2 ? ["专精特新", "用地情况"] : ["小巨人", "大型企业"]), ...(index === 1 || index === 6 ? ["上市企业"] : [])],
}));

export const isValidCondition = (condition: FundingCondition) => {
  const field = getFundingField(condition.field);
  if (!field || field.disabled) return false;
  return field.kind === "flag" ? ["true", "false"].includes(condition.value) : condition.value.trim() !== "" && Number.isFinite(Number(condition.value)) && Number(condition.value) >= 0;
};
function matches(company: FundingCompany, condition: FundingCondition) {
  const field = getFundingField(condition.field)!;
  if (field.kind === "flag") return company.tags.includes(field.id) === (condition.value === "true");
  const actual = company.metrics[field.id];
  if (actual === undefined) return false;
  const expected = Number(condition.value);
  return condition.operator === ">" ? actual > expected : condition.operator === ">=" ? actual >= expected : condition.operator === "<" ? actual < expected : condition.operator === "<=" ? actual <= expected : actual === expected;
}
export function filterFundingCompanies(conditions: FundingCondition[], companies = FUNDING_COMPANIES) {
  if (conditions.some(condition => !isValidCondition(condition))) throw new Error("请完善全部测算条件");
  return companies.filter(company => conditions.every(condition => matches(company, condition)));
}
export type FundingSupport = { mode: "fixed" | "ratio"; amount: string; metric: string; ratio: string; cap: string };
export function validFundingSupport(support: FundingSupport) {
  const positive = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
  return support.mode === "fixed" ? positive(support.amount) : Boolean(ENABLED_FIELDS.find(field => field.id === support.metric && field.unit === "万元")) && positive(support.ratio) && Number(support.ratio) <= 100 && (support.cap === "" || positive(support.cap));
}
export function calculateFunding(conditions: FundingCondition[], support: FundingSupport) {
  if (!validFundingSupport(support)) throw new Error("请完善扶持方式和金额");
  const companies = filterFundingCompanies(conditions);
  const amounts = companies.map(company => {
    const base = support.mode === "fixed" ? Number(support.amount) : company.metrics[support.metric] * Number(support.ratio) / 100;
    const capped = support.mode === "ratio" && support.cap !== "" ? Math.min(base, Number(support.cap)) : base;
    return { company, amount: Math.round(capped * 1_000_000) / 1_000_000 };
  });
  return { companies, amounts, total: amounts.reduce((sum, item) => sum + Math.round(item.amount * 1_000_000), 0) / 1_000_000 };
}
export type FundingResult = ReturnType<typeof calculateFunding>;
export const EXTERNAL_ENTERPRISE_DETAIL = "https://zcdx.kfqgw.beijing.gov.cn/#/enterprise/detail?code=G8IrhepGZxKa1eF44PdXZACmm0_KeGGZvix8SkiIsRU";
