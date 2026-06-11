import mammoth from "mammoth";
import type { OutlineSection, OutlineSubSection } from "@/components/policy-drafting/drafting/OutlineGenerationStep";

export type ParsedOutlineHeading = {
  level: "chapter" | "section";
  title: string;
};

const MAX_HEADING_LEN = 120;

/** 从政策体例文本中识别章节标题行 */
export function parseOutlineHeadingsFromText(text: string): ParsedOutlineHeading[] {
  const headings: ParsedOutlineHeading[] = [];
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.replace(/\u00a0/g, " ").trim();
    if (!line) continue;
    const heading = detectOutlineHeading(line);
    if (heading) headings.push(heading);
  }

  return headings;
}

function detectOutlineHeading(line: string): ParsedOutlineHeading | null {
  if (line.length > MAX_HEADING_LEN) return null;

  if (/^第[零一二三四五六七八九十百千万\d]+章/.test(line)) {
    return { level: "chapter", title: line };
  }

  if (/^第[零一二三四五六七八九十百千万\d]+条/.test(line)) {
    return { level: "section", title: line };
  }

  if (/^[一二三四五六七八九十百千万]+[、.．]\s*\S/.test(line)) {
    return { level: "chapter", title: line };
  }

  if (/^（[一二三四五六七八九十百千万]+）/.test(line) || /^\([一二三四五六七八九十百千万]+\)/.test(line)) {
    return { level: "section", title: line };
  }

  if (/^(总则|附则|政策目标|支持内容|支持方向|申报条件|申报流程|组织实施|监督管理|保障措施)$/.test(line)) {
    return { level: "chapter", title: line };
  }

  return null;
}

/** 将识别到的标题列表转为可编辑大纲结构 */
export function buildOutlineSectionsFromHeadings(headings: ParsedOutlineHeading[]): OutlineSection[] {
  if (headings.length === 0) return [];

  const sections: OutlineSection[] = [];
  let current: OutlineSection | null = null;
  let chapterIndex = 0;
  let subIndex = 0;
  const stamp = Date.now();

  const ensureChapter = (title: string) => {
    chapterIndex += 1;
    subIndex = 0;
    current = {
      id: `template-ch-${stamp}-${chapterIndex}`,
      title,
      keyPoints: [],
      subSections: [],
    };
    sections.push(current);
  };

  for (const heading of headings) {
    if (heading.level === "chapter") {
      ensureChapter(heading.title);
      continue;
    }

    if (!current) {
      ensureChapter("第一章 总则");
    }

    subIndex += 1;
    const sub: OutlineSubSection = {
      id: `${current!.id}-sub-${subIndex}`,
      title: heading.title,
      keyPoints: [],
      referencePolicies: [],
    };
    current!.subSections.push(sub);
  }

  if (sections.length === 0) {
    return headings.map((h, index) => ({
      id: `template-ch-${stamp}-${index + 1}`,
      title: h.title,
      keyPoints: [],
      subSections: [],
    }));
  }

  return sections;
}

export async function readPolicyTemplateFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
    return file.text();
  }

  if (name.endsWith(".docx")) {
    const buffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
    return value;
  }

  if (name.endsWith(".doc")) {
    throw new Error("暂不支持 .doc 格式，请另存为 .docx 或 .txt 后上传");
  }

  if (name.endsWith(".pdf")) {
    throw new Error("暂不支持 PDF，请使用 Word（.docx）或 TXT 文件");
  }

  throw new Error("不支持的文件格式，请上传 .docx、.txt 或 .md");
}

/** 读取本地体例模版并解析为政策大纲章节结构 */
export async function parsePolicyOutlineTemplate(file: File): Promise<OutlineSection[]> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("文件大小不能超过 20MB");
  }

  const text = await readPolicyTemplateFile(file);
  const headings = parseOutlineHeadingsFromText(text);

  if (headings.length === 0) {
    throw new Error(
      "未识别到大纲标题，请确认体例模版中包含「第一章」「一、」「第一条」或「（一）」等章节标题",
    );
  }

  return buildOutlineSectionsFromHeadings(headings);
}
