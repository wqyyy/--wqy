export type DictionaryKind = "synonym" | "professional" | "sensitive" | "fixed" | "abbreviation";
export type DictionaryEntry = { id: string; words: string[]; detail: string };
export const SENSITIVE_TYPES = ["涉政", "涉黄", "涉暴", "禁止用语"];
const pairs: Record<DictionaryKind, string[][]> = {
  synonym: [
    ["北京", "首都"], ["扶持", "支持"], ["推进", "推动"], ["促进", "促成"], ["培育", "培养"],
    ["提升", "提高"], ["优化", "改进"], ["协同", "协作"], ["统筹", "通盘考虑"], ["鼓励", "倡导"],
    ["落实", "落地实施"], ["保障", "保证"], ["完善", "健全"], ["加快", "提速"], ["引导", "指引"],
  ],
  professional: [
    ["营商环境", "企业等经营主体在市场活动中所涉及的体制机制性因素和条件。"],
    ["产业链", "围绕产品或服务形成的研发、生产、流通、应用等相互关联的环节。"],
    ["创新链", "由基础研究、技术研发、成果转化到产业化应用构成的创新活动链条。"],
    ["科技成果转化", "为提高生产力而对科技成果开展后续试验、开发、应用和推广的活动。"],
    ["技术转移", "技术成果、知识和能力在不同主体之间转移、传播与应用的过程。"],
    ["概念验证", "对早期创新成果的技术可行性和潜在应用价值进行初步验证。"],
    ["中试验证", "在实验室研究与规模化生产之间开展工艺、装备和产品的试验验证。"],
    ["首台套", "在品种、规格或技术参数等方面取得创新突破，并处于初始市场推广阶段的装备及配套产品。"],
    ["公共服务平台", "面向多个主体提供技术、信息、检测、咨询等共性服务的载体。"],
    ["产业集群", "在一定区域内集聚并形成分工协作关系的企业及相关机构群体。"],
    ["梯度培育", "按照企业不同发展阶段和能力水平，分层分类开展培育和支持。"],
    ["数字化转型", "利用数字技术推动业务流程、组织方式和商业模式系统性变革。"],
    ["揭榜挂帅", "围绕明确的技术需求发布任务，由具备能力的主体竞争承担攻关工作。"],
    ["贷款贴息", "对符合条件的贷款利息支出给予一定资金补助的支持方式。"],
    ["绩效评价", "根据设定目标和指标，对政策或项目的投入、产出及效益进行评价。"],
  ],
  sensitive: [
    ["煽动颠覆", "涉政"], ["暴力夺权", "涉政"], ["煽动分裂", "涉政"], ["非法政治募资", "涉政"],
    ["色情交易", "涉黄"], ["淫秽视频", "涉黄"], ["色情直播", "涉黄"], ["招嫖", "涉黄"],
    ["打架", "涉暴"], ["持刀伤人", "涉暴"], ["聚众斗殴", "涉暴"], ["暴力恐吓", "涉暴"],
    ["保证获批", "禁止用语"], ["包过审批", "禁止用语"], ["百分之百兑现", "禁止用语"],
  ],
  fixed: [
    ["联动机制", "联动的机制"], ["依法依规", "依照法律依照规章"], ["统筹推进", "统筹的推进"],
    ["协同联动", "协同的联动"], ["提质增效", "提高质量增加效率"], ["优化营商环境", "优化营业环境"],
    ["强化责任落实", "强化责任的落实"], ["加强组织领导", "增强组织领导"], ["完善配套措施", "完备配套的措施"],
    ["健全工作机制", "健全工作的机制"], ["加大支持力度", "加大支持的力度"], ["推动政策落实", "推动政策的落地落实工作落实"],
    ["促进成果转化", "促进成果的转换"], ["激发创新活力", "激活创新的活力"], ["形成工作合力", "形成工作的合力"],
  ],
  abbreviation: [
    ["经开区", "经济技术开发区"], ["中小企业", "中型、小型和微型企业"], ["科创", "科技创新"],
    ["研发", "研究与试验发展"], ["技改", "技术改造"], ["知产", "知识产权"], ["工信", "工业和信息化"],
    ["发改", "发展和改革"], ["人社", "人力资源和社会保障"], ["市监", "市场监督管理"],
    ["自贸试验区", "自由贸易试验区"], ["专精特新", "专业化、精细化、特色化、新颖化"],
    ["产学研", "产业、学校和科研机构"], ["产教融合", "产业与教育融合"], ["两化融合", "信息化和工业化融合"],
  ],
};
export function createDictionaryEntries(kind: DictionaryKind): DictionaryEntry[] {
  return pairs[kind].map((pair, index) => ({ id: `${kind}-${index + 1}`, words: kind === "synonym" ? pair : [pair[0]], detail: kind === "synonym" ? "" : pair[1] }));
}
export function loadDictionaryEntries(kind: DictionaryKind): DictionaryEntry[] {
  try {
    const raw = localStorage.getItem(`policy-dictionary-v1:${kind}`);
    if (raw !== null) {
      const value = JSON.parse(raw);
      if (Array.isArray(value) && value.every(entry => typeof entry.id === "string" && Array.isArray(entry.words) && entry.words.every((word: unknown) => typeof word === "string") && typeof entry.detail === "string")) return value;
    }
  } catch { /* Fall back to the initial vocabulary when the cache is invalid. */ }
  return createDictionaryEntries(kind);
}
export function saveDictionaryEntries(kind: DictionaryKind, entries: DictionaryEntry[]) {
  localStorage.setItem(`policy-dictionary-v1:${kind}`, JSON.stringify(entries));
}

export function loadPersonalDictionaryEntries(kind: DictionaryKind): DictionaryEntry[] {
  try {
    const raw = localStorage.getItem(`policy-dictionary-personal-v2:${kind}`);
    if (raw !== null) {
      const entries = JSON.parse(raw);
      if (Array.isArray(entries) && entries.every(entry => entry && typeof entry.id === "string" && Array.isArray(entry.words) && entry.words.every((word: unknown) => typeof word === "string") && typeof entry.detail === "string")) return entries;
    }
  } catch { /* Preserve the legacy vocabulary when a personal cache cannot be read. */ }
  const publicEntries = createDictionaryEntries(kind);
  return loadDictionaryEntries(kind).flatMap(entry => {
    const original = publicEntries.find(item => item.id === entry.id);
    if (!original) return [entry];
    if (JSON.stringify(original.words) === JSON.stringify(entry.words) && original.detail === entry.detail) return [];
    return [{ ...entry, id: `personal-${entry.id}` }];
  });
}

export function savePersonalDictionaryEntries(kind: DictionaryKind, entries: DictionaryEntry[]) {
  localStorage.setItem(`policy-dictionary-personal-v2:${kind}`, JSON.stringify(entries));
}
