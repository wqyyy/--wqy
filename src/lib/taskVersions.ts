export type TaskKind = "drafting" | "compare" | "funding" | "preAssessment" | "evaluation" | "report";
export type VersionTask = { id: string; title: string; status?: string; archived?: boolean; createdAt?: string; updatedAt?: string; stopped?: boolean; error?: string };
export type TaskVersion = { id: string; number: number; savedAt: string; createdAt?: string; updatedAt?: string; task: VersionTask; extra?: Record<string, unknown>; archiveLock?: { id: string; number: number; deleted: true } };
const key = (kind: TaskKind, id: string) => `task-versions:v1:${kind}:${id}`;
export function selectedTaskVersion(kind: TaskKind, taskId: string) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const id = params.get("taskVersion");
  return id ? readTaskVersions(kind, taskId).find(v => v.id === id) : undefined;
}
export function taskFromVersion<T extends VersionTask>(kind: TaskKind, taskId: string, current?: T): T | undefined {
  const version = selectedTaskVersion(kind, taskId);
  const versions = readTaskVersions(kind, taskId);
  const fallback = taskArchiveState(versions)?.deleted ? versions.at(-1) : undefined;
  return version || fallback ? structuredClone((version ?? fallback)!.task) as T : current;
}
export function saveViewedTaskVersion(kind: TaskKind, tasks: VersionTask[]) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  if (!params.has("taskVersion")) return false;
  const taskId = params.get("taskId");
  const task = tasks.find(t => t.id === taskId);
  const version = taskId ? selectedTaskVersion(kind, taskId) : undefined;
  if (task && version && versionPermissions(version, readTaskVersions(kind, task.id)).edit && (params.get("editVersion") === "1" || archivedTaskVersion([version]))) {
    editTaskVersion(kind, task.id, version.id, task, version.extra);
  }
  return true;
}
export function readTaskVersions(kind: TaskKind, id: string): TaskVersion[] {
  try { const value = JSON.parse(localStorage.getItem(key(kind, id)) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function signature(value: unknown): string {
  return JSON.stringify(value, (k, v) => k === "updatedAt" ? undefined : v);
}
export function recordTaskVersion<T extends VersionTask>(kind: TaskKind, task: T, extra?: Record<string, unknown>) {
  const versions = readTaskVersions(kind, task.id);
  if (kind === "drafting" && !extra) {
    try { const session = JSON.parse(localStorage.getItem(`policy-draft-session:${task.id}`) || "null"); if (session) extra = { session }; } catch { /* No usable session. */ }
  }
  const previous = versions.at(-1);
  if (kind === "report" && !extra && previous?.extra) extra = previous.extra;
  if (previous && signature({ task: previous.task, extra: previous.extra }) === signature({ task, extra })) return previous;
  const archived = archivedTaskVersion(versions);
  if (taskArchiveState(versions)?.deleted) return previous;
  if (archived) {
    if (task.archived || task.status === "已归档") return editTaskVersion(kind, task.id, archived.id, task, extra);
    return archived;
  }
  const now = new Date().toISOString();
  const counterKey = `task-version-counter:v1:${kind}:${task.id}`;
  const number = Math.max(Number(localStorage.getItem(counterKey)) || 0, ...versions.map(v => v.number), 0) + 1;
  const version: TaskVersion = { id: crypto.randomUUID(), number, savedAt: now, createdAt: now, updatedAt: now, task, extra };
  localStorage.setItem(counterKey, String(number));
  localStorage.setItem(key(kind, task.id), JSON.stringify([...versions, version]));
  window.dispatchEvent(new CustomEvent("task-versions-changed"));
  return version;
}
export function recordTaskCollection(kind: TaskKind, storageKey: string, tasks: VersionTask[], extra?: Record<string, unknown>) {
  try {
  let previous: VersionTask[] = [];
  try { previous = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { /* First save. */ }
  for (const task of tasks) {
    const before = previous.find(p => p.id === task.id);
    if (before && signature(before) === signature(task)) continue;
    if (before && !readTaskVersions(kind, task.id).length) recordTaskVersion(kind, before, extra);
    recordTaskVersion(kind, task, extra);
  }
  } catch {
    window.dispatchEvent(new CustomEvent("task-version-error"));
  }
}
export function archivedTaskVersion(versions: TaskVersion[]) {
  return versions.find(v => v.task.archived || v.task.status === "已归档" || (v.extra?.session as { archived?: boolean } | undefined)?.archived);
}
export function taskArchiveState(versions: TaskVersion[]) {
  const archived = archivedTaskVersion(versions);
  return archived ? { id: archived.id, number: archived.number, deleted: false } : versions.find(v => v.archiveLock)?.archiveLock;
}

export function versionStatus(version: TaskVersion) {
  if (archivedTaskVersion([version])) return "已归档";
  if (version.task.stopped || ["已停止", "停止"].includes(version.task.status ?? "")) return "已停止";
  if (version.task.error || ["失败", "已失败", "生成失败", "分析失败"].includes(version.task.status ?? "")) return "失败";
  const session = version.extra?.session as { body?: string } | undefined;
  if (["已完成", "已分析完成", "成功"].includes(version.task.status ?? "") || session?.body) return "成功";
  return version.task.status ?? "进行中";
}
export function versionProgress(kind: TaskKind, version: TaskVersion) {
  const total = { drafting: 6, compare: 4, funding: 3, preAssessment: 8, evaluation: 6, report: 3 }[kind];
  const task = version.task as VersionTask & { currentStep?: number; step?: number; flowVersion?: number; result?: unknown; completedCount?: number };
  const session = version.extra?.session as { currentStep?: number; body?: string } | undefined;
  let step = task.currentStep;
  if (archivedTaskVersion([version])) step = total;
  else if (kind === "drafting" && session?.currentStep != null) step = session.currentStep === 5 && session.body ? 6 : session.currentStep;
  else if (kind === "funding" && task.step != null) {
    step = task.flowVersion === 2 ? task.step : task.step >= 3 ? 2 : 1;
    if (step === 2 && task.result) step = 3;
  } else if (step == null && versionStatus(version) === "成功") step = total;
  else if (step == null && kind === "evaluation" && task.completedCount != null) step = task.completedCount + 1;
  return typeof step === "number" && Number.isFinite(step) ? `第 ${Math.max(1, Math.min(total, Math.trunc(step)))} / ${total} 步` : "进度未记录";
}
export function versionPermissions(version: TaskVersion, versions: TaskVersion[]) {
  const archived = taskArchiveState(versions);
  const status = versionStatus(version);
  const success = status === "成功" || status === "已归档";
  return { view: true, edit: success && (!archived || archived.id === version.id), download: success, archive: success && !archived, rerun: !archived && ["成功", "失败", "已停止"].includes(status), remove: versions.length > 1 };
}
function writeVersions(kind: TaskKind, id: string, versions: TaskVersion[]) {
  if (versions.filter(version => archivedTaskVersion([version])).length > 1) throw new Error("每个任务只能有一个已归档版本");
  localStorage.setItem(key(kind, id), JSON.stringify(versions));
  window.dispatchEvent(new CustomEvent("task-versions-changed"));
}
export function deleteTaskVersion(kind: TaskKind, taskId: string, versionId: string) {
  const versions = readTaskVersions(kind, taskId);
  const version = versions.find(v => v.id === versionId);
  if (!version) throw new Error("该版本不存在");
  if (versions.length <= 1) throw new Error("至少保留一个任务版本");
  const counterKey = `task-version-counter:v1:${kind}:${taskId}`;
  localStorage.setItem(counterKey, String(Math.max(Number(localStorage.getItem(counterKey)) || 0, ...versions.map(v => v.number))));
  const kept = versions.filter(v => v.id !== versionId);
  const survivingArchive = archivedTaskVersion(kept);
  const remaining = kept.map(v => archivedTaskVersion([version]) && !survivingArchive ? { ...v, archiveLock: { id: version.id, number: version.number, deleted: true as const } } : v);
  writeVersions(kind, taskId, remaining);
  if (survivingArchive && archivedTaskVersion([version])) {
    persistLiveTask(kind, survivingArchive.task);
    if (kind === "drafting" && survivingArchive.extra?.session) localStorage.setItem(`policy-draft-session:${taskId}`, JSON.stringify(survivingArchive.extra.session));
  }
  return remaining;
}
export function editTaskVersion(kind: TaskKind, taskId: string, versionId: string, task: VersionTask, extra?: Record<string, unknown>) {
  const versions = readTaskVersions(kind, taskId);
  const version = versions.find(v => v.id === versionId);
  if (!version || !versionPermissions(version, versions).edit) throw new Error("当前版本不可编辑");
  const archived = !!archivedTaskVersion([version]);
  if (!archived && (task.archived || task.status === "已归档" || (extra?.session as { archived?: boolean } | undefined)?.archived)) throw new Error("请通过归档操作确认归档，不能通过编辑更改归档状态");
  const now = new Date().toISOString();
  const next = { ...version, updatedAt: now, task: { ...task, id: taskId, ...(archived ? { status: "已归档", archived: true } : {}), updatedAt: now }, extra: extra ?? version.extra };
  if (signature({ task: next.task, extra: next.extra }) === signature({ task: version.task, extra: version.extra })) return version;
  writeVersions(kind, taskId, versions.map(v => v.id === versionId ? next : v));
  if (archived) persistLiveTask(kind, next.task);
  return next;
}
const taskStorage: Record<TaskKind, string> = { drafting: "policy-drafting-tasks", compare: "policy-compare-analysis-tasks", funding: "funding-estimation-tasks-v1", preAssessment: "policy-pre-assessment-tasks", evaluation: "policy-evaluation-tasks", report: "policy-report-tasks" };
function persistLiveTask(kind: TaskKind, task: VersionTask) {
  let tasks: VersionTask[] = [];
  try { tasks = JSON.parse(localStorage.getItem(taskStorage[kind]) || "[]"); } catch { /* No task cache. */ }
  localStorage.setItem(taskStorage[kind], JSON.stringify([{ ...tasks.find(t => t.id === task.id), ...task }, ...tasks.filter(t => t.id !== task.id)]));
}
export function archiveTaskVersion(kind: TaskKind, taskId: string, versionId: string) {
  const versions = readTaskVersions(kind, taskId);
  const existingArchive = taskArchiveState(versions);
  if (existingArchive) throw new Error(`该任务的第${existingArchive.number}版已归档，每个任务只能有一个已归档版本`);
  const version = versions.find(v => v.id === versionId);
  if (!version || !versionPermissions(version, versions).archive) throw new Error("当前版本不可归档");
  const now = new Date().toISOString();
  const session = version.extra?.session as Record<string, unknown> | undefined;
  const next: TaskVersion = { ...version, updatedAt: now, task: { ...version.task, archived: true, status: "已归档", updatedAt: now }, extra: session ? { ...version.extra, session: { ...session, archived: true, currentStep: 5 } } : version.extra };
  persistLiveTask(kind, next.task);
  if (kind === "drafting" && next.extra?.session) localStorage.setItem(`policy-draft-session:${taskId}`, JSON.stringify(next.extra.session));
  writeVersions(kind, taskId, versions.map(v => v.id === versionId ? next : v));
  return next;
}
export function rerunTaskVersion(kind: TaskKind, taskId: string, versionId: string) {
  const versions = readTaskVersions(kind, taskId);
  const version = versions.find(v => v.id === versionId);
  if (!version || !versionPermissions(version, versions).rerun) throw new Error("当前任务不可重跑");
  const source = version.task as VersionTask & Record<string, unknown>;
  const now = new Date().toISOString();
  const task: VersionTask & Record<string, unknown> = { ...source, archived: false, stopped: false, error: undefined, updatedAt: now, status: kind === "compare" ? "分析中" : kind === "drafting" || kind === "report" ? "生成中" : "进行中", currentStep: kind === "compare" ? 3 : 1, completedCount: 0, completedThrough: kind === "compare" ? 2 : 0, results: [], thoughtLogs: [], editableSections: [], reportText: "", result: null, step: 1, maximum: 1, sourceVersionId: versionId };
  if (kind === "compare" && source.snapshot) task.snapshot = { ...(source.snapshot as Record<string, unknown>), results: [] };
  if (kind === "drafting") {
    const session = version.extra?.session as Record<string, unknown> | undefined;
    if (session) localStorage.setItem(`policy-draft-session:${taskId}`, JSON.stringify({ ...session, body: "", currentStep: 1, maxReachedStep: 1, archived: false, stepSignatures: {} }));
  }
  persistLiveTask(kind, task);
  return recordTaskVersion(kind, task);
}
