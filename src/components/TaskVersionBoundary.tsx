import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Download, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { TaskVersionViewContext } from "@/lib/taskVersionView";
import { loadPolicyDraftingTasks } from "@/lib/policyDraftingTasks";
import { loadPolicyCompareAnalysisTasks } from "@/lib/policyCompareAnalysisTasks";
import { loadPolicyPreAssessmentTasks } from "@/lib/policyPreAssessmentTasks";
import { loadPolicyEvaluationTasks } from "@/lib/policyEvaluationTasks";
import { loadPolicyReportTasks } from "@/lib/policyReportTasks";
import { readFundingTasks } from "@/lib/fundingTasks";
import { POLICY_ESTIMATION_TASKS } from "@/lib/policyEstimationTasks";
import { reportDetail } from "@/data/mockData";
import { archiveTaskVersion, archivedTaskVersion, taskArchiveState, versionProgress, deleteTaskVersion, rerunTaskVersion, readTaskVersions, recordTaskVersion, versionPermissions, versionStatus, type TaskKind, type TaskVersion, type VersionTask } from "@/lib/taskVersions";

const TaskHistoryContext = createContext<{ open: () => void; disabled: boolean; notice?: { number: number; onSelect: () => void } } | null>(null);
export function TaskVersionNotice() {
  const notice = useContext(TaskHistoryContext)?.notice;
  return notice ? <div role="status" className="mr-auto flex min-w-0 flex-1 items-start gap-2 self-center rounded border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><p>该任务的第{notice.number}版已归档，当前版本仅支持查看和下载。如需继续编辑，请前往已归档版本进行操作。<Button variant="link" size="sm" className="ml-2 inline-flex h-auto whitespace-nowrap px-0 py-0 text-xs" onClick={notice.onSelect}>前往第{notice.number}版</Button></p></div> : null;
}
export function TaskHistoryButton() {
  const history = useContext(TaskHistoryContext);
  return history ? <Button size="sm" variant="outline" className="gap-1.5" disabled={history.disabled} onClick={history.open}><History className="h-4 w-4" />版本管理</Button> : null;
}

function taskContext(path: string, search: string) {
  const params = new URLSearchParams(search);
  const id = params.get("taskId");
  let kind: TaskKind;
  let tasks: VersionTask[];
  if (path === "/policy-writing/drafting") { kind = "drafting"; tasks = loadPolicyDraftingTasks(); }
  else if (path === "/policy-writing/pre-evaluation") { kind = "preAssessment"; tasks = loadPolicyPreAssessmentTasks(); }
  else if (path === "/policy-writing/model-estimation") { kind = "funding"; tasks = [...readFundingTasks(), ...POLICY_ESTIMATION_TASKS]; }
  else if (path === "/policy-analysis") {
    kind = params.get("mode")?.startsWith("compare") ? "compare" : "evaluation";
    tasks = kind === "compare" ? loadPolicyCompareAnalysisTasks() : loadPolicyEvaluationTasks();
  } else if (/^\/policy-report\/[^/]+$/.test(path) && !["tasks", "create"].includes(path.split("/").at(-1)!)) {
    kind = "report"; tasks = loadPolicyReportTasks();
    const reportId = decodeURIComponent(path.split("/").at(-1)!);
    return { kind, task: tasks.find(t => t.id === reportId) ?? readTaskVersions(kind, reportId).at(-1)?.task };
  } else return null;
  let task = id ? tasks.find(t => t.id === id) : undefined;
  if (id && !task) task = readTaskVersions(kind, id).at(-1)?.task;
  if (!task && !id) {
    // Newly generated tasks may not yet have an ID in the URL.
    const prefix = `task-versions:v1:${kind}:`;
    const versions = Object.keys(localStorage).filter(k => k.startsWith(prefix)).flatMap(k => {
      const history = readTaskVersions(kind, k.slice(prefix.length));
      return history.length ? [history.at(-1)!] : [];
    }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    if (versions[0]) task = tasks.find(t => t.id === versions[0].task.id) ?? versions[0].task;
  }
  return { kind, task };
}


export function TaskVersionBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [, update] = useState(0);
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleting, setDeleting] = useState<TaskVersion | null>(null);
  const [archiving, setArchiving] = useState<TaskVersion | null>(null);
  useEffect(() => {
    const refresh = () => update(n => n + 1);
    const fail = () => setSaveError(true);
    window.addEventListener("task-versions-changed", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("task-version-error", fail);
    return () => { window.removeEventListener("task-versions-changed", refresh); window.removeEventListener("storage", refresh); window.removeEventListener("task-version-error", fail); };
  }, []);
  const context = taskContext(location.pathname, location.search);
  const kind = context?.kind;
  const showHistoryEntry = kind !== "compare" && kind !== "funding";
  const localHistoryEntry = kind === "drafting" || kind === "preAssessment" || kind === "evaluation";
  const task = context?.task;
  const versions = kind && task ? readTaskVersions(kind, task.id) : [];
  const requestedId = new URLSearchParams(location.search).get("taskVersion");
  const selected = versions.find(v => v.id === requestedId);
  const archived = archivedTaskVersion(versions);
  const archiveState = taskArchiveState(versions);
  const latest = versions.at(-1);
  const viewing = selected ?? archived ?? (archiveState?.deleted ? latest : undefined);
  const originalDraft = kind === "drafting" && !!viewing && versionPermissions(viewing, versions).edit && (viewing.id === archived?.id || new URLSearchParams(location.search).get("editVersion") === "1");
  const editableKind = kind === "drafting" || kind === "preAssessment" || kind === "evaluation";
  const readOnly = !!viewing && (!editableKind || !versionPermissions(viewing, versions).edit || (!archivedTaskVersion([viewing]) && new URLSearchParams(location.search).get("editVersion") !== "1"));
  useEffect(() => {
    if (!kind || !task || requestedId || versions.length) return;
    try { recordTaskVersion(kind, task, kind === "report" ? { report: reportDetail } : undefined); } catch { setSaveError(true); }
  }, [kind, task?.id, requestedId, versions.length]);
  if (!context) return <>{children}</>;
  function switchVersion(version?: TaskVersion, edit = false) {
    const params = new URLSearchParams(location.search);
    if (task && kind !== "report") params.set("taskId", task.id);
    if (version) params.set("taskVersion", version.id); else params.delete("taskVersion");
    if (edit) params.set("editVersion", "1"); else params.delete("editVersion");
    window.location.hash = `${location.pathname}?${params.toString()}`;
    window.location.reload();
  }
  function download(version: TaskVersion) {
    if (!versionPermissions(version, readTaskVersions(kind!, version.task.id)).download) return;
    const blob = new Blob([JSON.stringify({ task: version.task, ...version.extra }, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${version.task.title}-第${version.number}版.json`; link.click(); URL.revokeObjectURL(url);
  }
  function actions(version: TaskVersion) {
    const permissions = versionPermissions(version, versions);
    const detailOnly = kind === "drafting" || kind === "preAssessment" || kind === "evaluation";
    return <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => switchVersion(version)}>查看详情</Button>
      {!detailOnly && permissions.archive && <Button size="sm" variant="outline" onClick={() => setArchiving(version)}>归档</Button>}
      {!detailOnly && permissions.rerun && <Button size="sm" variant="outline" onClick={() => { try { rerunTaskVersion(kind!, version.task.id, version.id); switchVersion(); } catch (error) { toast.error((error as Error).message); } }}>基于此版本重跑</Button>}
      <Button size="sm" variant="outline" className="text-primary" disabled={!permissions.remove} title={versions.length <= 1 ? "至少保留一个任务版本" : undefined} onClick={() => setDeleting(version)}>删除</Button>
    </div>;
  }
  return <TaskHistoryContext.Provider value={{ open: () => setOpen(true), disabled: !task, notice: (kind === "drafting" || kind === "preAssessment" || kind === "evaluation") && archived && viewing?.id !== archived.id ? { number: archived.number, onSelect: () => switchVersion(archived) } : undefined }}><div className="flex h-full min-h-0 flex-col">
    {saveError && <p role="alert" className="bg-red-50 px-6 py-2 text-sm text-primary">历史版本保存失败，请检查浏览器存储空间。</p>}
    {kind !== "preAssessment" && kind !== "evaluation" && ((showHistoryEntry && !localHistoryEntry) || (viewing && kind !== "drafting") || (requestedId && !selected)) && <div className="flex flex-wrap items-center justify-end gap-3 border-b bg-white px-6 py-3">
      {viewing && <span className="mr-auto text-sm text-muted-foreground">第 {viewing.number} 版 · {originalDraft ? "可编辑" : "版本详情"}</span>}
      {kind !== "preAssessment" && kind !== "evaluation" && viewing && versionPermissions(viewing, versions).download && <Button size="sm" variant="outline" onClick={() => download(viewing)}><Download className="mr-2 h-4 w-4" />下载此版本</Button>}
      {showHistoryEntry && !localHistoryEntry && <Button size="sm" variant="outline" disabled={!task} onClick={() => setOpen(true)}><History className="mr-2 h-4 w-4" />版本管理</Button>}
    </div>}
    <div className="min-h-0 flex-1 overflow-y-auto">
      {viewing?.task.error && <p role="alert" className="mx-6 mt-4 rounded border border-red-100 bg-red-50 p-3 text-sm text-primary">失败信息：{viewing.task.error}</p>}
      {kind !== "drafting" && kind !== "preAssessment" && kind !== "evaluation" && archived && viewing?.id !== archived.id && <div className="mx-6 mt-4 flex gap-3 border border-blue-100 bg-blue-50 p-4 text-sm leading-6" role="status"><Info className="mt-1 h-4 w-4 shrink-0 text-blue-600" /><div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><p>该任务的第{archived.number}版已归档，当前版本仅支持查看和下载。如需继续编辑，请前往已归档版本进行操作。</p><Button variant="link" className="h-auto shrink-0 whitespace-nowrap px-0 py-0" onClick={() => switchVersion(archived)}>前往第{archived.number}版</Button></div></div>}
      {archiveState?.deleted && <p role="status" className="mx-6 mt-4 bg-blue-50 p-3 text-sm">该任务的第{archiveState.number}版已归档并删除，其他版本仅支持查看和下载，不能编辑或重跑。</p>}
      {requestedId && !selected ? <p role="alert" className="p-6">未找到该历史版本，请通过“版本管理”选择其他版本。</p> : <TaskVersionViewContext.Provider value={{ version: viewing, readOnly, canRun: !viewing && !archiveState }}><div className="h-full min-h-0" data-task-readonly={readOnly || undefined} onClickCapture={event => {
        const button = (event.target as HTMLElement).closest("button");
        if (!button || button.closest("[data-version-navigation]") || button.getAttribute("role") === "tab") return;
        const label = button.getAttribute("aria-label") || button.textContent || "";
        const mutation = /生成|重跑|重试|开始|添加|新增|删除|清空|提交|归档|上传|保存|停止|编辑|修改|应用|替换|插入|评估|审稿|校稿|资金测算/.test(label);
        if ((readOnly && mutation && !/历史|查看|下载|返回/.test(label)) || (viewing && /重新生成|重跑|重试|开始.*分析|开始.*测算/.test(label))) { event.preventDefault(); event.stopPropagation(); }
      }}>{children}</div></TaskVersionViewContext.Provider>}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent aria-describedby={undefined} className="max-w-6xl"><DialogHeader><DialogTitle>版本管理</DialogTitle></DialogHeader><div className="max-h-[65vh] overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{["版本", "状态", "当前进度", "创建时间", "修改时间", "版本管理"].map(label => <th key={label} className="whitespace-nowrap border-b p-3">{label}</th>)}</tr></thead><tbody>{[...versions].reverse().map(version => <tr key={version.id}><td className="whitespace-nowrap border-b p-3">第 {version.number} 版</td><td className="whitespace-nowrap border-b p-3">{versionStatus(version)}</td><td className="whitespace-nowrap border-b p-3">{versionProgress(kind!, version)}</td><td className="whitespace-nowrap border-b p-3">{new Date(version.createdAt ?? version.savedAt).toLocaleString("zh-CN")}</td><td className="whitespace-nowrap border-b p-3">{new Date(version.updatedAt ?? version.savedAt).toLocaleString("zh-CN")}</td><td className="min-w-72 border-b p-3">{actions(version)}</td></tr>)}</tbody></table>{!versions.length && <p className="py-8 text-center text-sm text-muted-foreground">暂无历史版本</p>}</div></DialogContent></Dialog>
    <AlertDialog open={!!deleting} onOpenChange={value => { if (!value) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除第{deleting?.number}版</AlertDialogTitle><AlertDialogDescription>删除后无法恢复。仅删除此历史版本，不影响其他版本及当前任务。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { if (!deleting) return; try { const remaining = deleteTaskVersion(kind!, deleting.task.id, deleting.id); setDeleting(null); if (selected?.id === deleting.id) switchVersion(archivedTaskVersion(remaining) ?? remaining.at(-1)); toast.success("版本已删除"); } catch (error) { toast.error((error as Error).message); } }}>确认删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={!!archiving} onOpenChange={value => { if (!value) setArchiving(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认归档第{archiving?.number}版</AlertDialogTitle><AlertDialogDescription>归档后不可取消。仅归档版本可以编辑，其他版本仅支持查看和下载，所有版本均不能重跑。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { if (!archiving) return; try { const next = archiveTaskVersion(kind!, archiving.task.id, archiving.id); switchVersion(next); } catch (error) { toast.error((error as Error).message); } }}>确认归档</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TaskHistoryContext.Provider>;
}
