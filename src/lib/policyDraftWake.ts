/** 与 PolicyDraftingFlow / AiAssistant 共用的本地草稿未完成状态 */

export const POLICY_DRAFT_OUTLINE_KEY = "policy-draft-outline";
export const POLICY_DRAFT_COMPLETED_KEY = "policy-draft-completed";
const WAKE_DISMISS_KEY = "policy-draft-wake-dismissed";

export type PendingDraftWake = {
  title: string;
  /** 用于与「忽略」状态对齐，大纲变更后会变化 */
  signature: string;
};

/**
 * 生成任务提醒文案（未完成草稿）
 * @param title - 草稿标题
 */
export function buildDraftWakeMessage(title: string): string {
  return `您上次有一项未完成的政策草稿「${title}」，是否继续完善？`;
}

function readDismissedSignature(): string | null {
  try {
    const raw = window.localStorage.getItem(WAKE_DISMISS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { signature?: string };
    return typeof parsed?.signature === "string" ? parsed.signature : null;
  } catch {
    return null;
  }
}

/**
 * 存在未完成草稿且用户未对当前草稿点「忽略」时返回信息
 */
export function getPendingDraftWake(): PendingDraftWake | null {
  try {
    if (window.localStorage.getItem(POLICY_DRAFT_COMPLETED_KEY) === "1") return null;
    const raw = window.localStorage.getItem(POLICY_DRAFT_OUTLINE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { title?: string; savedAt?: number };
    const title = typeof saved?.title === "string" ? saved.title.trim() : "";
    if (!title) return null;
    const savedAt = typeof saved?.savedAt === "number" ? saved.savedAt : 0;
    const signature = `${title}|${savedAt}`;
    if (readDismissedSignature() === signature) return null;
    return { title, signature };
  } catch {
    return null;
  }
}

/**
 * 记录用户忽略当前签名对应的草稿提醒
 * @param signature - 与 {@link getPendingDraftWake} 返回的 signature 一致
 */
export function dismissDraftWake(signature: string): void {
  try {
    window.localStorage.setItem(WAKE_DISMISS_KEY, JSON.stringify({ signature }));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("policy-draft-wake:changed"));
}
