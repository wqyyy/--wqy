const STORAGE_KEY = "policy-evaluation-completed-titles";
const CHANGED_EVENT = "policy-evaluation:changed";

export function loadEvaluatedPolicyTitles(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function isPolicyEvaluated(title: string): boolean {
  return loadEvaluatedPolicyTitles().includes(title);
}

export function markPolicyEvaluated(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const prev = loadEvaluatedPolicyTitles();
  if (prev.includes(trimmed)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, trimmed]));
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export const policyEvaluationChangedEvent = CHANGED_EVENT;
