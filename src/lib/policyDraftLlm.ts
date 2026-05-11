import type { PolicyItem } from "@/components/policy-drafting/drafting/PolicySearchStep";
import type { OutlineSection, OutlineSubSection } from "@/components/policy-drafting/drafting/OutlineGenerationStep";
import { policyLlmChat } from "@/lib/llmClient";
type CoreItem = {
  id: string;
  text: string;
  refs: { id: string; title: string; url?: string; clause?: string }[];
};

function extractJsonObject(text: string): unknown {
  const s = text.replace(/^\uFEFF/, "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : s;
  const start = body.indexOf("{");
  if (start === -1) throw new Error("未找到 JSON 对象");
  let depth = 0;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(body.slice(start, i + 1));
      }
    }
  }
  throw new Error("JSON 括号不匹配");
}

function normalizeOutline(raw: unknown): OutlineSection[] {
  const parseSubs = (subs: unknown): OutlineSubSection[] => {
    if (!Array.isArray(subs)) return [];
    return subs.map((sub: Record<string, unknown>, idx: number) => ({
      id: typeof sub.id === "string" ? sub.id : `sub-${idx}-${Date.now()}`,
      title: typeof sub.title === "string" ? sub.title : `第${idx + 1}节`,
      keyPoints: Array.isArray(sub.keyPoints)
        ? sub.keyPoints.filter((k): k is string => typeof k === "string")
        : [],
      referencePolicies: Array.isArray(sub.referencePolicies)
        ? sub.referencePolicies
            .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
            .map((r) => ({
              title: typeof r.title === "string" ? r.title : "",
              clause: typeof r.clause === "string" ? r.clause : "",
            }))
        : [],
    }));
  };

  let sections: unknown = raw;
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    const o = sections as Record<string, unknown>;
    if (Array.isArray(o.outline)) sections = o.outline;
    else if (Array.isArray(o.sections)) sections = o.sections;
  }

  if (!Array.isArray(sections)) throw new Error("outline 不是数组");

  return sections.map((sec: Record<string, unknown>, idx: number) => ({
    id: typeof sec.id === "string" ? sec.id : `part-${idx + 1}`,
    title: typeof sec.title === "string" ? sec.title : `第${idx + 1}部分`,
    subSections: parseSubs(sec.subSections),
  }));
}

export async function llmGenerateCoreElementsFromPolicies(
  selectedPolicies: PolicyItem[],
  policyTitle = "",
): Promise<{ coreElements: string; items: CoreItem[] }> {
  const refs = selectedPolicies.filter((p) => p.selected);
  const refLines = refs.map((p) => `- 《${p.title}》（${p.source || p.level}）`).join("\n");

  const sys =
    "你是地方政府产业政策研究员。根据用户拟起草的政策标题与参考政策，提炼 4～6 条「核心要素」要点，表述正式、可执行，避免空话。";
  const user = `拟起草政策标题：${policyTitle || "（未命名）"}

参考政策（标题列表）：
${refLines || "（暂无勾选参考，请按标题主题合理推断产业常见要素）"}

请只输出一个 JSON 对象（不要 Markdown），格式严格如下：
{"items":[{"text":"单条要素完整表述（不要加序号前缀）","refIndexes":[0,1]}]}
其中 refIndexes 为参考政策在上面的序号（从 0 开始），每条要素关联 1～2 条参考。`;

  const raw = await policyLlmChat({ system: sys, user, temperature: 0.35, max_tokens: 1800 });
  const json = extractJsonObject(raw) as { items?: { text?: string; refIndexes?: number[] }[] };
  const arr = Array.isArray(json.items) ? json.items : [];
  if (arr.length === 0) throw new Error("LLM 未返回 items");

  const items: CoreItem[] = arr.slice(0, 8).map((it, i) => {
    const text = typeof it.text === "string" ? it.text.trim() : "";
    const idxs = Array.isArray(it.refIndexes) ? it.refIndexes : [];
    const itemRefs = idxs
      .filter((j) => typeof j === "number" && j >= 0 && j < refs.length)
      .slice(0, 2)
      .map((j) => {
        const p = refs[j];
        return {
          id: p.id,
          title: p.title,
          url: p.url,
          clause: `参考《${p.title}》中与「${text.slice(0, 40)}」相关的要点表述（由模型归纳）。`,
        };
      });
    const fallbackRefs = refs.slice(i, i + 2).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      clause: `参考《${p.title}》相关条款（摘录归纳）。`,
    }));
    return {
      id: `ce-${Date.now()}-${i}`,
      text: `${i + 1}. ${text || `核心要素 ${i + 1}`}`,
      refs: itemRefs.length > 0 ? itemRefs : fallbackRefs,
    };
  });

  const coreElements = items.map((x) => x.text).join("\n");
  return { coreElements, items };
}

export async function llmGenerateOutline(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  coreItems?: CoreItem[];
}): Promise<{ outline: OutlineSection[] }> {
  const refs = params.selectedPolicies.filter((p) => p.selected);
  const refTitles = refs.map((p) => p.title).join("；");

  const sys =
    "你是政府政策性文件结构专家。根据政策标题与核心要素，设计三级大纲：一级章（如 一、总体要求）、二级节含要点提示，便于后续生成正文。";
  const user = `政策标题：${params.policyTitle}

核心要素：
${params.coreElements}

参考政策标题（可写入 referencePolicies 的 title 字段）：${refTitles || "无"}

请只输出一个 JSON 对象（不要 Markdown），结构：
{"outline":[
  {"id":"part-1","title":"一、总体目标","subSections":[
    {"id":"s1","title":"（一）指导思想","keyPoints":["要点1","要点2"],"referencePolicies":[{"title":"参考政策名","clause":"参考表述摘要"}]}
  ]}
]}
要求：至少 3 个一级章；每章至少 1 个 subSection；keyPoints 每节 2～4 条；referencePolicies 可与参考政策对应或概括。`;

  const raw = await policyLlmChat({ system: sys, user, temperature: 0.4, max_tokens: 3500 });
  const json = extractJsonObject(raw);
  const outline = normalizeOutline(json);

  if (outline.length === 0) throw new Error("大纲解析为空");

  return { outline };
}

export async function llmGenerateContent(params: {
  policyTitle: string;
  coreElements: string;
  selectedPolicies: PolicyItem[];
  outline: OutlineSection[];
}): Promise<{ content: string }> {
  const refs = params.selectedPolicies.filter((p) => p.selected);
  const refBlock = refs.map((p, i) => `${i + 1}. ${p.title}${p.source ? ` — ${p.source}` : ""}`).join("\n");

  const outlineBrief = params.outline
    .map((s) => {
      const subs = s.subSections
        .map((sub) => `  - ${sub.title}：${sub.keyPoints.slice(0, 3).join("；")}`)
        .join("\n");
      return `${s.title}\n${subs}`;
    })
    .join("\n\n");

  const sys =
    "你是省/市级政府机关政策撰稿人。根据给定要素与大纲撰写完整政策文本：用语规范、条款清晰，可使用「第一章」「第一条」等结构；包含简要导语、分章条文、附则与施行日期说明；不要输出 Markdown 代码围栏；可适当引用参考政策精神但不要编造文号。";

  const user = `请撰写政策全文。

【标题】
${params.policyTitle}

【核心要素】
${params.coreElements}

【结构提纲】
${outlineBrief}

【可参考政策目录】
${refBlock || "（无勾选）"}

要求：正文不少于 2000 汉字；层次清楚；最后包含施行说明及「本办法/措施由××部门负责解释，自印发之日起施行」类表述（部门可用「有关主管部门」）。`;

  const content = await policyLlmChat({
    system: sys,
    user,
    temperature: 0.42,
    max_tokens: 8192,
  });

  return { content: content.trim() };
}
