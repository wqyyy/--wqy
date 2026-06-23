const CHINESE_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

export function toChineseNumeral(index: number): string {
  if (index >= 0 && index < CHINESE_NUMERALS.length) return CHINESE_NUMERALS[index];
  return String(index + 1);
}

function stripLeadingMarkers(text: string): string {
  return text
    .trim()
    .replace(/^第[一二三四五六七八九十\d]+条\s*/, "")
    .replace(/^[一二三四五六七八九十]+、\s*/, "")
    .replace(/^[（(][一二三四五六七八九十\d]+[）)]\s*/, "")
    .replace(/^\d+、\s*/, "")
    .replace(/^[（(]\d+[）)]\s*/, "");
}

/** 第一级：一、二、三、四 */
export function formatPolicyLevel1(index: number, title: string): string {
  const body = stripLeadingMarkers(title);
  return `${toChineseNumeral(index)}、${body}`;
}

/** 第二级：（一）、（二）、（三）、（四） */
export function formatPolicyLevel2(index: number, title: string): string {
  const trimmed = title.trim();
  if (/^[（(][一二三四五六七八九十\d]+[）)]/.test(trimmed)) return trimmed;
  const body = stripLeadingMarkers(title);
  return `（${toChineseNumeral(index)}）${body}`;
}

/** 第三级：1、2、3、4 */
export function formatPolicyLevel3(index: number, text: string): string {
  const body = stripLeadingMarkers(text);
  return `${index + 1}、${body}`;
}

/** 识别政策正文中的层级标题行（一至三级） */
export function isPolicyStructureHeadingLine(line: string, policyTitle?: string): boolean {
  const text = line.replace(/\[ref:\d+\]/g, "").trim();
  if (!text) return false;
  if (policyTitle && text === policyTitle.trim()) return true;
  return /^(第[一二三四五六七八九十\d]+[章节条]|[一二三四五六七八九十]+、|\d+、|[（(][一二三四五六七八九十]+[）)]|附则|总则|支持内容|申报条件|申报流程)/.test(
    text,
  );
}
