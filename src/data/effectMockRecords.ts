import type { BusinessRecord } from "@/lib/effectDrilldown";
import { EFFECT_DEPARTMENTS, EFFECT_POLICY_LEVELS, EFFECT_PUBLICATION_TOTALS } from "./effectPublicationCounts";

const departments = ["高端汽车和新能源产业局", "财政国资局", "营商环境建设局", "经济发展局", "组织人事部", "科技和产业促进局", "社会事业局", "生物技术和大健康产业局", "生态环境建设局", "机器人和智能制造产业局", "开发建设局", "市双智办", "宣传文化部", "城市运行局", "商务金融局", "北京经济技术开发区管理委员会", "北京市集成电路产业局", "信息技术产业局", "人力资源和社会保障局", "None"];
const topics = ["技术研发创新", "产业升级发展", "人才引进培养", "绿色低碳改造", "数字经济建设", "人工智能应用", "生物医药创新", "先进制造提升"];
const fields = ["科技创新", "产业升级", "人才引进", "绿色发展", "数字经济", "新一代信息技术领域", "生物医药和大健康领域", "其他", "未标注分类"];
const scales = ["个体工商户", "微型企业", "小型企业", "中型企业", "大型企业", "其他"];
const methods = ["标准兑现", "免申即享", "即申即享", "预兑现", "未知"];
const capital = [80, 300, 800, 2000];
const bands = ["注册资本<100万", "100万-500万", "500万-1000万", ">1000万"];

/** Deterministic, fully fictional records; monetary amounts are in ten-thousand yuan. */
export function generateEffectMockRecords(): BusinessRecord[] {
  const records: BusinessRecord[] = [];
  for (let year = 2021; year <= 2026; year++) {
    departments.forEach((department, d) => {
      for (let month = 1; month <= 12; month++) {
        const index = d * 12 + month - 1;
        const prefix = `mock-${year}-${d}-${month}`;
        const period = `${year}-${String(month).padStart(2, "0")}`;
        const topic = topics[index % topics.length];
        const policyId = `${prefix}-policy`;
        const policyName = `${year}年${topic}扶持办法（模拟${d + 1}-${month}）`;
        const itemId = `${prefix}-item`;
        const itemName = `${topic}${month}月专项扶持（模拟）`;
        const field = fields[index % fields.length];
        const method = methods[index % methods.length];
        const itemType = ["资金类", "非资金类", "未知"][index % 3];
        const base = { department, publisher: department, policyId, policyName, itemId, itemName, field, method, itemType, confirmed: true, redeemed: true };
        records.push({ id: policyId, kind: "policy", name: policyName, department, publisher: department, level: ["国家", "北京市", "经开区"][(month + d) % 3], code: `模拟发〔${year}〕${String(index + 1).padStart(3, "0")}号`, date: `${period}-01`, status: index % 11 === 0 ? "已失效" : "现行有效", content: `【模拟政策，非正式文件】\n一、适用范围\n面向经开区符合条件的企业开展${topic}支持。\n二、扶持标准\n按项目投入、创新能力及实际绩效综合核定扶持金额。\n三、组织实施\n由${department === "None" ? "相关主管部门" : department}组织申报、审核、公示和拨付。` });
        records.push({ ...base, id: `${prefix}-interpretation`, kind: "interpretation", name: `${policyName}政策解读（模拟）`, interpretationType: ["文字解读", "图文解读", "问答解读"][index % 3], date: `${period}-03`, content: `【模拟解读】\n支持对象：依法经营、符合专项条件的企业。\n支持方向：${topic}。\n申报材料：项目说明、经营数据及投入证明。\n申报程序：在线申报、部门审核、结果公示。` });
        records.push({ ...base, id: itemId, kind: "item", name: itemName, date: `${period}-04`, startDate: `${period}-05`, endDate: year === 2026 && month >= 9 ? "2026-12-31" : `${period}-20`, applicationStatus: year === 2026 && month >= 9 ? "申报中" : "申报已截止", target: "经开区依法登记且符合专项申报要求的企业（模拟）", standard: itemType === "非资金类" ? "提供专业辅导、服务对接等非资金支持（模拟）" : "根据实际投入按比例扶持，单项目最高不超过200万元（模拟）", content: `【模拟事项】\n本事项支持${topic}，可查看关联政策、扶持企业、核定结果和实际兑现记录。` });
        for (let recipient = 0; recipient < 2; recipient++) {
          const companyIndex = d * 24 + (month - 1) * 2 + recipient;
          const enterpriseId = `mock-enterprise-${companyIndex}`;
          const enterpriseName = `北京${topics[companyIndex % topics.length]}示例${String(companyIndex + 1).padStart(3, "0")}科技有限公司（模拟）`;
          const enterprise = { enterpriseId, enterpriseName, creditCode: `MOCK-${String(companyIndex + 1).padStart(8, "0")}`, scale: scales[companyIndex % scales.length], capital: capital[companyIndex % 4], capitalBand: bands[companyIndex % 4], region: "北京市经济技术开发区" };
          const approvedAmount = Number((30 + index * 0.65 + recipient * 8).toFixed(2));
          const amount = Number((approvedAmount * (recipient ? 0.8 : 0.9)).toFixed(2));
          records.push({ ...base, ...enterprise, id: `${prefix}-result-${recipient}`, kind: "result", name: `${itemName}扶持结果（模拟）`, approvedAmount, date: `${period}-22`, status: "已确认" });
          records.push({ ...base, ...enterprise, id: `${prefix}-fund-${recipient}`, kind: "fund", name: `${itemName}资金兑现记录（模拟）`, amount, approvedAmount, batch: `模拟拨付-${period}-${d + 1}`, date: `${period}-25`, status: "已拨付" });
          records.push({ ...base, ...enterprise, id: `${prefix}-enterprise-${recipient}`, kind: "enterprise", name: enterpriseName, date: `${period}-25` });
        }
      }
    });
  }
  return records;
}

export type MockItemApplication = { id: string; itemId: string; enterpriseName: string; creditCode: string; date: string; status: string };

/** Publication fixtures follow the existing board, not the size of the template pool. */
export function alignEffectPublicationRecords(templates: BusinessRecord[]): BusinessRecord[] {
  const records: BusinessRecord[] = [];
  const policies: BusinessRecord[] = [];
  const policyTemplates = templates.filter(r => r.kind === "policy");
  const addPolicies = (department: string, level: string, count: number) => {
    const pool = policyTemplates.filter(r => r.department === department);
    for (let i = 0; i < count; i++) {
      const source = (pool.length ? pool : policyTemplates)[(i * 13) % (pool.length || policyTemplates.length)];
      policies.push({ ...source, id: `board-policy-${policies.length}`, name: `${source.name}（${policies.length + 1}）`, department, publisher: department, level });
    }
  };
  for (const d of EFFECT_DEPARTMENTS) addPolicies(d.name, "经开区", d.published);
  for (const level of EFFECT_POLICY_LEVELS.filter(r => r.name !== "经开区")) addPolicies(`${level.name}有关部门`, level.name, level.count);
  records.push(...policies);
  const interpretationTemplates = templates.filter(r => r.kind === "interpretation");
  for (let i = 0; i < EFFECT_PUBLICATION_TOTALS.interpretation; i++) {
    const policy = policies[i % policies.length];
    records.push({ ...interpretationTemplates[i % interpretationTemplates.length], id: `board-interpretation-${i}`, name: `${policy.name}政策解读`, policyId: policy.id, policyName: policy.name, department: policy.department, publisher: policy.publisher });
  }
  const itemTemplates = templates.filter(r => r.kind === "item");
  const linked = new Map<string, BusinessRecord[]>();
  for (const r of templates) if (["result", "fund", "enterprise"].includes(r.kind) && r.itemId) linked.set(r.itemId, [...(linked.get(r.itemId) ?? []), r]);
  let itemIndex = 0;
  for (const d of EFFECT_DEPARTMENTS) {
    const pool = itemTemplates.filter(r => r.department === d.name);
    const departmentPolicies = policies.filter(r => r.department === d.name);
    for (let i = 0; i < d.items; i++, itemIndex++) {
      const source = pool[(i * 13) % pool.length];
      const policy = (departmentPolicies.length ? departmentPolicies : policies)[i % (departmentPolicies.length || policies.length)];
      const itemId = `board-item-${itemIndex}`;
      const item = { ...source, id: itemId, itemId, name: `${source.name}（${itemIndex + 1}）`, policyId: policy.id, policyName: policy.name };
      records.push(item);
      for (const child of linked.get(source.id) ?? []) records.push({ ...child, id: `${itemId}-${child.kind}-${child.id}`, itemId, itemName: item.name, policyId: policy.id, policyName: policy.name });
    }
  }
  return records;
}

export function generateEffectMockApplications(records: BusinessRecord[]): MockItemApplication[] {
  const results = new Map<string, BusinessRecord[]>();
  for (const record of records) if (record.kind === "result" && record.itemId) results.set(record.itemId, [...(results.get(record.itemId) ?? []), record]);
  return records.filter(r => r.kind === "item" && !r.sourceUrl).flatMap(item => [
    ...(results.get(item.id) ?? []).map(result => ({ id: `application-${result.id}`, itemId: item.id, enterpriseName: result.enterpriseName!, creditCode: result.creditCode!, date: item.startDate!, status: "已通过" })),
    { id: `application-pending-${item.id}`, itemId: item.id, enterpriseName: `北京${item.name.split("专项")[0]}申报示例有限公司（模拟）`, creditCode: `MOCK-APP-${item.id}`, date: item.startDate!, status: "审核中" },
  ]);
}
